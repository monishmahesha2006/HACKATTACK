# REWIND X Known Issues & Limitations

All actual limitations, edge cases, and known constraints are recorded honestly here.

- **Current Status (M9 Complete - Packaging & Polish):**
  - Full end-to-end mission loop operational (Plan -> Rehearse -> Pause on Irreversible Action -> Human Approval Gate -> Execute -> 5/5 Acceptance Test Verification -> Immutable SHA-256 Audit Chain).
  - All 22/22 automated E2E acceptance tests pass cleanly (`scripts/run_e2e_acceptance.py`).
  - All 5/5 backend pytest test suites pass with zero warnings (`backend/tests/test_m1_core.py`).
  - Frontend TypeScript compiles and builds cleanly without warnings (`npm run build`).

- **Limitation Note 1: External Live Credentials vs Local Demo Mode:**
  - Live external integrations (real Google Sheets via Google API OAuth2, real Gmail API via OAuth2) require user credentials configured in `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`).
  - When running in default `LOCAL_DEMO` mode, the operator uses deterministic, local mock adapters that simulate exact MCP protocols and persist artifacts to the local `./data` directory (e.g., `internships_*.json`, email drafts, outbox logs).

- **Limitation Note 2: Cryptographic Audit Chain Boundaries:**
  - The SHA-256 hash chains guarantee tamper evidence against append/update mutations within the database. Any modification or deletion of past steps or audit rows invalidates subsequent verification hashes.
  - However, it cannot prevent whole-history recomputation if the SQLite DB file itself is replaced by an attacker who has root filesystem access to the local disk. In enterprise deployments, periodic anchoring to an external RFC 3161 timestamping authority or immutable ledger is recommended.

- **Limitation Note 3: Frontend Hot Reloading & Port Configurations:**
  - The frontend development server runs on `http://localhost:5173` and proxies API requests to `http://127.0.0.1:8000`. If backend or frontend ports are modified, `VITE_API_BASE_URL` in `frontend/.env` and `FRONTEND_ORIGIN` in backend `config.py` should be updated in sync.
