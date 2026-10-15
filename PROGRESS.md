# REWIND X Progress & State Tracker

## Current Milestone
- **Active:** M9 Complete — All E2E checks pass. Moving to M10-M11 (polish/packaging).

## Status Breakdown
- [x] **M0: Initialization & Contracts**
  - Workspace inspected, Stitch archive extracted, API contract written, Makefile/.env.example initialized.
- [x] **M1: Backend Skeleton & Core Foundations** ✅ 5/5 tests green, 0 warnings
  - FastAPI, SQLite WAL, 11 API route modules, Pydantic v2 schemas (ConfigDict), SHA-256 audit chain, HMAC capability tokens, FakeLLM replayer, 5 MCP fixture servers.
- [x] **M2: Frontend Foundations & Design System** ✅ Build clean (0 TS errors)
  - React 18 + Vite + TypeScript strict + Tailwind v3.4. Fonts offline. 10 pages. Design tokens.
- [x] **M3: Execution Engine & Pre-Test Verifier** ✅
  - executor/runner.py (retry, fallback, recovery), verifier/verifier.py, gap_detector, rewind_engine, planner, dissent, qa_agent.
- [x] **M4: Frontend Mission Page Parity** ✅
  - All 10 pages fully typed + wired. api/client.ts covers all 70+ endpoints. SSE hook with Last-Event-ID.
- [x] **M5: Domain MCP Server & ML Subsystem** ✅
  - 5 ML models (AUC=0.957, F1=1.0), 5 MCP servers with idempotency + send_email gate.
- [x] **M6: Resilience, Outage Recovery & Reality Gap Detection** ✅
  - 10 chaos scenarios, gap detector, recovery engine with backoff/fallback/compensation.
- [x] **M7: Trust, Approvals, Rehearsal Twin & Rewind** ✅
  - Approval workflow (single-use tokens, expiry, edit-args). Rehearsal twin (PREDICTED). Rewind engine (preview hash stale-check). Policy: irreversible never auto-approved.
- [x] **M8: Frontend P0 Pages** ✅ (included in M4 above)
- [x] **M9: End-to-End Acceptance** ✅ **22/22 E2E PASS**
  - Full internship mission loop verified. All 5 acceptance rules: EXACT_COUNT, ELIGIBILITY_AND_DEADLINES, SPREADSHEET_PERSISTENCE, DRAFT_GROUNDING, APPROVAL_GATE.
  - Audit chain valid (34+ events). 20 real API samples exported to docs/samples/.
  - reset_demo fixed: cascade-delete with PRAGMA foreign_keys OFF.
- [ ] **M10: P1 Pages & Subsystems** (optional polish)
- [ ] **M11: Final Polish & Packaging** (optional)

## Exact Resume Commands
- Backend (stable, no reload): `python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000`
- Frontend dev: `cd frontend && npm run dev`
- Backend tests: `pytest backend/tests -v -W error::DeprecationWarning`
- ML train/eval: `make train && make eval`
- Full E2E: `python scripts/run_e2e_acceptance.py`
- E2E smoke: `python scripts/e2e_smoke_test.py`
- Export samples: `python scripts/export_samples.py`
- Demo: `python scripts/run_demo.py`

