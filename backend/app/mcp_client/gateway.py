import asyncio
import hashlib
import hmac
import json
import logging
import time
from typing import Any, Dict, List, Optional, Tuple
from backend.app.core.config import settings
from backend.app.schemas.contracts import McpServer, McpTool, ToolHealth
from backend.app.schemas.enums import Risk, Reversibility, Source
from backend.app.models.entities import utc_now_iso
import mcp_servers.web_fixture.server as web_fixture_module
import mcp_servers.sheets.server as sheets_module
import mcp_servers.drafts.server as drafts_module
import mcp_servers.rewindx_domain.server as domain_module
import mcp_servers.chaos_proxy.server as chaos_module

logger = logging.getLogger(__name__)

class CapabilityTokenError(Exception):
    pass

class ToolExecutionError(Exception):
    def __init__(self, message: str, error_class: str = "PERMANENT"):
        super().__init__(message)
        self.error_class = error_class

class McpGateway:
    """Unified MCP Gateway managing connected servers, capability tokens, and invocations."""

    def __init__(self):
        self.servers: Dict[str, Any] = {
            "web_fixture": web_fixture_module.mcp,
            "sheets": sheets_module.mcp,
            "drafts": drafts_module.mcp,
            "rewindx_domain": domain_module.mcp,
            "chaos_proxy": chaos_module.mcp,
        }
        self.latency_records: Dict[str, List[float]] = {}
        self.secret_key = settings.CAPABILITY_TOKEN_SECRET.encode("utf-8")

    def generate_capability_token(self, mission_id: str, step_id: str, allowed_tool: str, expires_in: int = 300) -> str:
        """Generates an HMAC-signed capability token scoping execution to a single step & tool."""
        exp = int(time.time()) + expires_in
        payload = f"{mission_id}:{step_id}:{allowed_tool}:{exp}"
        signature = hmac.new(self.secret_key, payload.encode("utf-8"), hashlib.sha256).hexdigest()
        return f"cap_{payload}:{signature}"

    def verify_capability_token(self, token: str, step_id: str, tool: str) -> bool:
        """Verifies that the capability token matches step, tool, and has not expired."""
        if not token or not token.startswith("cap_"):
            return False
        try:
            parts = token[4:].split(":")
            if len(parts) != 5:
                return False
            mission_id, t_step, t_tool, exp_str, sig = parts
            if t_step != step_id or t_tool != tool:
                return False
            if int(exp_str) < int(time.time()):
                return False
            payload = f"{mission_id}:{t_step}:{t_tool}:{exp_str}"
            expected_sig = hmac.new(self.secret_key, payload.encode("utf-8"), hashlib.sha256).hexdigest()
            return hmac.compare_digest(sig, expected_sig)
        except Exception:
            return False

    async def list_servers(self) -> List[McpServer]:
        res = []
        now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        for s_id, s_instance in self.servers.items():
            tool_count = len(getattr(s_instance, "_tool_manager", {})._tools) if hasattr(s_instance, "_tool_manager") else 5
            l_list = self.latency_records.get(s_id, [1.5])
            avg_lat = sum(l_list) / len(l_list)
            res.append(McpServer(
                id=s_id,
                name=f"MCP Server: {s_id}",
                version="1.0.0",
                transport="stdio",
                source=Source.LOCAL_DEMO,
                status="CONNECTED",
                last_seen=now_iso,
                tool_count=tool_count,
                latency_ms_ewma=round(avg_lat, 2)
            ))
        return res

    async def list_tools(self) -> List[McpTool]:
        tools: List[McpTool] = []

        # Tool specifications per Part 3.5
        tool_specs = [
            # web_fixture
            ("search", "web_fixture", "Search internship postings", Risk.LOW, Reversibility.REVERSIBLE, ["query"], False, None, True),
            ("fetch", "web_fixture", "Fetch page details and content", Risk.LOW, Reversibility.REVERSIBLE, ["url"], False, None, True),
            # sheets
            ("create_sheet", "sheets", "Create new sheet", Risk.LOW, Reversibility.REVERSIBLE, ["title"], True, None, False),
            ("append_row", "sheets", "Append row idempotently", Risk.MEDIUM, Reversibility.REVERSIBLE, ["idempotency_key"], True, "save_csv_fallback", False),
            ("update_row", "sheets", "Update existing row", Risk.MEDIUM, Reversibility.REVERSIBLE, ["row_id"], True, None, False),
            ("delete_row", "sheets", "Delete row by row_id", Risk.MEDIUM, Reversibility.REVERSIBLE, ["row_id"], False, None, False),
            ("read_rows", "sheets", "Read all rows from sheet", Risk.LOW, Reversibility.REVERSIBLE, ["sheet_id"], False, None, False),
            # drafts
            ("create_draft", "drafts", "Create candidate email draft", Risk.LOW, Reversibility.REVERSIBLE, ["recipient", "subject"], True, None, False),
            ("update_draft", "drafts", "Update existing email draft", Risk.LOW, Reversibility.REVERSIBLE, ["draft_id"], True, None, False),
            ("delete_draft", "drafts", "Delete email draft", Risk.LOW, Reversibility.REVERSIBLE, ["draft_id"], False, None, False),
            ("read_draft", "drafts", "Read draft content", Risk.LOW, Reversibility.REVERSIBLE, ["draft_id"], False, None, False),
            ("list_drafts", "drafts", "List all created drafts", Risk.LOW, Reversibility.REVERSIBLE, [], False, None, False),
            ("send_email", "drafts", "Send outreach email (Irreversible, Strict Token)", Risk.CRITICAL, Reversibility.IRREVERSIBLE, ["draft_id"], False, None, False),
            # rewindx_domain
            ("assess_internship_eligibility", "rewindx_domain", "Assess candidate eligibility", Risk.LOW, Reversibility.REVERSIBLE, ["opportunity"], False, None, False),
            ("rank_internship_opportunities", "rewindx_domain", "Rank opportunities by score", Risk.LOW, Reversibility.REVERSIBLE, ["opportunities"], False, None, False),
            ("validate_deadline", "rewindx_domain", "Validate deadline date", Risk.LOW, Reversibility.REVERSIBLE, ["deadline_str"], False, None, False),
            ("check_evidence_completeness", "rewindx_domain", "Check citation grounding", Risk.LOW, Reversibility.REVERSIBLE, ["claims"], False, None, False),
            ("compare_candidate_requirements", "rewindx_domain", "Compare skill sets", Risk.LOW, Reversibility.REVERSIBLE, ["required_skills"], False, None, False),
            ("classify_injection", "rewindx_domain", "Classify potential injection attack", Risk.LOW, Reversibility.REVERSIBLE, ["text"], False, None, False),
            # chaos_proxy
            ("inject_fault", "chaos_proxy", "Inject chaos fault", Risk.HIGH, Reversibility.REVERSIBLE, ["target", "fault"], True, None, False),
            ("clear_faults", "chaos_proxy", "Clear chaos faults", Risk.LOW, Reversibility.REVERSIBLE, [], False, None, False),
            ("get_scenarios", "chaos_proxy", "List chaos scenarios", Risk.LOW, Reversibility.REVERSIBLE, [], False, None, False),
        ]

        for name, s_id, desc, risk, rev, idemp, has_inv, fb, taints in tool_specs:
            tools.append(McpTool(
                name=name,
                server_id=s_id,
                description=desc,
                input_schema={"type": "object", "properties": {k: {"type": "string"} for k in idemp}},
                risk=risk,
                reversibility=rev,
                idempotent_by=idemp,
                has_inverse=has_inv,
                fallback=fb,
                timeout_s=30.0,
                permissions=[f"{s_id}:{name}"],
                taints_output=taints,
                available=True,
                health=ToolHealth(p_fail=0.01, anomaly=False)
            ))

        return tools

    async def invoke_tool(
        self,
        server_id: str,
        tool_name: str,
        arguments: Dict[str, Any],
        capability_token: Optional[str] = None,
        step_id: Optional[str] = None,
    ) -> Tuple[Any, float]:
        """Invokes a tool with capability enforcement and chaos fault interception."""
        # Check capability token if provided or if step_id provided
        if step_id and capability_token:
            if not self.verify_capability_token(capability_token, step_id, tool_name):
                raise CapabilityTokenError(
                    f"Capability Token Verification Failed for step {step_id} on tool {tool_name}"
                )

        # Check chaos proxy for active faults
        fault = chaos_module.check_and_apply_fault(server_id) or chaos_module.check_and_apply_fault(tool_name)
        if fault:
            if fault == "flt_01_timeout":
                await asyncio.sleep(0.5)
                raise ToolExecutionError("Operation timed out after threshold", error_class="TRANSIENT_NETWORK")
            elif fault == "flt_02_rate_limit":
                raise ToolExecutionError("HTTP 429: Upstream rate limit exceeded", error_class="RATE_LIMIT")
            elif fault == "flt_03_malformed_json":
                raise ToolExecutionError("Malformed JSON payload received from remote stream", error_class="INVALID_ARGS")
            elif fault == "flt_04_sheets_outage":
                raise ToolExecutionError("Sheets service 503 Unavailable", error_class="TOOL_UNAVAILABLE")
            elif fault == "flt_05_partial_write":
                # The write is executed on disk, but error thrown to client
                server_mod = getattr(sheets_module, tool_name, None)
                if server_mod:
                    server_mod(**arguments)
                raise ToolExecutionError("Socket disconnected before response acknowledgment", error_class="PARTIAL_WRITE")
            elif fault == "flt_07_auth_failure":
                raise ToolExecutionError("HTTP 401 Unauthorized: Bearer token revoked", error_class="AUTH")

        # Route directly to module function
        server_inst = self.servers.get(server_id)
        if not server_inst:
            raise ToolExecutionError(f"Server {server_id} not found in allowlist", error_class="TOOL_UNAVAILABLE")

        target_module = None
        if server_id == "web_fixture":
            target_module = web_fixture_module
        elif server_id == "sheets":
            target_module = sheets_module
        elif server_id == "drafts":
            target_module = drafts_module
        elif server_id == "rewindx_domain":
            target_module = domain_module
        elif server_id == "chaos_proxy":
            target_module = chaos_module

        fn = getattr(target_module, tool_name, None)
        if not fn:
            raise ToolExecutionError(f"Tool {tool_name} not found on server {server_id}", error_class="TOOL_UNAVAILABLE")

        t0 = time.perf_counter()
        if asyncio.iscoroutinefunction(fn):
            result = await fn(**arguments)
        else:
            result = fn(**arguments)
        duration_ms = (time.perf_counter() - t0) * 1000.0

        # Record latency EWMA
        if server_id not in self.latency_records:
            self.latency_records[server_id] = []
        self.latency_records[server_id].append(duration_ms)
        if len(self.latency_records[server_id]) > 50:
            self.latency_records[server_id].pop(0)

        # ── Persist invocation log to DB ───────────────────────────────────────────
        try:
            from backend.app.db.session import SessionLocal
            from backend.app.models.entities import ToolInvocationModel
            _db = SessionLocal()
            try:
                args_h = hashlib.sha256(json.dumps(arguments, sort_keys=True, default=str).encode()).hexdigest()[:16]
                result_snippet = str(result)[:200] if result is not None else ""
                inv = ToolInvocationModel(
                    id=f"inv_{hashlib.sha256(f'{step_id}:{tool_name}:{time.time()}'.encode()).hexdigest()[:12]}",
                    mission_id=step_id.split('_')[1] if step_id and '_' in step_id else (step_id or "sys"),
                    step_id=step_id or "sys",
                    tool=tool_name,
                    server_id=server_id,
                    transport="stdio",
                    attempt=1,
                    started_at=utc_now_iso(),
                    duration_ms=round(duration_ms, 2),
                    status="OK",
                    error_class=None,
                    args_hash=args_h,
                    result_summary=result_snippet,
                )
                _db.add(inv)
                _db.commit()
            except Exception as db_err:
                logger.debug("Invocation log write skipped: %s", db_err)
                _db.rollback()
            finally:
                _db.close()
        except Exception:
            pass  # never fail the tool call due to logging

        return result, duration_ms

mcp_gateway = McpGateway()
