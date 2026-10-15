from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from backend.app.compare.service import compare_service
from backend.app.schemas.contracts import (
    CompareRequest, CompareResponse, CompareRunAllResponse
)

router = APIRouter(prefix="/compare", tags=["Compare & Baseline Split Screen"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_comparison(payload: CompareRequest):
    """Starts a concurrent comparison run between Baseline and REWIND X."""
    compare_id = await compare_service.create_and_run(
        goal=payload.goal,
        faults=payload.faults,
        seed=payload.seed
    )
    return {"compare_id": compare_id}

@router.get("/{compare_id}", response_model=CompareResponse)
def get_comparison_result(compare_id: str):
    """Returns baseline and REWIND X execution results for a comparison run."""
    run_data = compare_service.get_run(compare_id)
    if not run_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Compare run {compare_id} not found"
        )
    return CompareResponse(
        baseline=run_data["baseline"],
        rewindx=run_data["rewindx"]
    )

@router.get("/{compare_id}/events")
async def stream_comparison_events(
    compare_id: str,
    last_event_id: Optional[int] = Header(None, alias="Last-Event-ID"),
    last_event_id_query: Optional[int] = Query(None, alias="last_event_id"),
    last_event_id_camel: Optional[int] = Query(None, alias="lastEventId")
):
    """Server-Sent Events stream for compare runs with catch-up replay."""
    effective_last_id = (
        last_event_id 
        if last_event_id is not None 
        else (last_event_id_query if last_event_id_query is not None else last_event_id_camel)
    )
    return StreamingResponse(
        compare_service.event_generator(compare_id=compare_id, last_event_id=effective_last_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/run-all", response_model=CompareRunAllResponse)
def run_all_faults():
    """Evaluates Baseline vs REWIND X across all 8 fault scenarios."""
    results = compare_service.run_all_benchmarks()
    return CompareRunAllResponse(results=results)
