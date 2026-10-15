# REWIND X Frontend — Known Issues & Connectivity Status

## 1. Backend Connectivity Status
All required backend endpoints are fully implemented and connected to real data:
- `POST /api/v1/compare` — CONNECTED (Returns compare_id, runs baseline vs REWIND X)
- `GET /api/v1/compare/{id}` — CONNECTED (Returns baseline & rewindx execution metrics)
- `GET /api/v1/compare/{id}/events` — CONNECTED (Real-time SSE stream supporting `Last-Event-ID` and query parameter replay)
- `POST /api/v1/compare/run-all` — CONNECTED (Runs and measures all 8 fault scenarios)
- `GET /api/v1/missions/{id}/receipt` — CONNECTED (Cryptographic execution receipt data)
- `GET /api/v1/missions/{id}/receipt.pdf` — CONNECTED (ReportLab generated cryptographic proof PDF)
- `GET /api/v1/receipts/{hash}/verify` — CONNECTED (Direct SHA-256 receipt verification)
- `GET /api/v1/missions/{id}/timeline` — CONNECTED (Stage transitions and fault injection events)
- `GET /health` & `GET /ready` — CONNECTED (System mode, database status, and MCP server health)
- `POST /api/v1/missions` & `GET /api/v1/missions` — CONNECTED (Autonomous execution lifecycle)

## 2. Token Compliance Audit
- `npm run check:colors` scanned 33 files across `frontend/src/`.
- Violations: **0** (100% compliant).
- All surfaces, ink shades, verbs (`predict`, `prove`, `recover`, `rewind`), and aurora gradients use CSS variables from `src/styles/tokens.css`.
- Zero raw hex values exist in any TSX/TS/CSS file outside `src/styles/tokens.css`.
- Zero legacy Tailwind color classes (`bg-white`, `text-white`, `bg-black`, `text-gray-*`, `bg-blue-*`, etc.) exist in `frontend/src/`.

## 3. Known Limitations & Notes
1. **ReportLab PDF Dependency**: Python `reportlab` is installed and generates downloadable certificates. If running on an environment without `reportlab`, receipt JSON is preserved and an informative message is logged.
2. **Browser EventSource Custom Headers**: Standard browser `EventSource` cannot pass custom request headers; therefore, SSE catch-up replay supports both standard `Last-Event-ID` header (via curl/proxies) and `?last_event_id=` query parameter.
3. **Reduced Motion**: Full compliance with `@media (prefers-reduced-motion: reduce)` and the top-bar "Reduce motion" toggle button. All animations instantly drop to 0.01ms duration when enabled.
