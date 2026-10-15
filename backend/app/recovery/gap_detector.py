from typing import Any, Dict, List, Optional
from backend.app.schemas.contracts import Gap
from backend.app.schemas.enums import GapKind, Severity
from backend.app.models.entities import utc_now_iso

class RealityGapDetector:
    """Detects discrepancies between Predicted state (A), Observed state (B), and Required criteria (C)."""

    def detect_gaps(
        self,
        mission_id: str,
        predicted: Dict[str, Any],
        observed: Dict[str, Any],
        required: Dict[str, Any],
    ) -> List[Gap]:
        gaps: List[Gap] = []
        now_ts = utc_now_iso()

        # 1. Check Row Count & Duplicates (Spreadsheet / CSV)
        pred_rows = predicted.get("rows_count", 0)
        obs_rows = observed.get("rows_count", 0)
        req_rows = required.get("target_rows", 3)

        if observed.get("has_duplicate_keys", False) or observed.get("duplicate_count", 0) > 0:
            gaps.append(Gap(
                id=f"gap_{mission_id}_dup_rows",
                mission_id=mission_id,
                kind=GapKind.DUPLICATE,
                severity=Severity.ERROR,
                expected={"unique_rows": req_rows},
                observed={"duplicate_count": observed.get("duplicate_count", 1)},
                required={"allow_duplicates": False},
                evidence_ids=[],
                likely_cause="Concurrent write or non-idempotent retry delivery",
                safe_next_action="Reconcile and deduplicate rows by unique idempotency key",
                needs_human=False,
                status="OPEN",
                detected_at=now_ts
            ))

        if obs_rows < req_rows:
            gaps.append(Gap(
                id=f"gap_{mission_id}_missing_rows",
                mission_id=mission_id,
                kind=GapKind.MISSING,
                severity=Severity.ERROR,
                expected={"rows_count": req_rows},
                observed={"rows_count": obs_rows},
                required={"rows_count": req_rows},
                evidence_ids=[],
                likely_cause="Tool unavailability or premature pipeline termination",
                safe_next_action="Resume execution using fallback CSV or retry pending step",
                needs_human=False,
                status="OPEN",
                detected_at=now_ts
            ))

        # 2. Check Expired or Ghost Listings
        if observed.get("expired_listings_found", False):
            gaps.append(Gap(
                id=f"gap_{mission_id}_expired_deadline",
                mission_id=mission_id,
                kind=GapKind.INVALID_DEADLINE,
                severity=Severity.ERROR,
                expected={"deadline": "FUTURE_DATE"},
                observed={"deadline": observed.get("expired_date")},
                required={"deadline_valid": True},
                evidence_ids=[],
                likely_cause="Web search returned archived or ghost opportunity",
                safe_next_action="Quarantine expired listing and search next eligible candidate",
                needs_human=False,
                status="OPEN",
                detected_at=now_ts
            ))

        # 3. Check Grounding in Drafts (Ungrounded / Hallucinated Claims)
        if observed.get("ungrounded_draft_detected", False):
            gaps.append(Gap(
                id=f"gap_{mission_id}_ungrounded_claim",
                mission_id=mission_id,
                kind=GapKind.UNVERIFIED_CLAIM,
                severity=Severity.CRITICAL,
                expected={"grounded_in_profile": True},
                observed={"hallucinated_tokens": observed.get("hallucinated_tokens", [])},
                required={"strict_grounding": True},
                evidence_ids=[],
                likely_cause="LLM draft generation hallucinated unverified candidate achievement",
                safe_next_action="Regenerate draft constrained strictly to profile.json project citations",
                needs_human=False,
                status="OPEN",
                detected_at=now_ts
            ))

        # 4. Check Irreversible Actions without approval
        if observed.get("unauthorized_send_attempted", False):
            gaps.append(Gap(
                id=f"gap_{mission_id}_approval_bypass",
                mission_id=mission_id,
                kind=GapKind.UNEXPECTED_CHANGE,
                severity=Severity.CRITICAL,
                expected={"authorization_token_present": True},
                observed={"token_present": False},
                required={"backend_approval_gate": True},
                evidence_ids=[],
                likely_cause="Unauthorized tool execution attempt on irreversible action",
                safe_next_action="Lock action interlock; pause mission and alert human operator",
                needs_human=True,
                status="OPEN",
                detected_at=now_ts
            ))

        return gaps

gap_detector = RealityGapDetector()
