from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.entities import ClaimModel, GapModel
from backend.app.schemas.contracts import Claim, Gap, VerificationReport
from backend.app.schemas.enums import GapKind, Severity
from backend.app.verifier.verifier import independent_verifier

router = APIRouter(tags=["Verification & Reality Gaps"])

@router.post("/missions/{id}/verify", response_model=VerificationReport)
async def run_verification(id: str, db: Session = Depends(get_db)):
    report = await independent_verifier.verify_mission(id, db)
    return report

@router.get("/missions/{id}/verification", response_model=VerificationReport)
async def get_verification(id: str, db: Session = Depends(get_db)):
    report = await independent_verifier.verify_mission(id, db)
    return report

@router.get("/missions/{id}/gaps", response_model=List[Gap])
def list_gaps(id: str, db: Session = Depends(get_db)):
    gaps = db.query(GapModel).filter(GapModel.mission_id == id).all()
    res = []
    for g in gaps:
        res.append(Gap(
            id=g.id,
            mission_id=g.mission_id,
            kind=GapKind(g.kind),
            severity=Severity(g.severity),
            expected=g.expected,
            observed=g.observed,
            required=g.required,
            evidence_ids=[],
            likely_cause=g.likely_cause,
            safe_next_action=g.safe_next_action,
            needs_human=g.needs_human,
            status=g.status,
            detected_at=g.detected_at
        ))
    return res

@router.post("/missions/{id}/gaps/{gap_id}/repair")
def repair_gap(id: str, gap_id: str, db: Session = Depends(get_db)):
    gap = db.query(GapModel).filter(GapModel.id == gap_id).first()
    if gap and gap.needs_human:
        raise HTTPException(
            status_code=403,
            detail="Repair requires human approval: irreversible or sensitive operation."
        )
    if gap:
        gap.status = "RESOLVED"
        db.commit()
    return {"status": "REPAIRED", "gap_id": gap_id}

@router.get("/missions/{id}/claims", response_model=List[Claim])
async def list_claims(id: str, db: Session = Depends(get_db)):
    report = await independent_verifier.verify_mission(id, db)
    return report.claims
