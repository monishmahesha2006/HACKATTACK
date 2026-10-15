from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.recovery.rewind_engine import rewind_engine
from backend.app.schemas.contracts import RewindPreview, RewindResult

router = APIRouter(tags=["Rewind & Compensation"])

@router.post("/missions/{id}/rewind/preview", response_model=RewindPreview)
def preview_rewind(
    id: str,
    payload: Optional[Dict[str, Any]] = None,
    db: Session = Depends(get_db)
):
    target = payload.get("target_step_id") if payload else None
    return rewind_engine.compute_preview(id, db, target)

@router.post("/missions/{id}/rewind", response_model=RewindResult)
async def execute_rewind_route(
    id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db)
):
    preview_hash = payload.get("preview_hash")
    if not preview_hash:
        raise HTTPException(status_code=400, detail="preview_hash is required for atomic rollback")
    target = payload.get("target_step_id")

    try:
        res = await rewind_engine.execute_rewind(id, preview_hash, db, target)
        return res
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

@router.get("/missions/{id}/rewind", response_model=RewindPreview)
def get_rewind_status(id: str, db: Session = Depends(get_db)):
    return rewind_engine.compute_preview(id, db)
