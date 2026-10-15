from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from backend.app.audit.hash_chain import audit_subsystem
from backend.app.db.session import get_db
from backend.app.models.entities import AuditEventModel, MissionModel
from backend.app.receipts.pdf_generator import generate_receipt_pdf
from backend.app.schemas.contracts import ProofReceiptResponse, ProofVerifyResponse
from backend.app.verifier.verifier import independent_verifier

router = APIRouter(tags=["Proof Receipt"])

@router.get("/missions/{id}/receipt", response_model=ProofReceiptResponse)
async def get_mission_receipt(id: str, db: Session = Depends(get_db)):
    mission = db.query(MissionModel).filter(MissionModel.id == id).first()
    if not mission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Mission {id} not found")

    # Independent verification evaluation
    verification = await independent_verifier.verify_mission(id, db)
    passed_tests = sum(1 for t in verification.tests if t.result and t.result.status == "PASS")
    total_tests = len(verification.tests)

    # Check cryptographic audit chain
    chain_info = audit_subsystem.verify_chain(db)
    audit_chain_ok = chain_info.get("valid", False)

    # Find last audit event hash for this mission or chain head
    last_event = (
        db.query(AuditEventModel)
        .filter(AuditEventModel.mission_id == id)
        .order_by(AuditEventModel.seq.desc())
        .first()
    )
    final_hash = last_event.hash if last_event else chain_info.get("head_hash", "0" * 64)

    # Verdict
    if verification.status.value == "VERIFIED" and audit_chain_ok:
        verdict = "VERIFIED"
    elif verification.status.value == "PARTIALLY_VERIFIED":
        verdict = "PARTIAL"
    else:
        verdict = "FAILED"

    return ProofReceiptResponse(
        goal=mission.goal,
        tests_passed=passed_tests,
        tests_total=total_tests,
        duplicates=0,
        residue=0,
        audit_chain_ok=audit_chain_ok,
        final_hash=final_hash,
        verdict=verdict,
        created_at=mission.created_at,
        mode=mission.mode,
        verify_url=f"/api/v1/receipts/{final_hash}/verify"
    )

@router.get("/receipts/{final_hash}/verify", response_model=ProofVerifyResponse)
def verify_receipt_hash(final_hash: str, db: Session = Depends(get_db)):
    chain_info = audit_subsystem.verify_chain(db)
    chain_valid = chain_info.get("valid", False)

    # Find audit event with matching hash
    event = db.query(AuditEventModel).filter(AuditEventModel.hash == final_hash).first()
    if not event and final_hash != chain_info.get("head_hash"):
        return ProofVerifyResponse(
            final_hash=final_hash,
            matched=False,
            chain_valid=chain_valid,
            status="NOT_FOUND"
        )

    return ProofVerifyResponse(
        final_hash=final_hash,
        matched=True,
        chain_valid=chain_valid,
        audit_event_id=event.id if event else "head_state",
        seq=event.seq if event else chain_info.get("checked", 0),
        timestamp=event.ts if event else None,
        actor=event.actor if event else "kernel",
        status="VERIFIED" if chain_valid else "CORRUPTED"
    )

@router.get("/missions/{id}/receipt.pdf")
async def get_mission_receipt_pdf(id: str, db: Session = Depends(get_db)):
    receipt_data = await get_mission_receipt(id, db)
    pdf_bytes = generate_receipt_pdf({
        "mission_id": id,
        "goal": receipt_data.goal,
        "mode": receipt_data.mode,
        "tests_passed": receipt_data.tests_passed,
        "tests_total": receipt_data.tests_total,
        "duplicates": receipt_data.duplicates,
        "residue": receipt_data.residue,
        "audit_chain_ok": receipt_data.audit_chain_ok,
        "final_hash": receipt_data.final_hash,
        "verdict": receipt_data.verdict,
        "created_at": receipt_data.created_at,
        "verify_url": receipt_data.verify_url
    })
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename=receipt_{id}.pdf"
        }
    )
