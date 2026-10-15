"""
REWIND X interactive demo runner.

Assumes the API is listening on http://127.0.0.1:8000
(start with: python -m uvicorn backend.app.main:app --port 8000)

Runs: reset -> create internship mission -> plan -> rehearse -> run
      -> auto-approve irreversible send -> verify -> audit check
Prints a concise operator-facing report.
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parent.parent
BASE = "http://127.0.0.1:8000/api/v1"
TOKEN = "rx_dev_token_secret_key_2026"
H = {"X-Dev-Token": TOKEN}

INTERNSHIP_GOAL = (
    "Find exactly 3 suitable 3rd-year CS/AIML internship opportunities with CGPA >= 8.0, "
    "persist them with source links, draft grounded application emails, and gate send_email "
    "behind human approval."
)


def wait_status(client: httpx.Client, mid: str, want: set[str], timeout: float = 45.0) -> dict:
    deadline = time.time() + timeout
    last = {}
    while time.time() < deadline:
        r = client.get(f"{BASE}/missions/{mid}")
        r.raise_for_status()
        last = r.json()
        if last.get("status") in want:
            return last
        time.sleep(0.4)
    return last


def main() -> int:
    print("=" * 64)
    print(" REWIND X — LOCAL DEMO")
    print("=" * 64)

    with httpx.Client(timeout=60.0) as client:
        # Health
        health = client.get(f"{BASE}/health").json()
        ready = client.get(f"{BASE}/ready").json()
        print(f"HEALTH: {health}")
        print(f"READY:  mode={ready.get('mode')} mcp={ready.get('mcp')} db={ready.get('db')}")

        # Reset
        reset = client.post(f"{BASE}/demo/reset", headers=H).json()
        print(f"RESET:  {reset.get('status')}")

        # Create
        mission = client.post(
            f"{BASE}/missions",
            headers=H,
            json={"goal": INTERNSHIP_GOAL, "constraints": ["local_demo_only"]},
        ).json()
        mid = mission["id"]
        print(f"MISSION: {mid}")
        print(f"  goal: {mission['goal'][:80]}...")

        # Plan + tests
        plan = client.get(f"{BASE}/missions/{mid}/plan").json()
        tests = client.get(f"{BASE}/missions/{mid}/tests").json()
        print(f"PLAN:    {len(plan['steps'])} steps")
        for s in plan["steps"]:
            print(f"  [{s['index']}] {s['tool']:28} {s['description'][:56]}")
        print(f"TESTS:   {len(tests)} frozen acceptance tests")

        # Rehearse
        reh = client.post(f"{BASE}/missions/{mid}/rehearse", headers=H).json()
        print(
            f"REHEARSE: provenance={reh.get('provenance')} "
            f"irreversible={len(reh.get('irreversible_ops', []))} "
            f"approval_required={reh.get('approval_required')}"
        )

        # Run until approval or complete
        client.post(f"{BASE}/missions/{mid}/run", headers=H)
        status = wait_status(client, mid, {"AWAITING_APPROVAL", "COMPLETED", "FAILED"})
        print(f"RUN:     status={status['status']} done={status['counts']['done']}/{status['counts']['steps']}")

        if status["status"] == "FAILED":
            print("Demo aborted: mission FAILED before approval gate.")
            return 1

        if status["status"] == "AWAITING_APPROVAL":
            approvals = client.get(f"{BASE}/approvals", params={"mission_id": mid, "status": "PENDING"}).json()
            if not approvals:
                approvals = [a for a in client.get(f"{BASE}/approvals").json() if a.get("mission_id") == mid]
            if not approvals:
                print("No pending approval found.")
                return 1
            apr = approvals[0]
            print(f"APPROVE: {apr['id']} action={apr['action']} risk={apr['risk']}")
            client.post(
                f"{BASE}/approvals/{apr['id']}/decision",
                headers=H,
                json={"decision": "approve", "note": "Demo auto-approve for local operator"},
            )
            status = wait_status(client, mid, {"COMPLETED", "FAILED"}, timeout=60.0)
            print(f"RESUME:  status={status['status']} done={status['counts']['done']}/{status['counts']['steps']}")

        if status["status"] != "COMPLETED":
            print(f"Demo did not complete (status={status['status']})")
            return 1

        # Verify
        report = client.post(f"{BASE}/missions/{mid}/verify", headers=H).json()
        print(f"VERIFY:  {report['status']} gaps_open={report.get('gaps_open')}")
        for t in report.get("tests", []):
            result = (t.get("result") or {}).get("status", "?")
            print(f"  [{result}] {t.get('spec', {}).get('rule', t.get('id'))}")

        # Audit
        audit = client.get(f"{BASE}/audit/verify").json()
        print(f"AUDIT:   valid={audit.get('valid')} checked={audit.get('checked')}")

        # Artifacts
        sheets_dir = ROOT / "data" / "sheets"
        drafts_path = ROOT / "data" / "drafts" / "drafts.json"
        outbox_path = ROOT / "data" / "outbox" / "outbox.json"
        sheet_files = list(sheets_dir.glob(f"internships_{mid}*.json"))
        print("ARTIFACTS:")
        for p in sheet_files:
            rows = json.loads(p.read_text(encoding="utf-8")).get("rows", [])
            print(f"  sheet  {p.name}  rows={len(rows)}")
        if drafts_path.exists():
            drafts = json.loads(drafts_path.read_text(encoding="utf-8"))
            print(f"  drafts {len(drafts)}")
        if outbox_path.exists():
            outbox = json.loads(outbox_path.read_text(encoding="utf-8"))
            print(f"  outbox {len(outbox)} dispatched")

        print("=" * 64)
        print(" DEMO COMPLETE")
        print(f" UI:  http://localhost:5173/missions/{mid}")
        print(f" API: http://127.0.0.1:8000/docs")
        print("=" * 64)
        return 0 if report.get("status") == "VERIFIED" and audit.get("valid") else 1


if __name__ == "__main__":
    raise SystemExit(main())
