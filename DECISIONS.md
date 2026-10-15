# REWIND X Architecture & Technical Decisions

This file logs all architectural, technology, and engineering decisions.

- **DEC-001 (2026-10-15):** Adopted Python 3.12, FastAPI, Pydantic v2, and SQLite with WAL mode (`journal_mode=WAL`, `synchronous=NORMAL`) for local transactional persistence with concurrent read-heavy SSE and API performance.
- **DEC-002 (2026-10-15):** Adopted FastMCP official Python SDK for MCP servers and client gateway with standard stdio transport and streamable HTTP capabilities.
- **DEC-003 (2026-10-15):** Implemented deterministic `FakeLLM` replayer with realistic pre-recorded fixtures so that the offline demo and unit/e2e test suites run fully air-gapped without API keys.
- **DEC-004 (2026-10-15):** Machine learning subsystem models (M1-M5) implemented with scikit-learn, numpy, pandas, and scipy, using joblib serialization. Rule-based fallbacks guarantee `DEGRADED` status instead of system crashes if artifacts are absent.
- **DEC-005 (2026-10-15):** Frontend uses React 18, Vite, TypeScript strict, and Tailwind CSS v3.4 keeping verbatim Stitch tokens from `frontend/design/stitch/`. Fonts bundled locally via `@fontsource` to ensure 100% offline air-gapped fidelity.
- **DEC-006 (2026-10-15):** Security model enforces capability tokens (HMAC-signed with step scope constraints) and strict deterministic policy override: irreversible actions (e.g., `send_email`) can never be auto-approved regardless of ML failure predictions.
- **DEC-007 (2026-10-15):** Audit trail uses a SHA-256 hash-chained append-only ledger (`hash = sha256(prev_hash + canonical_json(event))`). Tamper verification runs isolated against scratch copies.
