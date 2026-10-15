# REWIND X API CONTRACT

Base URL `http://localhost:8000/api/v1`. Frontend dev origin `http://localhost:5173` (CORS allowed). Auth: header `X-Dev-Token: <env DEV_TOKEN>` on every state-changing route. IDs are prefixed strings (`msn_`, `stp_`, `apr_`, `gap_`, `clm_`, `tst_`, `evt_`, `rwd_`, `flt_`). Timestamps ISO-8601 UTC. Pagination `?cursor=&limit=` returns `{items, next_cursor}`. Errors: HTTP status + `{error:{code,message,details?,correlation_id}}`. OpenAPI at `/openapi.json`; if it disagrees with this file, OpenAPI wins and this file gets fixed. Additive changes only after freeze; breaking changes need a note in `docs/CONTRACT_REQUESTS.md`.

## Enums
- Mode: `LOCAL_DEMO | REAL | DEGRADED`
- MissionStatus: `CREATED PLANNING AWAITING_APPROVAL REHEARSING READY RUNNING PAUSED RECOVERING VERIFYING COMPLETED PARTIALLY_COMPLETED FAILED CANCELLED REWINDING REWOUND`
- StepStatus: `PENDING AWAITING_APPROVAL RUNNING RETRYING FALLBACK DONE FAILED SKIPPED COMPENSATED`
- Risk: `LOW MEDIUM HIGH CRITICAL`; Reversibility: `REVERSIBLE PARTIAL IRREVERSIBLE`; Provenance: `PREDICTED OBSERVED VERIFIED`
- ClaimStatus: `VERIFIED INFERRED UNVERIFIED FAILED`; VerificationStatus: `VERIFIED FAILED PARTIALLY_VERIFIED UNVERIFIED BLOCKED`
- GapKind: `MISSING EXTRA DUPLICATE WRONG_VALUE BAD_URL INVALID_DEADLINE PARTIAL_WORKFLOW UNEXPECTED_CHANGE UNVERIFIED_CLAIM FALSE_SUCCESS`; Severity: `INFO WARN ERROR CRITICAL`
- ApprovalStatus: `PENDING APPROVED REJECTED EXPIRED CANCELLED`
- ErrorClass: `TRANSIENT_NETWORK RATE_LIMIT AUTH PERMISSION INVALID_ARGS TOOL_UNAVAILABLE PARTIAL_WRITE DUPLICATE_CONFLICT VERIFICATION_FAILURE UNKNOWN_OUTCOME PERMANENT`
- Source (on every tool/adapter): `LOCAL_DEMO | REAL`

