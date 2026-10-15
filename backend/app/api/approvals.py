import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.events.bus import event_bus
from backend.app.executor.runner import mission_executor
from backend.app.models.entities import ApprovalModel, MissionModel, StepModel, utc_now_iso
from backend.app.schemas.contracts import Approval
from backend.app.schemas.enums import ApprovalStatus, Risk

router = APIRouter(prefix="/approvals", tags=["Approvals & Interlocks"])

@router.get("", response_model=List[Approval])
def list_approvals(
    status: Optional[str] = None,
    mission_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(ApprovalModel)
    if status:
        q = q.filter(ApprovalModel.status == status)
    if mission_id:
        q = q.filter(ApprovalModel.mission_id == mission_id)
    items = q.all()

    res = []
    for a in items:
        res.append(Approval(
            id=a.id,
            mission_id=a.mission_id,
            step_id=a.step_id,
            status=ApprovalStatus(a.status),
            action=a.action,
            target=a.target,
            args_redacted=json.loads(a.args_redacted) if isinstance(a.args_redacted, str) else a.args_redacted,
            call_hash=a.call_hash,
            expected_changes=json.loads(a.expected_changes) if isinstance(a.expected_changes, str) else a.expected_changes,
            risk=Risk(a.risk),
            risk_explanation=a.risk_explanation,
            compensation_available=a.compensation_available,
            expires_at=a.expires_at,
            decided_at=a.decided_at,
            decided_by=a.decided_by,
            note=a.note
        ))
    return res

@router.post("/{id}/decision")
async def decide_approval(
    id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db)
):
    approval = db.query(ApprovalModel).filter(ApprovalModel.id == id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    decision = payload.get("decision", "").lower()
    note = payload.get("note")
    now_ts = utc_now_iso()

    if decision == "approve":
        approval.status = ApprovalStatus.APPROVED
        approval.decided_at = now_ts
        approval.decided_by = "OPERATOR_LOCAL"
        approval.note = note
        db.commit()

        # Resume mission execution automatically
        step = db.query(StepModel).filter(StepModel.id == approval.step_id).first()
        if step:
            step.status = "PENDING"
            db.commit()
            import asyncio
            asyncio.create_task(mission_executor.execute_mission(approval.mission_id))

    elif decision == "reject":
        approval.status = ApprovalStatus.REJECTED
        approval.decided_at = now_ts
        approval.decided_by = "OPERATOR_LOCAL"
        approval.note = note
        db.commit()

        mission = db.query(MissionModel).filter(MissionModel.id == approval.mission_id).first()
        if mission:
            mission.status = "CANCELLED"
            db.commit()

    elif decision == "edit":
        edited_args = payload.get("edited_args", {})
        approval.args_redacted = json.dumps(edited_args)
        approval.note = f"Arguments edited by operator: {note}"
        db.commit()

    await event_bus.publish(
        event_type="approval.decided",
        data={"approval_id": id, "decision": decision},
        mission_id=approval.mission_id,
        step_id=approval.step_id
    )

    return {"status": "DECISION_RECORDED", "approval_id": id, "decision": decision}
