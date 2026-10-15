"""
REWIND X end-to-end acceptance suite.

Asserts the internship mission loop against frozen acceptance rules and
cryptographic audit integrity. Exit code 0 only when all checks pass.
"""
from __future__ import annotations

import sys
import time
from typing import Any

import httpx

BASE = "http://127.0.0.1:8000/api/v1"
TOKEN = "rx_dev_token_secret_key_2026"
H = {"X-Dev-Token": TOKEN}

GOAL = (
    "Find exactly 3 suitable 3rd-year CS/AIML internship opportunities, "
    "save them with source links, draft grounded emails, gate send_email."
)

failures: list[str] = []


def check(cond: bool, msg: str) -> None:
    status = "PASS" if cond else "FAIL"
    print(f"  [{status}] {msg}")
    if not cond:
        failures.append(msg)


def wait_status(client: httpx.Client, mid: str, want: set[str], timeout: float = 60.0) -> dict:
    deadline = time.time() + timeout
    last: dict[str, Any] = {}
    while time.time() < deadline:
        last = client.get(f"{BASE}/missions/{mid}").json()
        if last.get("status") in want:
            return last
        time.sleep(0.35)
    return last


def main() -> int:
    print("=" * 64)
    print(" REWIND X — E2E ACCEPTANCE")
    print("=" * 64)

    with httpx.Client(timeout=90.0) as client:
        health = client.get(f"{BASE}/health")
        check(health.status_code == 200 and health.json().get("status") == "OK", "GET /health == OK")

        ready = client.get(f"{BASE}/ready").json()
        check(ready.get("db") == "CONNECTED", "GET /ready db CONNECTED")
        check(ready.get("mcp", {}).get("connected", 0) >= 5, "GET /ready mcp connected >= 5")

        client.post(f"{BASE}/demo/reset", headers=H)

        mission = client.post(
            f"{BASE}/missions",
            headers=H,
            json={"goal": GOAL, "constraints": ["local_demo_only"]},
        ).json()
        mid = mission["id"]
        check(bool(mid), f"mission created ({mid})")

        plan = client.get(f"{BASE}/missions/{mid}/plan").json()
        check(len(plan.get("steps", [])) >= 6, f"plan has >= 6 steps (got {len(plan.get('steps', []))})")

        tests = client.get(f"{BASE}/missions/{mid}/tests").json()
        check(len(tests) == 5, f"exactly 5 frozen acceptance tests (got {len(tests)})")

        reh = client.post(f"{BASE}/missions/{mid}/rehearse", headers=H).json()
        check(reh.get("provenance") == "PREDICTED", "rehearsal provenance == PREDICTED")
        check(reh.get("approval_required") is True, "rehearsal requires approval")
        before = reh.get("real_state_unchanged_proof", {}).get("before_hash")
        after = reh.get("real_state_unchanged_proof", {}).get("after_hash")
        check(before == after, "rehearsal left real state unchanged")

        client.post(f"{BASE}/missions/{mid}/run", headers=H)
        status = wait_status(client, mid, {"AWAITING_APPROVAL", "COMPLETED", "FAILED"})
        check(status.get("status") == "AWAITING_APPROVAL", f"run pauses at AWAITING_APPROVAL (got {status.get('status')})")
        check(status["counts"]["done"] >= 4, f"at least 4 reversible steps done before gate (got {status['counts']['done']})")

        approvals = client.get(f"{BASE}/approvals", params={"mission_id": mid}).json()
        pending = [a for a in approvals if a.get("status") == "PENDING"]
        check(len(pending) >= 1, "pending send_email approval exists")
        apr_id = pending[0]["id"] if pending else None

        if apr_id:
            client.post(
                f"{BASE}/approvals/{apr_id}/decision",
                headers=H,
                json={"decision": "approve", "note": "e2e acceptance"},
            )
            status = wait_status(client, mid, {"COMPLETED", "FAILED"})
            check(status.get("status") == "COMPLETED", f"mission COMPLETED after approve (got {status.get('status')})")

        report = client.post(f"{BASE}/missions/{mid}/verify", headers=H).json()
        check(report.get("status") == "VERIFIED", f"verification VERIFIED (got {report.get('status')})")
        by_rule = {
            (t.get("spec") or {}).get("rule"): (t.get("result") or {}).get("status")
            for t in report.get("tests", [])
        }
        for rule in (
            "EXACT_COUNT",
            "ELIGIBILITY_AND_DEADLINES",
            "SPREADSHEET_PERSISTENCE",
            "DRAFT_GROUNDING",
            "APPROVAL_GATE",
        ):
            check(by_rule.get(rule) == "PASS", f"acceptance rule {rule} == PASS")

        audit = client.get(f"{BASE}/audit/verify").json()
        check(audit.get("valid") is True, f"audit chain valid (checked={audit.get('checked')})")

        mcp = client.get(f"{BASE}/mcp/servers").json()
        check(len(mcp) >= 5, f"mcp servers listed ({len(mcp)})")

        ml = client.get(f"{BASE}/ml/models").json()
        check(len(ml) >= 3, f"ml models listed ({len(ml)})")

    print("-" * 64)
    if failures:
        print(f"E2E FAILED — {len(failures)} check(s)")
        for f in failures:
            print(f"  • {f}")
        return 1

    print("ALL E2E ACCEPTANCE CHECKS PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
