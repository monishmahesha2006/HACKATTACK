from typing import Any, Dict, List, Optional, Tuple, Union
from pydantic import ConfigDict
from pydantic import BaseModel, Field
from backend.app.schemas.enums import (
    Mode, MissionStatus, StepStatus, Risk, Reversibility, Provenance,
    ClaimStatus, VerificationStatus, GapKind, Severity, ApprovalStatus,
    ErrorClass, Source, Phase, SecurityEventKind
)

class MissionCounts(BaseModel):
    steps: int = 0
    done: int = 0
    failed: int = 0
    retries: int = 0
    gaps_open: int = 0
    approvals_pending: int = 0

class Mission(BaseModel):
    id: str
    goal: str
    constraints: Optional[List[str]] = None
    status: MissionStatus
    mode: Mode
    created_at: str
    updated_at: str
    counts: MissionCounts
    phase: Phase

class Postcondition(BaseModel):
    type: str
    params: Dict[str, Any] = Field(default_factory=dict)
    passed: Optional[bool] = None

class StepError(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    error_class: ErrorClass = Field(alias="class")
    message: str

class Step(BaseModel):
    id: str
    mission_id: str
    index: int
    description: str
    tool: str
    server: str
    source: Source
    args: Dict[str, Any] = Field(default_factory=dict)  # Redacted
    depends_on: List[str] = Field(default_factory=list)
    risk: Risk
    reversibility: Reversibility
    status: StepStatus
    attempts: int = 0
    max_attempts: int = 3
    idempotency_key: str
    fallback_tool: Optional[str] = None
    used_fallback: bool = False
    postconditions: List[Postcondition] = Field(default_factory=list)
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    duration_ms: Optional[float] = None
    result_summary: Optional[str] = None
    error: Optional[StepError] = None
    evidence_ids: List[str] = Field(default_factory=list)
    inverse_available: bool = False

class PlanEdge(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    from_node: str = Field(alias="from")
    to_node: str = Field(alias="to")

class PlanDissent(BaseModel):
    score: float
    differing_decisions: List[str] = Field(default_factory=list)

class Plan(BaseModel):
    mission_id: str
    steps: List[Step]
    edges: List[PlanEdge]
    planner_notes: Optional[str] = None
    dissent: Optional[PlanDissent] = None

class AcceptanceTestResult(BaseModel):
    status: str  # 'PASS' | 'FAIL' | 'NOT_RUN'
    evidence_ids: List[str] = Field(default_factory=list)
    observed: Optional[Any] = None
    ran_at: Optional[str] = None
    duration_ms: Optional[float] = None

class AcceptanceTest(BaseModel):
    id: str
    mission_id: str
    description: str
    kind: str  # 'DETERMINISTIC' | 'LLM_ASSISTED'
    mandatory: bool
    spec: Dict[str, Any]
    frozen_hash: str
    registered_at: str
    result: Optional[AcceptanceTestResult] = None

class ResourceCreate(BaseModel):
    resource: str
    count: int

class PredictedDiff(BaseModel):
    creates: List[ResourceCreate] = Field(default_factory=list)
    updates: List[Dict[str, Any]] = Field(default_factory=list)
    deletes: List[Dict[str, Any]] = Field(default_factory=list)
    sends: int = 0

class PremortemItem(BaseModel):
    failure_mode: str
    probability: float
    mitigation: str
    fallback: Optional[str] = None

class StateUnchangedProof(BaseModel):
    before_hash: str
    after_hash: str

class RehearsalReport(BaseModel):
    mission_id: str
    provenance: Provenance = Provenance.PREDICTED
    predicted_diff: PredictedDiff
    irreversible_ops: List[str] = Field(default_factory=list)
    premortem: List[PremortemItem] = Field(default_factory=list)
    uncertainty_notes: List[str] = Field(default_factory=list)
    approval_required: bool
    cached_reads: int = 0
    real_state_unchanged_proof: StateUnchangedProof
    model_version: Optional[str] = None

class Evidence(BaseModel):
    id: str
    kind: str  # 'WEB' | 'SHEET_ROW' | 'DRAFT' | 'FILE' | 'TOOL_RESULT'
    source_url: Optional[str] = None
    snippet: Optional[str] = None
    snippet_offsets: Optional[Tuple[int, int]] = None
    retrieved_at: str
    tool_invocation_id: Optional[str] = None
    observed_value: Optional[Any] = None
    hash: str

class ClaimLocation(BaseModel):
    kind: str  # 'sheet_cell' | 'draft_sentence'
    ref: str

class Claim(BaseModel):
    id: str
    mission_id: str
    text: str
    status: ClaimStatus
    method: str
    evidence_ids: List[str] = Field(default_factory=list)
    ts: str
    location: Optional[ClaimLocation] = None

class VerificationReport(BaseModel):
    mission_id: str
    status: VerificationStatus
    tests: List[AcceptanceTest]
    claims: List[Claim]
    gaps_open: int = 0
    ran_at: str
    notes: Optional[str] = None

class Gap(BaseModel):
    id: str
    mission_id: str
    kind: GapKind
    severity: Severity
    expected: Any
    observed: Any
    required: Any
    evidence_ids: List[str] = Field(default_factory=list)
    likely_cause: Optional[str] = None
    safe_next_action: str
    needs_human: bool
    status: str  # 'OPEN' | 'REPAIRING' | 'RESOLVED' | 'ACCEPTED'
    detected_at: str

class Approval(BaseModel):
    id: str
    mission_id: str
    step_id: str
    status: ApprovalStatus
    action: str
    target: str
    args_redacted: Dict[str, Any]
    call_hash: str
    expected_changes: Dict[str, Any]
    risk: Risk
    risk_explanation: str
    compensation_available: bool
    expires_at: str
    decided_at: Optional[str] = None
    decided_by: Optional[str] = None
    note: Optional[str] = None

class RewindPreviewItem(BaseModel):
    step_id: str
    description: str
    inverse_tool: Optional[str] = None
    reversible: bool
    concurrent_change_detected: bool = False
    reason: Optional[str] = None

class RewindPreview(BaseModel):
    mission_id: str
    preview_hash: str
    items: List[RewindPreviewItem]
    non_reversible: List[str] = Field(default_factory=list)

class RewindResultItem(BaseModel):
    step_id: str
    status: str  # 'COMPENSATED' | 'FAILED' | 'SKIPPED'
    detail: Optional[str] = None

class RewindResult(BaseModel):
    id: str
    mission_id: str
    status: str  # 'RUNNING' | 'DONE' | 'PARTIAL' | 'FAILED'
    items: List[RewindResultItem]
    verification: Optional[VerificationReport] = None
    residual_effects: List[str] = Field(default_factory=list)

class AuditEvent(BaseModel):
    id: str
    seq: int
    mission_id: Optional[str] = None
    step_id: Optional[str] = None
    type: str
    actor: str
    tool: Optional[str] = None
    args_hash: Optional[str] = None
    result_summary: Optional[str] = None
    status: str
    prev_hash: str
    hash: str
    ts: str

class ToolHealth(BaseModel):
    p_fail: Optional[float] = None
    anomaly: bool = False

class McpTool(BaseModel):
    name: str
    server_id: str
    description: str
    input_schema: Dict[str, Any] = Field(default_factory=dict)
    risk: Risk
    reversibility: Reversibility
    idempotent_by: List[str] = Field(default_factory=list)
    has_inverse: bool = False
    fallback: Optional[str] = None
    timeout_s: float = 30.0
    permissions: List[str] = Field(default_factory=list)
    taints_output: bool = False
    available: bool = True
    health: ToolHealth = Field(default_factory=ToolHealth)

class McpServer(BaseModel):
    id: str
    name: str
    version: Optional[str] = None
    transport: str  # 'stdio' | 'streamable_http'
    source: Source
    status: str  # 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED'
    last_seen: str
    tool_count: int
    latency_ms_ewma: float

class ToolInvocation(BaseModel):
    id: str
    mission_id: str
    step_id: str
    tool: str
    server_id: str
    transport: str
    attempt: int
    started_at: str
    duration_ms: float
    status: str  # 'OK' | 'ERROR'
    error_class: Optional[ErrorClass] = None
    args_hash: str
    result_summary: Optional[str] = None

class DatasetSplit(BaseModel):
    train: int
    val: int
    test: int

class DatasetMeta(BaseModel):
    kind: str  # 'SYNTHETIC' | 'OBSERVED'
    size: int
    seed: int
    split: DatasetSplit

class ModelInfo(BaseModel):
    name: str  # 'failure_predictor' | 'risk_scorer' | 'anomaly_detector' | 'internship_ranker' | 'injection_classifier'
    version: str
    trained_at: str
    dataset: DatasetMeta
    available: bool
    limitations: List[str] = Field(default_factory=list)
    safe_envelope: Optional[str] = None

class MetricGate(BaseModel):
    name: str
    threshold: float
    value: float
    passed: bool

class BaselineComparison(BaseModel):
    name: str
    metrics: Dict[str, float]

class ConfusionMatrix(BaseModel):
    labels: List[str]
    matrix: List[List[int]]

class ModelCurves(BaseModel):
    roc: Optional[Dict[str, List[float]]] = None  # {fpr: [], tpr: []}
    calibration: Optional[Dict[str, List[float]]] = None  # {pred: [], obs: []}

class ScoreHistogram(BaseModel):
    bins: List[float]
    counts: List[int]

class ModelEvaluation(BaseModel):
    model: str
    version: str
    metrics: Dict[str, float]
    confusion_matrix: Optional[ConfusionMatrix] = None
    curves: Optional[ModelCurves] = None
    prob_histogram: Optional[ScoreHistogram] = None
    baseline_comparison: Optional[List[BaselineComparison]] = None
    gates: List[MetricGate] = Field(default_factory=list)
    evaluated_at: str

class RiskAssessment(BaseModel):
    p_fail: Optional[float] = None
    severity: Risk
    reversibility: Reversibility
    policy_decision: str  # 'AUTO' | 'APPROVAL_REQUIRED' | 'BLOCKED'
    approval_level: Optional[str] = None
    mitigation: str
    explanation: str
    ml_available: bool
    policy_override: bool

class Fault(BaseModel):
    id: str
    name: str
    description: str
    expected_behavior: str

class FaultRun(BaseModel):
    id: str
    fault_id: str
    status: str  # 'RUNNING' | 'PASS' | 'FAIL'
    target: str
    injected: str
    initial_state: Dict[str, Any] = Field(default_factory=dict)
    expected: str
    actual: str
    attempts: int
    recovery_strategy: str
    duplicates: int = 0
    false_success_claims: int = 0
    final_verification: VerificationStatus
    duration_ms: float
    ran_at: str

class SecurityEvent(BaseModel):
    id: str
    mission_id: Optional[str] = None
    kind: SecurityEventKind
    detail: str
    source: Optional[str] = None
    ts: str

class AnomalyItem(BaseModel):
    ts: str
    tool: str
    metric: str
    score: float
    threshold: float
    flagged: bool
    injected: bool

class FeatureContribution(BaseModel):
    feature: str
    weight: float
    value: float
    contribution: float

class InternshipRankingItem(BaseModel):
    opportunity_id: str
    rank: int
    score: float
    contributions: List[FeatureContribution]
    eligibility: Dict[str, str]  # 'CONFIRMED_ELIGIBLE' | 'CONFIRMED_INELIGIBLE' | 'UNKNOWN' | 'CONFLICTING'
    why_ranked_above_next: Optional[str] = None

class Envelope(BaseModel):
    id: int
    type: str
    mission_id: Optional[str] = None
    step_id: Optional[str] = None
    correlation_id: str
    ts: str
    data: Dict[str, Any] = Field(default_factory=dict)

# Compare & Baseline Schemas
class CompareRequest(BaseModel):
    goal: str
    faults: List[str] = Field(default_factory=list)
    seed: Optional[int] = 42

class CompareResultSide(BaseModel):
    duration_ms: float
    duplicates: int
    retries: int
    verified: bool
    status: str  # "COMPLETED" | "FAILED"

class CompareResponse(BaseModel):
    baseline: CompareResultSide
    rewindx: CompareResultSide

class CompareEventItem(BaseModel):
    id: int
    side: str  # "baseline" | "rewindx"
    type: str  # "step_started" | "step_done" | "fault_injected" | "recovering" | "recovered" | "duplicate_detected" | "verified" | "finished"
    step_id: Optional[str] = None
    ts: str
    data: Dict[str, Any] = Field(default_factory=dict)

class CompareRunAllItem(BaseModel):
    fault: str
    name: str
    baseline: CompareResultSide
    rewindx: CompareResultSide

class CompareRunAllResponse(BaseModel):
    results: List[CompareRunAllItem]

# Proof Receipt Schemas
class ProofReceiptResponse(BaseModel):
    goal: str
    tests_passed: int
    tests_total: int
    duplicates: int
    residue: int
    audit_chain_ok: bool
    final_hash: str
    verdict: str  # "VERIFIED" | "PARTIAL" | "FAILED"
    created_at: str
    mode: str
    verify_url: str

class ProofVerifyResponse(BaseModel):
    final_hash: str
    matched: bool
    chain_valid: bool
    audit_event_id: Optional[str] = None
    seq: Optional[int] = None
    timestamp: Optional[str] = None
    actor: Optional[str] = None
    status: str

# Timeline Schemas
class TimelineStage(BaseModel):
    name: str  # "predict" | "perform" | "prove" | "recover" | "rewind"
    started_at: str
    ended_at: Optional[str] = None
    status: str  # "COMPLETED" | "FAILED" | "RUNNING"

class TimelineFault(BaseModel):
    type: str
    ts: str
    step_id: Optional[str] = None

class TimelineResponse(BaseModel):
    stages: List[TimelineStage]
    faults: List[TimelineFault]

