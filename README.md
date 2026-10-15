# REWIND X: Autonomous AI Operator

> **Deterministic, Auditable, Reversible Autonomous Workflow Execution Platform**

REWIND X is an autonomous operator engine designed for high-stakes enterprise actions. It incorporates forward-plan rehearsal, pre-execution human approval gates for irreversible actions, post-execution multi-rule acceptance verification, and tamper-evident SHA-256 cryptographic audit hash chaining.

---

## 🌟 Key Features

1. **Reversible & Irreversible Step Differentiation**
   - Read/query steps execute safely with automatic compensation tracking.
   - Irreversible actions (`send_email`, payment, mutation) pause automatically at human approval gates with risk scoring.

2. **Pre-Flight Predictive Rehearsal**
   - Rehearses the plan against shadow state before execution to predict side effects, token costs, and irreversible boundaries without altering production data.

3. **5-Rule Acceptance Test Verification**
   - Every mission synthesizes frozen acceptance criteria evaluated upon completion:
     - `EXACT_COUNT`: Exact count matching of extracted candidate records.
     - `ELIGIBILITY_AND_DEADLINES`: Validation of academic, timeline, and prerequisite constraints.
     - `SPREADSHEET_PERSISTENCE`: Verification of structured row persistence.
     - `DRAFT_GROUNDING`: Cross-referencing generated correspondence with extracted criteria.
     - `APPROVAL_GATE`: Ensuring zero unauthorized dispatch occurred.

4. **Cryptographic SHA-256 Audit Trail**
   - Every mission event, state transition, and approval decision is chained into a tamper-evident cryptographic hash ledger with automatic verification.

5. **Local Demo Mode & Extensible MCP Ecosystem**
   - Seamlessly operates in `LOCAL_DEMO` mode with 5 mock MCP servers (Search, Google Sheets, Gmail, Assessment, ML Ranking) or integrates with live external services.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Python**: 3.10+ (tested on Python 3.12.2)
- **Node.js**: 18+ (tested on Node v24.13.0, npm 11.6.2)

### 2. Installation
```powershell
# Install backend dependencies
pip install -r backend/requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Running Services
- **Backend API Server**:
  ```powershell
  python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
  ```
- **Frontend Dashboard**:
  ```powershell
  cd frontend
  npm run dev
  ```
  Dashboard opens at [http://localhost:5173](http://localhost:5173).

---

## 🧪 Testing & Verification

- **Automated E2E Acceptance Test (22 checks)**:
  ```powershell
  python scripts/run_e2e_acceptance.py
  ```
- **Interactive Operator Demo**:
  ```powershell
  python scripts/run_demo.py
  ```
- **Backend Unit & Integration Tests**:
  ```powershell
  python -m pytest backend/tests -v
  ```
- **Frontend Production Build**:
  ```powershell
  cd frontend
  npm run build
  ```

---

## 📖 API Documentation

Interactive OpenAPI / Swagger documentation is available at:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **OpenAPI Schema**: [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)
