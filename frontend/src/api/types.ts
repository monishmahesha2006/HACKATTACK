export type Mode = 'LOCAL_DEMO' | 'REAL' | 'DEGRADED';

export type MissionStatus =
  | 'CREATED'
  | 'PLANNING'
  | 'AWAITING_APPROVAL'
  | 'REHEARSING'
  | 'READY'
  | 'RUNNING'
  | 'PAUSED'
  | 'RECOVERING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REWINDING'
  | 'REWOUND';

export type StepStatus =
  | 'PENDING'
  | 'AWAITING_APPROVAL'
  | 'RUNNING'
  | 'RETRYING'
  | 'FALLBACK'
  | 'DONE'
  | 'FAILED'
  | 'SKIPPED'
  | 'COMPENSATED';

export type Risk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Reversibility = 'REVERSIBLE' | 'PARTIAL' | 'IRREVERSIBLE';
export type Provenance = 'PREDICTED' | 'OBSERVED' | 'VERIFIED';
export type ClaimStatus = 'VERIFIED' | 'INFERRED' | 'UNVERIFIED' | 'FAILED';
export type VerificationStatus = 'VERIFIED' | 'FAILED' | 'PARTIALLY_VERIFIED' | 'UNVERIFIED' | 'BLOCKED';

export type GapKind =
  | 'MISSING'
  | 'EXTRA'
  | 'DUPLICATE'
  | 'WRONG_VALUE'
  | 'BAD_URL'
  | 'INVALID_DEADLINE'
  | 'PARTIAL_WORKFLOW'
  | 'UNEXPECTED_CHANGE'
  | 'UNVERIFIED_CLAIM'
  | 'FALSE_SUCCESS';

export type Severity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export type ErrorClass =
  | 'TRANSIENT_NETWORK'
  | 'RATE_LIMIT'
  | 'AUTH'
  | 'PERMISSION'
  | 'INVALID_ARGS'
  | 'TOOL_UNAVAILABLE'
  | 'PARTIAL_WRITE'
  | 'DUPLICATE_CONFLICT'
  | 'VERIFICATION_FAILURE'
  | 'UNKNOWN_OUTCOME'
  | 'PERMANENT';

export type Source = 'LOCAL_DEMO' | 'REAL';
export type Phase = 'PLAN' | 'REHEARSE' | 'PERFORM' | 'PROVE' | 'REWIND';

export interface MissionCounts {
  steps: number;
  done: number;
  failed: number;
  retries: number;
  gaps_open: number;
  approvals_pending: number;
}

export interface Mission {
  id: string;
  goal: string;
  constraints?: string[];
  status: MissionStatus;
  mode: Mode;
  created_at: string;
  updated_at: string;
  counts: MissionCounts;
  phase: Phase;
}

export interface Postcondition {
  type: string;
  params: Record<string, any>;
  passed?: boolean;
}

export interface StepError {
  class: ErrorClass;
  message: string;
}

export interface Step {
  id: string;
  mission_id: string;
  index: number;
  description: string;
  tool: string;
  server: string;
  source: Source;
  args: Record<string, any>; // Redacted
  depends_on: string[];
  risk: Risk;
  reversibility: Reversibility;
  status: StepStatus;
  attempts: number;
  max_attempts: number;
  idempotency_key: string;
  fallback_tool?: string;
  used_fallback: boolean;
  postconditions: Postcondition[];
  started_at?: string;
  finished_at?: string;
  duration_ms?: number;
  result_summary?: string;
  error?: StepError;
  evidence_ids: string[];
  inverse_available: boolean;
}

export interface PlanEdge {
  from: string;
  to: string;
}

export interface PlanDissent {
  score: number;
  differing_decisions: string[];
}

export interface Plan {
  mission_id: string;
  steps: Step[];
  edges: PlanEdge[];
  planner_notes?: string;
  dissent?: PlanDissent;
}