## Core types (TypeScript notation)
```ts
Mission { id, goal, constraints?, status:MissionStatus, mode:Mode, created_at, updated_at,
  counts:{steps,done,failed,retries,gaps_open,approvals_pending}, phase:'PLAN'|'REHEARSE'|'PERFORM'|'PROVE'|'REWIND' }
Step { id, mission_id, index, description, tool, server, source:Source, args /*redacted*/, depends_on:string[], risk:Risk,
  reversibility:Reversibility, status:StepStatus, attempts, max_attempts, idempotency_key, fallback_tool?, used_fallback:boolean,
  postconditions:{type,params,passed?}[], started_at?, finished_at?, duration_ms?, result_summary?, error?:{class:ErrorClass,message},
  evidence_ids:string[], inverse_available:boolean }
Plan { mission_id, steps:Step[], edges:{from,to}[], planner_notes?, dissent?:{score,differing_decisions:string[]} }
AcceptanceTest { id, mission_id, description, kind:'DETERMINISTIC'|'LLM_ASSISTED', mandatory:boolean, spec, frozen_hash, registered_at,
  result?:{status:'PASS'|'FAIL'|'NOT_RUN', evidence_ids:string[], observed?, ran_at?, duration_ms?} }
RehearsalReport { mission_id, provenance:'PREDICTED', predicted_diff:{creates:{resource,count}[], updates:[], deletes:[], sends:number},
  irreversible_ops:string[], premortem:{failure_mode,probability,mitigation,fallback?}[], uncertainty_notes:string[],
  approval_required:boolean, cached_reads:number, real_state_unchanged_proof:{before_hash,after_hash}, model_version? }
Evidence { id, kind:'WEB'|'SHEET_ROW'|'DRAFT'|'FILE'|'TOOL_RESULT', source_url?, snippet?, snippet_offsets?:[n,n], retrieved_at,
  tool_invocation_id?, observed_value?, hash }
Claim { id, mission_id, text, status:ClaimStatus, method, evidence_ids:string[], ts, location?:{kind:'sheet_cell'|'draft_sentence', ref} }
VerificationReport { mission_id, status:VerificationStatus, tests:AcceptanceTest[], claims:Claim[], gaps_open, ran_at, notes? }
Gap { id, mission_id, kind:GapKind, severity:Severity, expected, observed, required, evidence_ids:string[], likely_cause?,
  safe_next_action, needs_human:boolean, status:'OPEN'|'REPAIRING'|'RESOLVED'|'ACCEPTED', detected_at }
Approval { id, mission_id, step_id, status:ApprovalStatus, action, target, args_redacted, call_hash, expected_changes, risk:Risk,
  risk_explanation, compensation_available:boolean, expires_at, decided_at?, decided_by?, note? }
RewindPreview { mission_id, preview_hash, items:{step_id,description,inverse_tool?,reversible:boolean,concurrent_change_detected:boolean,reason?}[], non_reversible:string[] }
RewindResult { id, mission_id, status:'RUNNING'|'DONE'|'PARTIAL'|'FAILED', items:{step_id,status:'COMPENSATED'|'FAILED'|'SKIPPED',detail?}[],
  verification?:VerificationReport, residual_effects:string[] }
AuditEvent { id, seq, mission_id?, step_id?, type, actor, tool?, args_hash?, result_summary, status, prev_hash, hash, ts }
McpServer { id, name, version?, transport:'stdio'|'streamable_http', source:Source, status:'CONNECTED'|'DEGRADED'|'DISCONNECTED', last_seen, tool_count, latency_ms_ewma }
McpTool { name, server_id, description, input_schema, risk, reversibility, idempotent_by:string[], has_inverse:boolean, fallback?, timeout_s,
  permissions:string[], taints_output:boolean, available:boolean, health:{p_fail:number|null, anomaly:boolean} }
ToolInvocation { id, mission_id, step_id, tool, server_id, transport, attempt, started_at, duration_ms, status:'OK'|'ERROR', error_class?, args_hash, result_summary }
ModelInfo { name:'failure_predictor'|'risk_scorer'|'anomaly_detector'|'internship_ranker'|'injection_classifier', version, trained_at,
  dataset:{kind:'SYNTHETIC'|'OBSERVED', size, seed, split:{train,val,test}}, available:boolean, limitations:string[], safe_envelope? }
ModelEvaluation { model, version, metrics:Record<string,number>, confusion_matrix?:{labels,matrix:number[][]},
  curves?:{roc?:{fpr,tpr}, calibration?:{pred,obs}}, prob_histogram?:{bins,counts}, baseline_comparison?:{name,metrics}[],
  gates:{name,threshold,value,passed:boolean}[], evaluated_at }
RiskAssessment { p_fail:number|null, severity:Risk, reversibility:Reversibility, policy_decision:'AUTO'|'APPROVAL_REQUIRED'|'BLOCKED',
  approval_level, mitigation, explanation, ml_available:boolean, policy_override:boolean }
Fault { id, name, description, expected_behavior }
FaultRun { id, fault_id, status:'RUNNING'|'PASS'|'FAIL', target, injected, initial_state, expected, actual, attempts, recovery_strategy,
  duplicates, false_success_claims, final_verification:VerificationStatus, duration_ms, ran_at }
SecurityEvent { id, mission_id?, kind:'INJECTION_QUARANTINED'|'UNAUTHORIZED_TOOL_CALL'|'APPROVAL_BYPASS_BLOCKED'|'PATH_TRAVERSAL_BLOCKED'|'SECRET_REDACTED', detail, source?, ts }
```

