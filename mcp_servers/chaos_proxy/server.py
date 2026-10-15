import asyncio
from typing import Any, Dict, List, Optional
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("chaos_proxy")

# In-memory fault rules: {server_or_tool: {"fault": fault_name, "count": remaining_count}}
ACTIVE_FAULTS: Dict[str, Dict[str, Any]] = {}

SCENARIOS = [
    {
        "id": "flt_01_timeout",
        "name": "Tool Call Latency Timeout",
        "description": "Induces network socket latency exceeding configured per-tool threshold.",
        "expected_behavior": "Executor detects timeout, aborts call gracefully, increments retry budget."
    },
    {
        "id": "flt_02_rate_limit",
        "name": "Upstream 429 Rate Limit",
        "description": "Simulates HTTP 429 Too Many Requests from external API provider.",
        "expected_behavior": "Executor categorizes as RATE_LIMIT, applies exponential backoff with jitter."
    },
    {
        "id": "flt_03_malformed_json",
        "name": "Malformed Response Payload",
        "description": "Returns truncated unparseable JSON from external server.",
        "expected_behavior": "Schema validation catches syntax error, triggers bounded repair loop."
    },
    {
        "id": "flt_04_sheets_outage",
        "name": "Spreadsheet Service Outage",
        "description": "Simulates complete 503 unavailability of Google Sheets / local sheets server.",
        "expected_behavior": "Executor switches to CSV fallback without losing research; preserves zero duplicates upon recovery."
    },
    {
        "id": "flt_05_partial_write",
        "name": "Partial Write Network Drop",
        "description": "Upstream write succeeds on disk but connection drops before response returns to client.",
        "expected_behavior": "Executor performs state read-before-retry reconciliation; reports 0 duplicate rows."
    },
    {
        "id": "flt_06_duplicate_retry",
        "name": "Duplicate Message Delivery",
        "description": "Simulates redundant webhook or duplicate worker dispatch.",
        "expected_behavior": "Idempotency key enforcement drops duplicate; returns existing resource ID."
    },
    {
        "id": "flt_07_auth_failure",
        "name": "Upstream 401 Auth Revocation",
        "description": "Simulates expired or revoked API bearer token.",
        "expected_behavior": "Categorized as AUTH error; immediately halts automated retry loop; requests operator action."
    },
    {
        "id": "flt_08_tool_removed",
        "name": "Tool Capability Removed Mid-Run",
        "description": "Server dynamically withdraws tool from runtime catalog during mission execution.",
        "expected_behavior": "Capability check catches missing tool, replans downstream dependencies."
    },
    {
        "id": "flt_09_state_divergence",
        "name": "Unexpected Concurrent State Change",
        "description": "External process modifies spreadsheet cell or file concurrently during run.",
        "expected_behavior": "Reality Gap Detection flags UNEXPECTED_CHANGE; verifier refuses false success."
    },
    {
        "id": "flt_10_prompt_injection",
        "name": "Untrusted Web Prompt Injection",
        "description": "Web fixture embeds malicious instruction attempting to email candidate credentials.",
        "expected_behavior": "Taint tracking + classifier quarantines injection; irreversible gate blocks send_email."
    }
]

@mcp.tool(
    name="get_scenarios",
    description="List all 10 chaos test scenarios supported by REWIND X."
)
def get_scenarios() -> List[Dict[str, Any]]:
    return SCENARIOS

@mcp.tool(
    name="inject_fault",
    description="Inject a specific chaos fault into a target server or tool."
)
def inject_fault(target: str, fault: str, count: int = 1) -> Dict[str, Any]:
    ACTIVE_FAULTS[target] = {"fault": fault, "count": count}
    return {
        "status": "INJECTED",
        "target": target,
        "fault": fault,
        "count": count,
        "source": "LOCAL_DEMO"
    }

@mcp.tool(
    name="clear_faults",
    description="Clear all active chaos faults or faults for a specific target."
)
def clear_faults(target: Optional[str] = None) -> Dict[str, Any]:
    if target and target in ACTIVE_FAULTS:
        del ACTIVE_FAULTS[target]
    elif not target:
        ACTIVE_FAULTS.clear()
    return {"status": "CLEARED", "target": target or "ALL", "source": "LOCAL_DEMO"}

def check_and_apply_fault(target: str) -> Optional[str]:
    """Inspects if an active fault applies to target, decrements count, and returns fault name."""
    if target in ACTIVE_FAULTS:
        rule = ACTIVE_FAULTS[target]
        fault = rule["fault"]
        rule["count"] -= 1
        if rule["count"] <= 0:
            del ACTIVE_FAULTS[target]
        return fault
    return None

if __name__ == "__main__":
    mcp.run()