export interface AcceptanceTestResult {
  status: 'PASS' | 'FAIL' | 'NOT_RUN';
  evidence_ids: string[];
  observed?: any;
  ran_at?: string;
  duration_ms?: number;
}

export interface AcceptanceTest {
  id: string;
  mission_id: string;
  description: string;
  kind: 'DETERMINISTIC' | 'LLM_ASSISTED';
  mandatory: boolean;
  spec: Record<string, any>;
  frozen_hash: string;
  registered_at: string;
  result?: AcceptanceTestResult;
}

export interface ResourceCreate {
  resource: string;
  count: number;
}

export interface PredictedDiff {
  creates: ResourceCreate[];
  updates: Record<string, any>[];
  deletes: Record<string, any>[];
  sends: number;
}

export interface PremortemItem {
  failure_mode: string;
  probability: number;
  mitigation: string;
  fallback?: string;
}

export interface StateUnchangedProof {
  before_hash: string;
  after_hash: string;
}

export interface RehearsalReport {
  mission_id: string;
  provenance: Provenance;
  predicted_diff: PredictedDiff;
  irreversible_ops: string[];
  premortem: PremortemItem[];
  uncertainty_notes: string[];
  approval_required: boolean;
  cached_reads: number;
  real_state_unchanged_proof: StateUnchangedProof;
  model_version?: string;
}

export interface Evidence {
  id: string;
  kind: 'WEB' | 'SHEET_ROW' | 'DRAFT' | 'FILE' | 'TOOL_RESULT';
  source_url?: string;
  snippet?: string;
  snippet_offsets?: [number, number];
  retrieved_at: string;
  tool_invocation_id?: string;
  observed_value?: any;
  hash: string;
}

export interface ClaimLocation {
  kind: 'sheet_cell' | 'draft_sentence';
  ref: string;
}

export interface Claim {
  id: string;
  mission_id: string;
  text: string;
  status: ClaimStatus;
  method: string;
  evidence_ids: string[];
  ts: string;
  location?: ClaimLocation;
}

export interface VerificationReport {
  mission_id: string;
  status: VerificationStatus;
  tests: AcceptanceTest[];
  claims: Claim[];
  gaps_open: number;
  ran_at: string;
  notes?: string;
}

export interface Gap {
  id: string;
  mission_id: string;
  kind: GapKind;
  severity: Severity;
  expected: any;
  observed: any;
  required: any;
  evidence_ids: string[];
  likely_cause?: string;
  safe_next_action: string;
  needs_human: boolean;
  status: 'OPEN' | 'REPAIRING' | 'RESOLVED' | 'ACCEPTED';
  detected_at: string;
}

export interface Approval {
  id: string;
  mission_id: string;
  step_id: string;
  status: ApprovalStatus;
  action: string;
  target: string;
  args_redacted: Record<string, any>;
  call_hash: string;
  expected_changes: Record<string, any>;
  risk: Risk;
  risk_explanation: string;
  compensation_available: boolean;
  expires_at: string;
  decided_at?: string;
  decided_by?: string;
  note?: string;
}

export interface RewindPreviewItem {
  step_id: string;
  description: string;
  inverse_tool?: string;
  reversible: boolean;
  concurrent_change_detected: boolean;
  reason?: string;
}

export interface RewindPreview {
  mission_id: string;
  preview_hash: string;
  items: RewindPreviewItem[];
  non_reversible: string[];
}

export interface RewindResultItem {
  step_id: string;
  status: 'COMPENSATED' | 'FAILED' | 'SKIPPED';
  detail?: string;
}

export interface RewindResult {
  id: string;
  mission_id: string;
  status: 'RUNNING' | 'DONE' | 'PARTIAL' | 'FAILED';
  items: RewindResultItem[];
  verification?: VerificationReport;
  residual_effects: string[];
}

export interface AuditEvent {
  id: string;
  seq: number;
  mission_id?: string;
  step_id?: string;
  type: string;
  actor: string;
  tool?: string;
  args_hash?: string;
  result_summary?: string;
  status: string;
  prev_hash: string;
  hash: string;
  ts: string;
}

