from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from backend.app.audit.hash_chain import audit_subsystem
from backend.app.db.session import get_db
from backend.app.models.entities import AuditEventModel, MissionModel, StepModel
from backend.app.schemas.contracts import AuditEvent

router = APIRouter(tags=["Audit & Provenance"])

@router.get("/audit/events", response_model=Dict[str, Any])
def list_audit_events(
    mission_id: Optional[str] = None,
    cursor: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    q = db.query(AuditEventModel)
    if mission_id:
        q = q.filter(AuditEventModel.mission_id == mission_id)
    events = q.order_by(AuditEventModel.seq.desc()).limit(limit).all()

    items = [
        AuditEvent(
            id=e.id,
            seq=e.seq,
            mission_id=e.mission_id,
            step_id=e.step_id,
            type=e.type,
            actor=e.actor,
            tool=e.tool,
            args_hash=e.args_hash,
            result_summary=e.result_summary,
            status=e.status,
            prev_hash=e.prev_hash,
            hash=e.hash,
            ts=e.ts
        )
        for e in events
    ]
    return {"items": items, "next_cursor": None}

@router.get("/audit/verify")
def verify_audit_chain(db: Session = Depends(get_db)):
    return audit_subsystem.verify_chain(db)

@router.post("/audit/tamper-test")
def run_tamper_test():
    return audit_subsystem.run_isolated_tamper_test()

@router.get("/missions/{id}/report")
def get_mission_report_json(id: str, db: Session = Depends(get_db)):
    m = db.query(MissionModel).filter(MissionModel.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mission not found")
    steps = db.query(StepModel).filter(StepModel.mission_id == id).all()
    chain_ver = audit_subsystem.verify_chain(db)

    return {
        "mission_id": id,
        "goal": m.goal,
        "status": m.status,
        "created_at": m.created_at,
        "total_steps": len(steps),
        "audit_chain": chain_ver
    }

@router.get("/missions/{id}/report.md")
def get_mission_report_markdown(id: str, db: Session = Depends(get_db)):
    m = db.query(MissionModel).filter(MissionModel.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mission not found")
    steps = db.query(StepModel).filter(StepModel.mission_id == id).all()
    chain_ver = audit_subsystem.verify_chain(db)

    md = f"""# REWIND X Mission Execution Certificate: {id}

- **Goal:** {m.goal}
- **Status:** {m.status}
- **Phase:** {m.phase}
- **Created At:** {m.created_at}

## Audit Integrity
- **SHA-256 Hash Chain Valid:** {chain_ver.get('valid')}
- **Blocks Verified:** {chain_ver.get('checked')}
- **Head Hash:** `{chain_ver.get('head_hash')}`

## Step Execution Telemetry
"""
    for s in steps:
        md += f"- **Step {s.index} ({s.id}):** {s.description} | Tool: `{s.tool}` | Status: `{s.status}`\n"

    return Response(content=md, media_type="text/markdown")
