import asyncio
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_compare_and_baseline_duplicate_difference():
    """Verify that Baseline produces a duplicate on 'lost response after write' while REWIND X produces 0."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Start comparison on flt_05_partial_write (lost response after write)
        resp = await client.post("/api/v1/compare", json={
            "goal": "Find 3 CS internships for third-year students",
            "faults": ["flt_05_partial_write"],
            "seed": 42
        })
        assert resp.status_code == 201
        data = resp.json()
        assert "compare_id" in data
        compare_id = data["compare_id"]

        # Wait briefly for execution to complete
        await asyncio.sleep(0.4)

        # Query comparison results
        res_resp = await client.get(f"/api/v1/compare/{compare_id}")
        assert res_resp.status_code == 200
        cmp_data = res_resp.json()
        assert "baseline" in cmp_data
        assert "rewindx" in cmp_data

        baseline = cmp_data["baseline"]
        rewindx = cmp_data["rewindx"]

        # Core invariant: Baseline produces >= 1 duplicate on lost response after write, REWIND X produces 0
        assert baseline["duplicates"] >= 1, f"Expected baseline to produce duplicates, got {baseline['duplicates']}"
        assert rewindx["duplicates"] == 0, f"Expected REWIND X to produce 0 duplicates, got {rewindx['duplicates']}"
        assert baseline["verified"] is False
        assert rewindx["verified"] is True

@pytest.mark.asyncio
async def test_compare_run_all():
    """Verify POST /api/v1/compare/run-all benchmarks all 8 fault scenarios."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/v1/compare/run-all")
        assert resp.status_code == 200
        data = resp.json()
        assert "results" in data
        assert len(data["results"]) == 8

        # Ensure lost response after write fault is present and tested
        partial_write_item = next(r for r in data["results"] if r["fault"] == "flt_05_partial_write")
        assert partial_write_item["baseline"]["duplicates"] >= 1
        assert partial_write_item["rewindx"]["duplicates"] == 0

@pytest.mark.asyncio
async def test_proof_receipt_and_pdf():
    """Verify Proof Receipt json, hash verification, and PDF generation."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create a mission first
        m_resp = await client.post("/api/v1/missions", json={
            "goal": "Test mission for receipt generation",
            "constraints": ["third-year eligible"]
        })
        assert m_resp.status_code in (200, 201)
        m_id = m_resp.json()["id"]

        # Rehearse
        reh_resp = await client.post(f"/api/v1/missions/{m_id}/rehearse")
        assert reh_resp.status_code == 200

        # Query Receipt
        rcpt_resp = await client.get(f"/api/v1/missions/{m_id}/receipt")
        assert rcpt_resp.status_code == 200
        rcpt = rcpt_resp.json()
        assert "goal" in rcpt
        assert "verdict" in rcpt
        assert "final_hash" in rcpt
        assert "audit_chain_ok" in rcpt
        assert rcpt["duplicates"] == 0
        final_hash = rcpt["final_hash"]

        # Verify Hash
        v_resp = await client.get(f"/api/v1/receipts/{final_hash}/verify")
        assert v_resp.status_code == 200
        v_data = v_resp.json()
        assert v_data["matched"] is True
        assert v_data["chain_valid"] is True

        # Query PDF
        pdf_resp = await client.get(f"/api/v1/missions/{m_id}/receipt.pdf")
        assert pdf_resp.status_code == 200
        assert pdf_resp.headers["content-type"] == "application/pdf"
        assert len(pdf_resp.content) > 500  # Valid binary PDF size
        assert pdf_resp.content.startswith(b"%PDF")

@pytest.mark.asyncio
async def test_timeline_endpoint():
    """Verify GET /api/v1/missions/{id}/timeline returns stages and faults."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create mission
        m_resp = await client.post("/api/v1/missions", json={
            "goal": "Test mission for timeline",
            "constraints": ["unexpired deadlines"]
        })
        assert m_resp.status_code in (200, 201)
        m_id = m_resp.json()["id"]

        # Rehearse
        await client.post(f"/api/v1/missions/{m_id}/rehearse")

        # Query timeline
        t_resp = await client.get(f"/api/v1/missions/{m_id}/timeline")
        assert t_resp.status_code == 200
        t_data = t_resp.json()
        assert "stages" in t_data
        assert "faults" in t_data
        stage_names = [s["name"] for s in t_data["stages"]]
        assert "predict" in stage_names
