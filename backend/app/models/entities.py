from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()

class MissionModel(Base):
    __tablename__ = "missions"

    id = Column(String(64), primary_key=True)  # msn_...
    goal = Column(Text, nullable=False)
    constraints = Column(Text, nullable=True)  # JSON list
    status = Column(String(32), nullable=False, default="CREATED")
    mode = Column(String(32), nullable=False, default="LOCAL_DEMO")
    phase = Column(String(32), nullable=False, default="PLAN")
    created_at = Column(String(64), default=utc_now_iso)
    updated_at = Column(String(64), default=utc_now_iso, onupdate=utc_now_iso)

    steps = relationship("StepModel", back_populates="mission", cascade="all, delete-orphan")
    tests = relationship("AcceptanceTestModel", back_populates="mission", cascade="all, delete-orphan")
    gaps = relationship("GapModel", back_populates="mission", cascade="all, delete-orphan")
    claims = relationship("ClaimModel", back_populates="mission", cascade="all, delete-orphan")

class StepModel(Base):
    __tablename__ = "steps"

    id = Column(String(64), primary_key=True)  # stp_...
    mission_id = Column(String(64), ForeignKey("missions.id"), nullable=False, index=True)
    index = Column(Integer, nullable=False)
    description = Column(Text, nullable=False)
    tool = Column(String(128), nullable=False)
    server = Column(String(128), nullable=False)
    source = Column(String(32), nullable=False, default="LOCAL_DEMO")
    args = Column(Text, nullable=False, default="{}")  # redacted JSON
    raw_args = Column(Text, nullable=False, default="{}")  # execution args JSON
    depends_on = Column(Text, nullable=False, default="[]")  # JSON list
    risk = Column(String(32), nullable=False, default="LOW")
    reversibility = Column(String(32), nullable=False, default="REVERSIBLE")
    status = Column(String(32), nullable=False, default="PENDING")
    attempts = Column(Integer, nullable=False, default=0)
    max_attempts = Column(Integer, nullable=False, default=3)
    idempotency_key = Column(String(128), nullable=False, index=True)
    fallback_tool = Column(String(128), nullable=True)
    used_fallback = Column(Boolean, nullable=False, default=False)
    postconditions = Column(Text, nullable=False, default="[]")  # JSON
    started_at = Column(String(64), nullable=True)
    finished_at = Column(String(64), nullable=True)
    duration_ms = Column(Float, nullable=True)
    result_summary = Column(Text, nullable=True)
    error = Column(Text, nullable=True)  # JSON
    evidence_ids = Column(Text, nullable=False, default="[]")  # JSON list
    inverse_available = Column(Boolean, nullable=False, default=False)

    mission = relationship("MissionModel", back_populates="steps")

    __table_args__ = (
        UniqueConstraint("mission_id", "idempotency_key", name="uq_step_mission_idempotency"),
    )

class PlanModel(Base):
    __tablename__ = "plans"

    mission_id = Column(String(64), ForeignKey("missions.id"), primary_key=True)
    steps_json = Column(Text, nullable=False)  # JSON
    edges_json = Column(Text, nullable=False)  # JSON
    planner_notes = Column(Text, nullable=True)
    dissent_json = Column(Text, nullable=True)

class AcceptanceTestModel(Base):
    __tablename__ = "acceptance_tests"

    id = Column(String(64), primary_key=True)  # tst_...
    mission_id = Column(String(64), ForeignKey("missions.id"), nullable=False, index=True)
    description = Column(Text, nullable=False)
    kind = Column(String(32), nullable=False, default="DETERMINISTIC")
    mandatory = Column(Boolean, nullable=False, default=True)
    spec = Column(Text, nullable=False)  # JSON
    frozen_hash = Column(String(128), nullable=False)
    registered_at = Column(String(64), default=utc_now_iso)
    result = Column(Text, nullable=True)  # JSON

    mission = relationship("MissionModel", back_populates="tests")

