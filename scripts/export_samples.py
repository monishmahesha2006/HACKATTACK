import json
import sys
from pathlib import Path
from fastapi.testclient import TestClient

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.app.main import app

def export_samples():
    client = TestClient(app)
    samples_dir = BASE_DIR / "docs" / "samples"
    samples_dir.mkdir(parents=True, exist_ok=True)

    # 1. Health & Ready & Stats
    r_health = client.get("/api/v1/health")
    with open(samples_dir / "health.json", "w", encoding="utf-8") as f:
        json.dump(r_health.json(), f, indent=2)

    r_ready = client.get("/api/v1/ready")
    with open(samples_dir / "ready.json", "w", encoding="utf-8") as f:
        json.dump(r_ready.json(), f, indent=2)

    r_stats = client.get("/api/v1/stats/overview")
    with open(samples_dir / "stats_overview.json", "w", encoding="utf-8") as f:
        json.dump(r_stats.json(), f, indent=2)

    # 2. Create Mission
    payload = {
        "goal": "Find three internship opportunities suitable for a third-year computer science or AIML student, compare eligibility criteria and deadlines, rank them, save verified findings with links to a spreadsheet, and prepare personalized draft emails for each.",
        "constraints": ["third_year_eligible", "min_cgpa_8.0", "unexpired_deadlines"]
    }
    r_msn = client.post("/api/v1/missions", json=payload)
    msn_data = r_msn.json()
    msn_id = msn_data["id"]

    with open(samples_dir / "mission.json", "w", encoding="utf-8") as f:
        json.dump(msn_data, f, indent=2)

    # 3. Plan & Tests & Rehearsal
    r_plan = client.get(f"/api/v1/missions/{msn_id}/plan")
    with open(samples_dir / "plan.json", "w", encoding="utf-8") as f:
        json.dump(r_plan.json(), f, indent=2)

    r_tests = client.get(f"/api/v1/missions/{msn_id}/tests")
    with open(samples_dir / "acceptance_tests.json", "w", encoding="utf-8") as f:
        json.dump(r_tests.json(), f, indent=2)

    r_reh = client.post(f"/api/v1/missions/{msn_id}/rehearse")
    with open(samples_dir / "rehearsal_report.json", "w", encoding="utf-8") as f:
        json.dump(r_reh.json(), f, indent=2)

    # 4. Verification & Gaps & Claims
    r_ver = client.get(f"/api/v1/missions/{msn_id}/verification")
    with open(samples_dir / "verification_report.json", "w", encoding="utf-8") as f:
        json.dump(r_ver.json(), f, indent=2)

    r_gaps = client.get(f"/api/v1/missions/{msn_id}/gaps")
    with open(samples_dir / "gaps.json", "w", encoding="utf-8") as f:
        json.dump(r_gaps.json(), f, indent=2)

    r_claims = client.get(f"/api/v1/missions/{msn_id}/claims")
    with open(samples_dir / "claims.json", "w", encoding="utf-8") as f:
        json.dump(r_claims.json(), f, indent=2)

    # 5. Approvals
    r_appr = client.get("/api/v1/approvals")
    with open(samples_dir / "approvals.json", "w", encoding="utf-8") as f:
        json.dump(r_appr.json(), f, indent=2)

    # 6. Rewind Preview
    r_rwd = client.post(f"/api/v1/missions/{msn_id}/rewind/preview")
    with open(samples_dir / "rewind_preview.json", "w", encoding="utf-8") as f:
        json.dump(r_rwd.json(), f, indent=2)

    # 7. Audit & Chain Verify
    r_aud = client.get("/api/v1/audit/events")
    with open(samples_dir / "audit_events.json", "w", encoding="utf-8") as f:
        json.dump(r_aud.json(), f, indent=2)

    r_aud_v = client.get("/api/v1/audit/verify")
    with open(samples_dir / "audit_verify.json", "w", encoding="utf-8") as f:
        json.dump(r_aud_v.json(), f, indent=2)

    # 8. MCP
    r_mcps = client.get("/api/v1/mcp/servers")
    with open(samples_dir / "mcp_servers.json", "w", encoding="utf-8") as f:
        json.dump(r_mcps.json(), f, indent=2)

    r_mcpt = client.get("/api/v1/mcp/tools")
    with open(samples_dir / "mcp_tools.json", "w", encoding="utf-8") as f:
        json.dump(r_mcpt.json(), f, indent=2)

    # 9. ML
    r_mlm = client.get("/api/v1/ml/models")
    with open(samples_dir / "ml_models.json", "w", encoding="utf-8") as f:
        json.dump(r_mlm.json(), f, indent=2)

    r_mle = client.get("/api/v1/ml/models/failure_predictor/evaluation")
    with open(samples_dir / "ml_evaluation.json", "w", encoding="utf-8") as f:
        json.dump(r_mle.json(), f, indent=2)

    # 10. Chaos
    r_chaos = client.get("/api/v1/chaos/scenarios")
    with open(samples_dir / "chaos_scenarios.json", "w", encoding="utf-8") as f:
        json.dump(r_chaos.json(), f, indent=2)

    # 11. Security
    r_sec = client.get("/api/v1/security/events")
    with open(samples_dir / "security_events.json", "w", encoding="utf-8") as f:
        json.dump(r_sec.json(), f, indent=2)

    print(f"Exported real contract payload samples to {samples_dir}")

if __name__ == "__main__":
    export_samples()