## Endpoints
- Health/system: `GET /health` -> `{status,version}`; `GET /ready` -> `{mode, llm:{provider,available}, ml:{available,missing[]}, mcp:{connected,total}, db}`; `GET /stats/overview` (all derived from DB: missions by status, verified_steps, recovery_attempts, recoveries_succeeded, gaps_detected, approvals_pending, mcp counts, tool_health, recent_missions, recent_security_events); `POST /demo/reset` (demo data only).
- Missions: `POST /missions {goal,constraints?}`; `GET /missions` (paginated); `GET /missions/{id}`; `GET /missions/{id}/plan`; `GET /missions/{id}/tests`; `POST /missions/{id}/rehearse` and `GET .../rehearsal`; `POST .../run|pause|resume|cancel` (409 on illegal transition); `POST .../steer {instruction}` -> `{replanned_steps}`; `GET .../steps/{step_id}/invocations`; `GET .../evidence/{evidence_id}`.
- Verification/gaps: `POST .../verify`, `GET .../verification`; `GET .../gaps`; `POST .../gaps/{gap_id}/repair` (403 when human approval needed); `GET .../claims`.
- Approvals: `GET /approvals?status=&mission_id=`; `POST /approvals/{id}/decision {decision:'approve'|'reject'|'edit', edited_args?, note?}` (the single-use token stays server-side).
- Rewind: `POST .../rewind/preview {target_step_id?}` -> `RewindPreview`; `POST .../rewind {target_step_id?, preview_hash}` -> `RewindResult` (409 if stale); `GET .../rewind`.
- Audit: `GET /audit/events?mission_id=&cursor=&limit=`; `GET /audit/verify` -> `{valid,checked,first_invalid_seq?,head_hash}`; `POST /audit/tamper-test` (operates on a scratch copy only); `GET /missions/{id}/report` (JSON) and `.../report.md`.
- MCP: `GET /mcp/servers`; `GET /mcp/tools`; `POST /mcp/refresh`; `GET /mcp/invocations?mission_id=&cursor=`.
- ML: `GET /ml/models`; `GET /ml/models/{name}/evaluation`; `POST /ml/infer/failure {features}` -> `{p_fail,model_version,latency_ms,top_factors[]}`; `POST /ml/infer/risk {tool,args?}` -> `RiskAssessment`; `GET /ml/anomalies?limit=` -> items `{ts,tool,metric,score,threshold,flagged,injected}`; `GET /ml/ranking/{mission_id}` -> items `{opportunity_id,rank,score,contributions:{feature,weight,value,contribution}[],eligibility:Record<field,'CONFIRMED_ELIGIBLE'|'CONFIRMED_INELIGIBLE'|'UNKNOWN'|'CONFLICTING'>,why_ranked_above_next?}`.
- Chaos: `GET /chaos/scenarios` (10: tool timeout, rate limit 429, malformed response, spreadsheet outage, partial write, duplicate retry, auth failure, tool removed mid-run, unexpected state change, prompt injection); `POST /chaos/run {fault_id|'all'}`; `GET /chaos/runs`; `POST /chaos/inject {mission_id,server,fault,count?}` (live "Break a tool"); `POST /chaos/clear {server}`.
- Security: `GET /security/events?mission_id=`.

## Server-Sent Events
`GET /missions/{id}/events` (mission stream) and `GET /events` (global: approvals, mode changes, security). Format `id: <seq>\nevent: <type>\ndata: <Envelope>\n\n`; heartbeat `: ping` every 15s; honor `Last-Event-ID`; `GET /missions/{id}/events/history?after=<seq>` for catch-up. Events are persisted BEFORE broadcast. `Envelope { id:number, type, mission_id?, step_id?, correlation_id, ts, data }`.
Types: `mission.created`, `mission.status{from,to}`, `plan.generated{plan}`, `tests.registered{tests}`, `rehearsal.completed{report}`, `approval.required{approval}`, `approval.decided{approval}`, `step.started{step}`, `tool.invoked{invocation}`, `step.retrying{step_id,attempt,error_class,backoff_ms}`, `step.fallback{step_id,from_tool,to_tool,reason}`, `step.completed{step}`, `step.failed{step}`, `discrepancy.detected{gap}`, `discrepancy.resolved{gap}`, `recovery.started{reason}`, `recovery.completed{outcome,duplicates}`, `security.blocked{event}`, `verification.completed{report}`, `rewind.started{preview}`, `rewind.step{step_id,status}`, `rewind.completed{result}`, `mission.completed{status,report_url}`, `fault.injected{server,fault}`, `mode.changed{mode}`.

## Contract rules
1. No endpoint returns hardcoded or fabricated numbers; stats derive from persisted records or saved model artifacts.
2. Anything simulated carries `provenance:'PREDICTED'` or `source:'LOCAL_DEMO'` and the UI must display it.
3. After the first working backend, run `make export-samples` to save real payloads to `docs/samples/*.json`.
