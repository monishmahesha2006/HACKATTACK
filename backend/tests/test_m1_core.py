import asyncio
import hashlib
import json
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.session import SessionLocal, Base, engine
from backend.app.audit.hash_chain import audit_subsystem
from backend.app.mcp_client.gateway import mcp_gateway, CapabilityTokenError
from backend.app.schemas.enums import StepStatus

client = TestClient(app)

def test_health_and_ready():
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "OK"

    r_ready = client.get("/api/v1/ready")
    assert r_ready.status_code == 200
    assert r_ready.json()["mode"] == "LOCAL_DEMO"
    assert r_ready.json()["mcp"]["connected"] == 5

def test_hash_chain_integrity_and_tamper():
    db = SessionLocal()
    try:
        # Record two events
        e1 = audit_subsystem.record_event(
            db=db,
            event_type="test.event.1",
            actor="test_runner",
            result_summary="Initial test block"
        )
        e2 = audit_subsystem.record_event(
            db=db,
            event_type="test.event.2",
            actor="test_runner",
            result_summary="Second test block"
        )
        assert e2.prev_hash == e1.hash

        # Verify chain
        res = audit_subsystem.verify_chain(db)
        assert res["valid"] is True
        assert res["checked"] >= 2
        assert res["head_hash"] == e2.hash

        # Run isolated scratch tamper test
        tamper_res = audit_subsystem.run_isolated_tamper_test()
        assert tamper_res["tamper_detected"] is True
    finally:
        db.close()

def test_capability_token_enforcement():
    token = mcp_gateway.generate_capability_token("msn_test", "stp_01", "search")
    assert mcp_gateway.verify_capability_token(token, "stp_01", "search") is True
    # Out of scope tool
    assert mcp_gateway.verify_capability_token(token, "stp_01", "append_row") is False
    # Out of scope step
    assert mcp_gateway.verify_capability_token(token, "stp_02", "search") is False

@pytest.mark.asyncio
async def test_mcp_servers_and_idempotency():
    # 1. Search web fixture
    results, dur = await mcp_gateway.invoke_tool(
        server_id="web_fixture",
        tool_name="search",
        arguments={"query": "machine learning", "limit": 3}
    )
    assert len(results) > 0
    assert "tainted" in results[0] and results[0]["tainted"] is True

    # 2. Append row to sheets with idempotency key
    import uuid
    idemp_key = f"test_key_{uuid.uuid4().hex[:8]}"
    row_data = {"company": "Test AI", "role": "ML Intern"}
    res1, _ = await mcp_gateway.invoke_tool(
        server_id="sheets",
        tool_name="append_row",
        arguments={"sheet_id": "test_sheet", "row": row_data, "idempotency_key": idemp_key}
    )
    assert res1["status"] == "CREATED"
    row_id = res1["row_id"]

    # Retry with same idempotency key: must NOT duplicate!
    res2, _ = await mcp_gateway.invoke_tool(
        server_id="sheets",
        tool_name="append_row",
        arguments={"sheet_id": "test_sheet", "row": row_data, "idempotency_key": idemp_key}
    )
    assert res2["status"] == "EXISTING"
    assert res2["row_id"] == row_id
    assert res2["duplicate_prevented"] is True

    # 3. Draft email creation and irreversible send token gate
    dft, _ = await mcp_gateway.invoke_tool(
        server_id="drafts",
        tool_name="create_draft",
        arguments={"recipient": "test@example.com", "subject": "Hi", "body": "Hello"}
    )
    assert "id" in dft

    # Attempt send_email without valid token -> must be BLOCKED
    send_blocked, _ = await mcp_gateway.invoke_tool(
        server_id="drafts",
        tool_name="send_email",
        arguments={"draft_id": dft["id"], "authorization_token": ""}
    )
    assert send_blocked["status"] == "BLOCKED"

def test_mission_creation_and_frozen_tests():
    payload = {
        "goal": "Find three internship opportunities for a third-year CS/AIML student, rank them, and save to sheets.",
        "constraints": ["third-year eligible", "unexpired deadlines"]
    }
    r = client.post("/api/v1/missions", json=payload)
    assert r.status_code == 200
    m_data = r.json()
    assert m_data["id"].startswith("msn_")
    assert m_data["status"] == "CREATED"
    assert m_data["counts"]["steps"] == 6

    # Verify frozen acceptance tests
    r_tests = client.get(f"/api/v1/missions/{m_data['id']}/tests")
    assert r_tests.status_code == 200
    tests = r_tests.json()
    assert len(tests) >= 5
    for t in tests:
        assert t["frozen_hash"] is not None and len(t["frozen_hash"]) == 64

    # Verify DAG plan
    r_plan = client.get(f"/api/v1/missions/{m_data['id']}/plan")
    assert r_plan.status_code == 200
    plan = r_plan.json()
    assert len(plan["steps"]) == 6
    assert len(plan["edges"]) > 0
    assert plan["dissent"] is not None
