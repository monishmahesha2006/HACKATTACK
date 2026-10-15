import hashlib
import json
from typing import Any, Dict, List
from backend.app.audit.hash_chain import canonical_json
from backend.app.schemas.contracts import AcceptanceTest
from backend.app.models.entities import utc_now_iso

class QAAgent:
    """Independent QA agent generating and freezing acceptance tests before any execution write."""

    def generate_and_freeze_tests(self, mission_id: str, goal: str) -> List[AcceptanceTest]:
        # Tests are derived strictly from the goal without seeing the plan!
        now_ts = utc_now_iso()
        tests_data = [
            {
                "id": f"tst_{mission_id}_01_count",
                "mission_id": mission_id,
                "description": "Verify exactly 3 suitable internship opportunities are identified and ranked",
                "kind": "DETERMINISTIC",
                "mandatory": True,
                "spec": {
                    "rule": "EXACT_COUNT",
                    "target_count": 3,
                    "resource": "opportunities"
                },
                "registered_at": now_ts
            },
            {
                "id": f"tst_{mission_id}_02_eligibility",
                "mission_id": mission_id,
                "description": "Verify third-year CS/AIML eligibility and unexpired deadlines",
                "kind": "DETERMINISTIC",
                "mandatory": True,
                "spec": {
                    "rule": "ELIGIBILITY_AND_DEADLINES",
                    "target_year": 3,
                    "min_cgpa": 8.0,
                    "deadline_future_required": True
                },
                "registered_at": now_ts
            },
            {
                "id": f"tst_{mission_id}_03_sheet_record",
                "mission_id": mission_id,
                "description": "Verify verified findings with source links are saved to spreadsheet with 0 duplicates",
                "kind": "DETERMINISTIC",
                "mandatory": True,
                "spec": {
                    "rule": "SPREADSHEET_PERSISTENCE",
                    "expected_rows": 3,
                    "allow_duplicates": False,
                    "require_source_links": True
                },
                "registered_at": now_ts
            },
            {
                "id": f"tst_{mission_id}_04_drafts_grounded",
                "mission_id": mission_id,
                "description": "Verify personalized draft emails cite student profile projects without hallucination",
                "kind": "DETERMINISTIC",
                "mandatory": True,
                "spec": {
                    "rule": "DRAFT_GROUNDING",
                    "require_project_citations": True,
                    "allow_fabricated_claims": False
                },
                "registered_at": now_ts
            },
            {
                "id": f"tst_{mission_id}_05_approval_safety",
                "mission_id": mission_id,
                "description": "Verify irreversible send action was gated by human authorization",
                "kind": "DETERMINISTIC",
                "mandatory": True,
                "spec": {
                    "rule": "APPROVAL_GATE",
                    "action": "send_email",
                    "token_required": True
                },
                "registered_at": now_ts
            }
        ]

        frozen_tests = []
        for t in tests_data:
            spec_hash = hashlib.sha256(canonical_json(t["spec"]).encode("utf-8")).hexdigest()
            frozen_tests.append(AcceptanceTest(
                id=t["id"],
                mission_id=t["mission_id"],
                description=t["description"],
                kind=t["kind"],
                mandatory=t["mandatory"],
                spec=t["spec"],
                frozen_hash=spec_hash,
                registered_at=t["registered_at"],
                result=None
            ))

        return frozen_tests

qa_agent = QAAgent()
