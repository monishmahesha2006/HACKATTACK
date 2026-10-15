from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.app.ml.engine import ml_engine
from backend.app.mcp_client.gateway import mcp_gateway
from backend.app.schemas.contracts import (
    AnomalyItem, InternshipRankingItem, ModelEvaluation, ModelInfo, RiskAssessment
)

router = APIRouter(prefix="/ml", tags=["Intelligence Lab & ML"])

@router.get("/models", response_model=List[ModelInfo])
def get_models():
    return ml_engine.get_model_info_list()

@router.get("/models/{name}/evaluation", response_model=ModelEvaluation)
def get_evaluation(name: str):
    eval_rep = ml_engine.get_model_evaluation(name)
    if not eval_rep:
        raise HTTPException(status_code=404, detail=f"Evaluation report for {name} not found")
    return eval_rep

@router.post("/infer/failure")
def infer_failure(payload: Dict[str, Any]):
    return ml_engine.infer_failure(payload)

@router.post("/infer/risk", response_model=RiskAssessment)
def infer_risk(payload: Dict[str, Any]):
    tool = payload.get("tool", "")
    args = payload.get("args")
    return ml_engine.infer_risk(tool, args)

@router.get("/anomalies", response_model=List[AnomalyItem])
def get_anomalies(limit: int = 20):
    return [
        AnomalyItem(
            ts="2026-10-15T12:04:12Z",
            tool="append_row",
            metric="latency_burst_ms",
            score=0.94,
            threshold=0.85,
            flagged=True,
            injected=True
        ),
        AnomalyItem(
            ts="2026-10-15T12:08:45Z",
            tool="search",
            metric="retry_burst",
            score=0.89,
            threshold=0.85,
            flagged=True,
            injected=False
        ),
        AnomalyItem(
            ts="2026-10-15T12:15:30Z",
            tool="assess_internship_eligibility",
            metric="latency_ewma",
            score=0.12,
            threshold=0.85,
            flagged=False,
            injected=False
        )
    ]

@router.get("/ranking/{mission_id}", response_model=List[InternshipRankingItem])
async def get_ranking(mission_id: str):
    # Fetch rankings from domain MCP server
    pages, _ = await mcp_gateway.invoke_tool(
        server_id="web_fixture",
        tool_name="search",
        arguments={"query": "aiml internship third year 2026", "limit": 5}
    )
    full_pages = []
    for p in pages:
        fp, _ = await mcp_gateway.invoke_tool(
            server_id="web_fixture",
            tool_name="fetch",
            arguments={"url": p["url"]}
        )
        full_pages.append(fp)

    ranked, _ = await mcp_gateway.invoke_tool(
        server_id="rewindx_domain",
        tool_name="rank_internship_opportunities",
        arguments={"opportunities": full_pages}
    )

    items = []
    for r in ranked:
        items.append(InternshipRankingItem(
            opportunity_id=r["opportunity_id"],
            rank=r["rank"],
            score=r["score"],
            contributions=r["contributions"],
            eligibility=r["eligibility"],
            why_ranked_above_next=r.get("why_ranked_above_next")
        ))
    return items
