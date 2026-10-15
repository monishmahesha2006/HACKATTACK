import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.events.bus import event_bus
from backend.app.models.entities import EventRecordModel
from backend.app.schemas.contracts import Envelope

router = APIRouter(tags=["Server-Sent Events"])

@router.get("/missions/{id}/events")
async def stream_mission_events(
    id: str,
    last_event_id: Optional[int] = Header(None, alias="Last-Event-ID"),
    last_event_id_query: Optional[int] = Query(None, alias="last_event_id"),
    last_event_id_camel: Optional[int] = Query(None, alias="lastEventId")
):
    """Server-Sent Events stream for a specific mission with catch-up replay and heartbeat."""
    effective_last_id = (
        last_event_id 
        if last_event_id is not None 
        else (last_event_id_query if last_event_id_query is not None else last_event_id_camel)
    )
    return StreamingResponse(
        event_bus.event_generator(mission_id=id, last_event_id=effective_last_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/events")
async def stream_global_events(
    last_event_id: Optional[int] = Header(None, alias="Last-Event-ID"),
    last_event_id_query: Optional[int] = Query(None, alias="last_event_id"),
    last_event_id_camel: Optional[int] = Query(None, alias="lastEventId")
):
    """Global Server-Sent Events stream (approvals, mode changes, security) with catch-up replay."""
    effective_last_id = (
        last_event_id 
        if last_event_id is not None 
        else (last_event_id_query if last_event_id_query is not None else last_event_id_camel)
    )
    return StreamingResponse(
        event_bus.event_generator(mission_id=None, last_event_id=effective_last_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/missions/{id}/events/history", response_model=List[Envelope])
def get_event_history(
    id: str,
    after: int = Query(0),
    db: Session = Depends(get_db)
):
    records = (
        db.query(EventRecordModel)
        .filter(
            EventRecordModel.id > after,
            (EventRecordModel.mission_id == id) | (EventRecordModel.mission_id == None)
        )
        .order_by(EventRecordModel.id.asc())
        .limit(200)
        .all()
    )

    res = []
    for r in records:
        res.append(Envelope(
            id=r.id,
            type=r.type,
            mission_id=r.mission_id,
            step_id=r.step_id,
            correlation_id=r.correlation_id,
            ts=r.ts,
            data=json.loads(r.data) if isinstance(r.data, str) else r.data
        ))
    return res