class RehearsalReportModel(Base):
    __tablename__ = "rehearsal_reports"

    mission_id = Column(String(64), ForeignKey("missions.id"), primary_key=True)
    provenance = Column(String(32), nullable=False, default="PREDICTED")
    predicted_diff = Column(Text, nullable=False)  # JSON
    irreversible_ops = Column(Text, nullable=False, default="[]")  # JSON
    premortem = Column(Text, nullable=False, default="[]")  # JSON
    uncertainty_notes = Column(Text, nullable=False, default="[]")  # JSON
    approval_required = Column(Boolean, nullable=False, default=False)
    cached_reads = Column(Integer, default=0)
    real_state_unchanged_proof = Column(Text, nullable=False)  # JSON
    model_version = Column(String(64), nullable=True)

class EvidenceModel(Base):
    __tablename__ = "evidences"

    id = Column(String(64), primary_key=True)  # evi_...
    mission_id = Column(String(64), ForeignKey("missions.id"), nullable=True, index=True)
    kind = Column(String(32), nullable=False)
    source_url = Column(Text, nullable=True)
    snippet = Column(Text, nullable=True)
    snippet_offsets = Column(Text, nullable=True)  # JSON [start, end]
    retrieved_at = Column(String(64), default=utc_now_iso)
    tool_invocation_id = Column(String(64), nullable=True)
    observed_value = Column(Text, nullable=True)  # JSON
    hash = Column(String(128), nullable=False)

