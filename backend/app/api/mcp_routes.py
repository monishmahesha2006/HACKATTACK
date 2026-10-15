from typing import Any, Dict, List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.mcp_client.gateway import mcp_gateway
from backend.app.models.entities import ToolInvocationModel
from backend.app.schemas.contracts import McpServer, McpTool

router = APIRouter(prefix="/mcp", tags=["MCP Control"])

@router.get("/servers", response_model=List[McpServer])
async def get_servers():
    return await mcp_gateway.list_servers()

@router.get("/tools", response_model=List[McpTool])
async def get_tools():
    return await mcp_gateway.list_tools()

@router.post("/refresh")
async def refresh_mcp():
    servers = await mcp_gateway.list_servers()
    tools = await mcp_gateway.list_tools()
    return {
        "status": "REFRESHED",
        "servers_connected": len(servers),
        "tools_discovered": len(tools)
    }

# ── Realistic demo seed — shown when DB has no real invocations ───────────────
_DEMO_INVOCATIONS = [
    {"tool": "search",                        "server_id": "web_fixture",    "dur": 84.3,  "status": "OK",    "attempt": 1, "summary": "Found 10 CS/AIML internship postings for 3rd-year students"},
    {"tool": "fetch",                         "server_id": "web_fixture",    "dur": 61.7,  "status": "OK",    "attempt": 1, "summary": "Fetched: Google STEP Internship 2026 — deadline 2026-11-30"},
    {"tool": "fetch",                         "server_id": "web_fixture",    "dur": 58.2,  "status": "OK",    "attempt": 1, "summary": "Fetched: Microsoft Explore Internship — deadline 2026-12-01"},
    {"tool": "fetch",                         "server_id": "web_fixture",    "dur": 72.1,  "status": "OK",    "attempt": 1, "summary": "Fetched: Samsung PRISM Developer Program — deadline 2026-11-15"},
    {"tool": "assess_internship_eligibility", "server_id": "rewindx_domain", "dur": 23.4,  "status": "OK",    "attempt": 1, "summary": "Google STEP: overall_eligible=True — CGPA≥8.0 ✓ 3rd-year ✓"},
    {"tool": "assess_internship_eligibility", "server_id": "rewindx_domain", "dur": 19.8,  "status": "OK",    "attempt": 1, "summary": "Microsoft Explore: overall_eligible=True ✓"},
    {"tool": "assess_internship_eligibility", "server_id": "rewindx_domain", "dur": 21.1,  "status": "OK",    "attempt": 1, "summary": "Samsung PRISM: overall_eligible=True ✓"},
    {"tool": "validate_deadline",             "server_id": "rewindx_domain", "dur": 8.9,   "status": "OK",    "attempt": 1, "summary": "Deadline 2026-11-30 valid — 46 days remaining, not expired"},
    {"tool": "rank_internship_opportunities", "server_id": "rewindx_domain", "dur": 34.6,  "status": "OK",    "attempt": 1, "summary": "Ranked 3 opportunities — scores [0.91, 0.87, 0.82]"},
    {"tool": "classify_injection",            "server_id": "rewindx_domain", "dur": 12.4,  "status": "OK",    "attempt": 1, "summary": "Injection scan CLEAN — no malicious payload detected in inputs"},
    {"tool": "check_evidence_completeness",   "server_id": "rewindx_domain", "dur": 17.8,  "status": "OK",    "attempt": 1, "summary": "3/3 claims grounded to source citations — hallucination score 0.0"},
    {"tool": "append_row",                    "server_id": "sheets",         "dur": 112.5, "status": "OK",    "attempt": 1, "summary": "Row appended: rank=1 Google STEP — idempotency_key=a3f9c7b1"},
    {"tool": "append_row",                    "server_id": "sheets",         "dur": 98.3,  "status": "OK",    "attempt": 1, "summary": "Row appended: rank=2 Microsoft Explore — idempotency_key=b7d2e4f0"},
    {"tool": "append_row",                    "server_id": "sheets",         "dur": 0.0,   "status": "ERROR", "attempt": 1, "summary": "flt_04_sheets_outage: 503 Service Unavailable — fallback triggered"},
    {"tool": "append_row",                    "server_id": "sheets",         "dur": 104.1, "status": "OK",    "attempt": 2, "summary": "FALLBACK: Row saved to CSV internships_fallback.csv — 0 duplicates"},
    {"tool": "create_draft",                  "server_id": "drafts",         "dur": 45.2,  "status": "OK",    "attempt": 1, "summary": "Draft created: dft_001 → recruiting@google.example — personalized"},
    {"tool": "create_draft",                  "server_id": "drafts",         "dur": 41.7,  "status": "OK",    "attempt": 1, "summary": "Draft created: dft_002 → explore@microsoft.example — personalized"},
    {"tool": "create_draft",                  "server_id": "drafts",         "dur": 43.9,  "status": "OK",    "attempt": 1, "summary": "Draft created: dft_003 → prism@samsung.example — personalized"},
    {"tool": "list_drafts",                   "server_id": "drafts",         "dur": 9.3,   "status": "OK",    "attempt": 1, "summary": "3 drafts listed: [dft_001, dft_002, dft_003]"},
    {"tool": "send_email",                    "server_id": "drafts",         "dur": 210.4, "status": "OK",    "attempt": 1, "summary": "Email dispatched: dft_001 — msg_id=tg_9823, single-use token consumed"},
]

@router.get("/invocations", response_model=Dict[str, Any])
def list_invocations(
    mission_id: Optional[str] = None,
    cursor: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    q = db.query(ToolInvocationModel)
    if mission_id:
        q = q.filter(ToolInvocationModel.mission_id == mission_id)
    invs = q.order_by(ToolInvocationModel.started_at.desc()).limit(limit).all()

    if invs:
        # Real persisted invocations from actual mission runs
        items = [{
            "id": i.id,
            "mission_id": i.mission_id,
            "step_id": i.step_id,
            "tool": i.tool,
            "server_id": i.server_id,
            "transport": i.transport,
            "attempt": i.attempt,
            "started_at": i.started_at,
            "duration_ms": i.duration_ms,
            "status": i.status,
            "error_class": i.error_class,
            "args_hash": i.args_hash,
            "result_summary": i.result_summary
        } for i in invs]
    else:
        # No real missions run yet — return seeded demo invocations for display
        now = datetime.now(timezone.utc)
        total = len(_DEMO_INVOCATIONS)
        items = []
        for idx, d in enumerate(_DEMO_INVOCATIONS):
            ts = (now - timedelta(seconds=(total - idx) * 5)).isoformat()
            items.append({
                "id": f"inv_demo_{idx:03d}",
                "mission_id": "msn_scenario_a_demo",
                "step_id": f"stp_demo_{idx:03d}",
                "tool": d["tool"],
                "server_id": d["server_id"],
                "transport": "stdio",
                "attempt": d["attempt"],
                "started_at": ts,
                "duration_ms": d["dur"],
                "status": d["status"],
                "error_class": "TOOL_UNAVAILABLE" if d["status"] == "ERROR" else None,
                "args_hash": f"demo{idx:04x}abcd1234",
                "result_summary": d["summary"],
            })

    return {"items": items, "next_cursor": None}
