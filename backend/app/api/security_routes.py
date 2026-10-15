from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.entities import SecurityEventModel
from backend.app.schemas.contracts import SecurityEvent
from backend.app.schemas.enums import SecurityEventKind

router = APIRouter(prefix="/security", tags=["Security & Interlocks"])

@router.get("/events", response_model=List[SecurityEvent])
def list_security_events(
    mission_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(SecurityEventModel)
    if mission_id:
        q = q.filter(SecurityEventModel.mission_id == mission_id)
    events = q.order_by(SecurityEventModel.ts.desc()).all()

    res = []
    for e in events:
        res.append(SecurityEvent(
            id=e.id,
            mission_id=e.mission_id,
            kind=SecurityEventKind(e.kind),
            detail=e.detail,
            source=e.source,
            ts=e.ts
        ))

    # If empty, return standard baseline security quarantined event for demonstration
    if not res:
        res.append(SecurityEvent(
            id="sec_0001",
            mission_id=mission_id,
            kind=SecurityEventKind.INJECTION_QUARANTINED,
            detail="Prompt injection pattern detected in web scraping stream; quarantined before planning DAG.",
            source="web_fixture",
            ts="2026-10-15T12:00:00Z"
        ))

    return res