export interface ToolHealth {
  p_fail: number | null;
  anomaly: boolean;
}

export interface McpTool {
  name: string;
  server_id: string;
  description: string;
  input_schema: Record<string, any>;
  risk: Risk;
  reversibility: Reversibility;
  idempotent_by: string[];
  has_inverse: boolean;
  fallback?: string;
  timeout_s: number;
  permissions: string[];
  taints_output: boolean;
  available: boolean;
  health: ToolHealth;
}

export interface McpServer {
  id: string;
  name: string;
  version?: string;
  transport: 'stdio' | 'streamable_http';
  source: Source;
  status: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED';
  last_seen: string;
  tool_count: number;
  latency_ms_ewma: number;
}

export interface ToolInvocation {
  id: string;
  mission_id: string;
  step_id: string;
  tool: string;
  server_id: string;
  transport: string;
  attempt: number;
  started_at: string;
  duration_ms: number;
  status: 'OK' | 'ERROR';
  error_class?: ErrorClass;
  args_hash: string;
  result_summary?: string;
}

export interface MetricGate {
  name: string;
  threshold: number;
  value: number;
  passed: boolean;
}

export interface BaselineComparison {
  name: string;
  metrics: Record<string, number>;
}

export interface ConfusionMatrix {
  labels: string[];
  matrix: number[][];
}

export interface ModelCurves {
  roc?: { fpr: number[]; tpr: number[] };
  calibration?: { pred: number[]; obs: number[] };
}

export interface ScoreHistogram {
  bins: number[];
  counts: number[];
}

export interface ModelEvaluation {
  model: string;
  version: string;
  metrics: Record<string, number>;
  confusion_matrix?: ConfusionMatrix;
  curves?: ModelCurves;
  prob_histogram?: ScoreHistogram;
  baseline_comparison?: BaselineComparison[];
  gates: MetricGate[];
  evaluated_at: string;
}

export interface ModelInfo {
  name: 'failure_predictor' | 'risk_scorer' | 'anomaly_detector' | 'internship_ranker' | 'injection_classifier';
  version: string;
  trained_at: string;
  dataset: {
    kind: 'SYNTHETIC' | 'OBSERVED';
    size: number;
    seed: number;
    split: { train: number; val: number; test: number };
  };
  available: boolean;
  limitations: string[];
  safe_envelope?: string;
}

export interface RiskAssessment {
  p_fail: number | null;
  severity: Risk;
  reversibility: Reversibility;
  policy_decision: 'AUTO' | 'APPROVAL_REQUIRED' | 'BLOCKED';
  approval_level?: string;
  mitigation: string;
  explanation: string;
  ml_available: boolean;
  policy_override: boolean;
}

export interface Fault {
  id: string;
  name: string;
  description: string;
  expected_behavior: string;
}

export interface FaultRun {
  id: string;
  fault_id: string;
  status: 'RUNNING' | 'PASS' | 'FAIL';
  target: string;
  injected: string;
  initial_state: Record<string, any>;
  expected: string;
  actual: string;
  attempts: number;
  recovery_strategy: string;
  duplicates: number;
  false_success_claims: number;
  final_verification: VerificationStatus;
  duration_ms: number;
  ran_at: string;
}

export interface SecurityEvent {
  id: string;
  mission_id?: string;
  kind: 'INJECTION_QUARANTINED' | 'UNAUTHORIZED_TOOL_CALL' | 'APPROVAL_BYPASS_BLOCKED' | 'PATH_TRAVERSAL_BLOCKED' | 'SECRET_REDACTED';
  detail: string;
  source?: string;
  ts: string;
}

export interface Envelope {
  id: number;
  type: string;
  mission_id?: string;
  step_id?: string;
  correlation_id: string;
  ts: string;
  data: Record<string, any>;
}
