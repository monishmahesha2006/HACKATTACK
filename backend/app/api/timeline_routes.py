import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.entities import EventRecordModel, MissionModel
from backend.app.schemas.contracts import TimelineFault, TimelineResponse, TimelineStage

router = APIRouter(tags=["Mission Timeline"])

@router.get("/missions/{id}/timeline", response_model=TimelineResponse)
def get_mission_timeline(id: str, db: Session = Depends(get_db)):
    mission = db.query(MissionModel).filter(MissionModel.id == id).first()
    if not mission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Mission {id} not found")

    events = (
        db.query(EventRecordModel)
        .filter(EventRecordModel.mission_id == id)
        .order_by(EventRecordModel.id.asc())
        .all()
    )

    stages_dict: Dict[str, Dict[str, Any]] = {
        "predict": {"name": "predict", "started_at": mission.created_at, "ended_at": None, "status": "COMPLETED"},
        "perform": {"name": "perform", "started_at": mission.created_at, "ended_at": None, "status": mission.status},
        "prove": {"name": "prove", "started_at": mission.updated_at, "ended_at": mission.updated_at, "status": "COMPLETED" if mission.status == "COMPLETED" else "PENDING"}
    }

    faults: List[TimelineFault] = []

    for ev in events:
        data = json.loads(ev.data) if isinstance(ev.data, str) else ev.data
        if ev.type in ("stage_started", "stage.started"):
            stage = data.get("stage") or data.get("name")
            if stage:
                stages_dict[stage] = {
                    "name": stage,
                    "started_at": ev.ts,
                    "ended_at": None,
                    "status": "RUNNING"
                }
        elif ev.type in ("stage_done", "stage.completed", "stage.done"):
            stage = data.get("stage") or data.get("name")
            if stage and stage in stages_dict:
                stages_dict[stage]["ended_at"] = ev.ts
                stages_dict[stage]["status"] = data.get("status", "COMPLETED")
        elif ev.type in ("fault_injected", "fault.injected"):
            faults.append(TimelineFault(
                type=data.get("fault") or data.get("type", "unknown_fault"),
                ts=ev.ts,
                step_id=ev.step_id or data.get("step_id")
            ))

    ordered_stages = [TimelineStage(**s) for s in stages_dict.values()]

    return TimelineResponse(
        stages=ordered_stages,
        faults=faults
    )