class ClaimModel(Base):
    __tablename__ = "claims"

    id = Column(String(64), primary_key=True)  # clm_...
    mission_id = Column(String(64), ForeignKey("missions.id"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    status = Column(String(32), nullable=False, default="UNVERIFIED")
    method = Column(String(64), nullable=False)
    evidence_ids = Column(Text, nullable=False, default="[]")  # JSON list
    ts = Column(String(64), default=utc_now_iso)
    location = Column(Text, nullable=True)  # JSON

    mission = relationship("MissionModel", back_populates="claims")

class GapModel(Base):
    __tablename__ = "gaps"

    id = Column(String(64), primary_key=True)  # gap_...
    mission_id = Column(String(64), ForeignKey("missions.id"), nullable=False, index=True)
    kind = Column(String(32), nullable=False)
    severity = Column(String(32), nullable=False)
    expected = Column(Text, nullable=True)  # JSON
    observed = Column(Text, nullable=True)  # JSON
    required = Column(Text, nullable=True)  # JSON
    evidence_ids = Column(Text, nullable=False, default="[]")  # JSON list
    likely_cause = Column(Text, nullable=True)
    safe_next_action = Column(Text, nullable=False)
    needs_human = Column(Boolean, nullable=False, default=False)
    status = Column(String(32), nullable=False, default="OPEN")
    detected_at = Column(String(64), default=utc_now_iso)

    mission = relationship("MissionModel", back_populates="gaps")

class ApprovalModel(Base):
    __tablename__ = "approvals"

    id = Column(String(64), primary_key=True)  # apr_...
    mission_id = Column(String(64), ForeignKey("missions.id"), nullable=False, index=True)
    step_id = Column(String(64), nullable=False)
    status = Column(String(32), nullable=False, default="PENDING")
    action = Column(String(128), nullable=False)
    target = Column(String(256), nullable=False)
    args_redacted = Column(Text, nullable=False)  # JSON
    call_hash = Column(String(128), nullable=False)
    expected_changes = Column(Text, nullable=False)  # JSON
    risk = Column(String(32), nullable=False)
    risk_explanation = Column(Text, nullable=False)
    compensation_available = Column(Boolean, nullable=False, default=False)
    expires_at = Column(String(64), nullable=False)
    decided_at = Column(String(64), nullable=True)
    decided_by = Column(String(64), nullable=True)
    note = Column(Text, nullable=True)
    single_use_token = Column(String(128), nullable=False)

class RewindResultModel(Base):
    __tablename__ = "rewind_results"

    id = Column(String(64), primary_key=True)  # rwd_...
    mission_id = Column(String(64), ForeignKey("missions.id"), nullable=False, index=True)
    status = Column(String(32), nullable=False)
    items = Column(Text, nullable=False, default="[]")  # JSON
    verification = Column(Text, nullable=True)  # JSON
    residual_effects = Column(Text, nullable=False, default="[]")  # JSON
    created_at = Column(String(64), default=utc_now_iso)

class AuditEventModel(Base):
    __tablename__ = "audit_events"

    id = Column(String(64), primary_key=True)  # evt_...
    seq = Column(Integer, primary_key=False, autoincrement=True, unique=True, index=True)
    mission_id = Column(String(64), nullable=True, index=True)
    step_id = Column(String(64), nullable=True)
    type = Column(String(64), nullable=False)
    actor = Column(String(64), nullable=False)
    tool = Column(String(128), nullable=True)
    args_hash = Column(String(128), nullable=True)
    result_summary = Column(Text, nullable=True)
    status = Column(String(32), nullable=False)
    prev_hash = Column(String(128), nullable=False)
    hash = Column(String(128), nullable=False)
    ts = Column(String(64), default=utc_now_iso)

class ToolInvocationModel(Base):
    __tablename__ = "tool_invocations"

    id = Column(String(64), primary_key=True)  # inv_...
    mission_id = Column(String(64), nullable=False, index=True)
    step_id = Column(String(64), nullable=False)
    tool = Column(String(128), nullable=False)
    server_id = Column(String(128), nullable=False)
    transport = Column(String(32), nullable=False)
    attempt = Column(Integer, nullable=False, default=1)
    started_at = Column(String(64), default=utc_now_iso)
    duration_ms = Column(Float, nullable=False, default=0.0)
    status = Column(String(32), nullable=False)
    error_class = Column(String(64), nullable=True)
    args_hash = Column(String(128), nullable=False)
    result_summary = Column(Text, nullable=True)

class SecurityEventModel(Base):
    __tablename__ = "security_events"

    id = Column(String(64), primary_key=True)  # sec_...
    mission_id = Column(String(64), nullable=True, index=True)
    kind = Column(String(64), nullable=False)
    detail = Column(Text, nullable=False)
    source = Column(String(128), nullable=True)
    ts = Column(String(64), default=utc_now_iso)

class FaultRunModel(Base):
    __tablename__ = "fault_runs"

    id = Column(String(64), primary_key=True)  # flt_...
    fault_id = Column(String(64), nullable=False, index=True)
    status = Column(String(32), nullable=False)
    target = Column(String(128), nullable=False)
    injected = Column(String(64), nullable=False)
    initial_state = Column(Text, nullable=False, default="{}")  # JSON
    expected = Column(Text, nullable=False)
    actual = Column(Text, nullable=False)
    attempts = Column(Integer, nullable=False, default=1)
    recovery_strategy = Column(String(128), nullable=False)
    duplicates = Column(Integer, nullable=False, default=0)
    false_success_claims = Column(Integer, nullable=False, default=0)
    final_verification = Column(String(32), nullable=False)
    duration_ms = Column(Float, nullable=False, default=0.0)
    ran_at = Column(String(64), default=utc_now_iso)

class EventRecordModel(Base):
    __tablename__ = "event_records"

    id = Column(Integer, primary_key=True, autoincrement=True)  # sequential event id
    type = Column(String(64), nullable=False)
    mission_id = Column(String(64), nullable=True, index=True)
    step_id = Column(String(64), nullable=True)
    correlation_id = Column(String(64), nullable=False)
    ts = Column(String(64), default=utc_now_iso)
    data = Column(Text, nullable=False)  # JSON

class CompareRunModel(Base):
    __tablename__ = "compare_runs"

    id = Column(String(64), primary_key=True)  # cmp_...
    goal = Column(Text, nullable=False)
    faults = Column(Text, nullable=False, default="[]")  # JSON list
    seed = Column(Integer, nullable=True)
    baseline_result = Column(Text, nullable=True)  # JSON
    rewindx_result = Column(Text, nullable=True)  # JSON
    status = Column(String(32), nullable=False, default="RUNNING")
    created_at = Column(String(64), default=utc_now_iso)

class CompareEventModel(Base):
    __tablename__ = "compare_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    compare_id = Column(String(64), ForeignKey("compare_runs.id"), nullable=False, index=True)
    side = Column(String(32), nullable=False)  # "baseline" | "rewindx"
    type = Column(String(64), nullable=False)  # "step_started", "step_done", "fault_injected", etc.
    step_id = Column(String(64), nullable=True)
    ts = Column(String(64), default=utc_now_iso)
    data = Column(Text, nullable=False, default="{}")  # JSON

