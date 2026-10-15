import {
  Mission, Plan, AcceptanceTest, RehearsalReport, Evidence, Claim,
  VerificationReport, Gap, Approval, RewindPreview, RewindResult,
  AuditEvent, McpServer, McpTool, ToolInvocation, ModelInfo,
  ModelEvaluation, RiskAssessment, Fault, FaultRun, SecurityEvent, Envelope
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1';
const DEV_TOKEN = import.meta.env.VITE_DEV_TOKEN || 'rx_dev_token_secret_key_2026';

export class ApiError extends Error {
  code: string;
  status: number;
  correlationId?: string;

  constructor(status: number, message: string, code: string = 'API_ERROR', correlationId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.correlationId = correlationId;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Inject X-Dev-Token on state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || 'GET')) {
    headers.set('X-Dev-Token', DEV_TOKEN);
  }

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let errBody: any = {};
      try {
        errBody = await res.json();
      } catch {
        // Non-JSON error
      }
      const errDetail = errBody.error || errBody.detail || 'An unexpected error occurred';
      const msg = typeof errDetail === 'string' ? errDetail : (errDetail.message || res.statusText);
      const code = typeof errDetail === 'object' ? (errDetail.code || 'HTTP_ERROR') : 'HTTP_ERROR';
      const corrId = typeof errDetail === 'object' ? errDetail.correlation_id : undefined;
      throw new ApiError(res.status, msg, code, corrId);
    }
    return (await res.json()) as T;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, err.message || 'Network unreachable', 'NETWORK_ERROR');
  }
}

export const api = {
  // System & Health
  getHealth: () => request<{ status: string; version: string }>('/health'),
  getReady: () => request<{ mode: string; llm: any; ml: any; mcp: any; db: string }>('/ready'),
  getStatsOverview: () => request<any>('/stats/overview'),
  resetDemo: () => request<{ status: string; message: string }>('/demo/reset', { method: 'POST' }),

  // Missions
  createMission: (goal: string, constraints?: string[]) =>
    request<Mission>('/missions', { method: 'POST', body: JSON.stringify({ goal, constraints }) }),
  listMissions: (limit = 20) => request<{ items: Mission[]; next_cursor: string | null }>(`/missions?limit=${limit}`),
  getMission: (id: string) => request<Mission>(`/missions/${id}`),
  getMissionPlan: (id: string) => request<Plan>(`/missions/${id}/plan`),
  getMissionTests: (id: string) => request<AcceptanceTest[]>(`/missions/${id}/tests`),
  rehearseMission: (id: string) => request<RehearsalReport>(`/missions/${id}/rehearse`, { method: 'POST' }),
  getRehearsal: (id: string) => request<RehearsalReport>(`/missions/${id}/rehearsal`),
  runMission: (id: string) => request<{ status: string }>(`/missions/${id}/run`, { method: 'POST' }),
  pauseMission: (id: string) => request<{ status: string }>(`/missions/${id}/pause`, { method: 'POST' }),
  resumeMission: (id: string) => request<{ status: string }>(`/missions/${id}/resume`, { method: 'POST' }),
  cancelMission: (id: string) => request<{ status: string }>(`/missions/${id}/cancel`, { method: 'POST' }),
  steerMission: (id: string, instruction: string) =>
    request<{ status: string; replanned_steps: string[] }>(`/missions/${id}/steer`, {
      method: 'POST',
      body: JSON.stringify({ instruction })
    }),
  getStepInvocations: (stepId: string) => request<any[]>(`/missions/steps/${stepId}/invocations`),
  getEvidence: (evidenceId: string) => request<Evidence>(`/missions/evidence/${evidenceId}`),

  // Verification & Gaps
  verifyMission: (id: string) => request<VerificationReport>(`/missions/${id}/verify`, { method: 'POST' }),
  getVerification: (id: string) => request<VerificationReport>(`/missions/${id}/verification`),
  listGaps: (id: string) => request<Gap[]>(`/missions/${id}/gaps`),
  repairGap: (missionId: string, gapId: string) =>
    request<{ status: string }>(`/missions/${missionId}/gaps/${gapId}/repair`, { method: 'POST' }),
  listClaims: (id: string) => request<Claim[]>(`/missions/${id}/claims`),

  // Approvals
  listApprovals: (status?: string, missionId?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (missionId) params.append('mission_id', missionId);
    return request<Approval[]>(`/approvals?${params.toString()}`);
  },
  decideApproval: (id: string, decision: 'approve' | 'reject' | 'edit', editedArgs?: any, note?: string) =>
    request<any>(`/approvals/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, edited_args: editedArgs, note })
    }),

  // Rewind
  previewRewind: (missionId: string, targetStepId?: string) =>
    request<RewindPreview>(`/missions/${missionId}/rewind/preview`, {
      method: 'POST',
      body: JSON.stringify({ target_step_id: targetStepId })
    }),
  executeRewind: (missionId: string, previewHash: string, targetStepId?: string) =>
    request<RewindResult>(`/missions/${missionId}/rewind`, {
      method: 'POST',
      body: JSON.stringify({ preview_hash: previewHash, target_step_id: targetStepId })
    }),

  // Audit
  listAuditEvents: (missionId?: string, limit = 50) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (missionId) params.append('mission_id', missionId);
    return request<{ items: AuditEvent[]; next_cursor: string | null }>(`/audit/events?${params.toString()}`);
  },
  verifyAuditChain: () => request<{ valid: boolean; checked: number; first_invalid_seq?: number; head_hash: string }>('/audit/verify'),
  runTamperTest: () => request<any>('/audit/tamper-test', { method: 'POST' }),

  // MCP
  getMcpServers: () => request<McpServer[]>('/mcp/servers'),
  getMcpTools: () => request<McpTool[]>('/mcp/tools'),
  refreshMcp: () => request<any>('/mcp/refresh', { method: 'POST' }),
  listMcpInvocations: (missionId?: string) => {
    const params = new URLSearchParams();
    if (missionId) params.append('mission_id', missionId);
    return request<{ items: ToolInvocation[]; next_cursor: string | null }>(`/mcp/invocations?${params.toString()}`);
  },

  // ML
  getMlModels: () => request<ModelInfo[]>('/ml/models'),
  getMlEvaluation: (modelName: string) => request<ModelEvaluation>(`/ml/models/${modelName}/evaluation`),
  inferFailure: (features: Record<string, any>) =>
    request<{ p_fail: number; model_version: string; latency_ms: number; top_factors: string[] }>('/ml/infer/failure', {
      method: 'POST',
      body: JSON.stringify(features)
    }),
  inferRisk: (tool: string, args?: Record<string, any>) =>
    request<RiskAssessment>('/ml/infer/risk', { method: 'POST', body: JSON.stringify({ tool, args }) }),
  getAnomalies: (limit = 20) => request<any[]>(`/ml/anomalies?limit=${limit}`),
  getRanking: (missionId: string) => request<any[]>(`/ml/ranking/${missionId}`),

  // Chaos
  getChaosScenarios: () => request<Fault[]>('/chaos/scenarios'),
  getChaosRuns: () => request<FaultRun[]>('/chaos/runs'),
  runChaos: (faultId: string = 'all') => request<any>('/chaos/run', { method: 'POST', body: JSON.stringify({ fault_id: faultId }) }),
  injectFault: (server: string, fault: string, count = 1) =>
    request<any>('/chaos/inject', { method: 'POST', body: JSON.stringify({ server, fault, count }) }),
  clearFaults: (server?: string) => request<any>('/chaos/clear', { method: 'POST', body: JSON.stringify({ server }) }),

  // Security
  getSecurityEvents: (missionId?: string) => {
    const params = new URLSearchParams();
    if (missionId) params.append('mission_id', missionId);
    return request<SecurityEvent[]>(`/security/events?${params.toString()}`);
  },

  // Event History catchup
  getEventHistory: (missionId: string, after = 0) => request<Envelope[]>(`/missions/${missionId}/events/history?after=${after}`),

  // Telegram
  getTelegramConfig: () => request<{ configured: boolean; enabled: boolean; bot_token_preview: string | null; chat_id: string | null }>('/telegram/config'),
  saveTelegramConfig: (bot_token: string, chat_id: string, enabled?: boolean) =>
    request<{ ok: boolean; configured: boolean; bot_token_preview: string; chat_id: string; enabled: boolean }>('/telegram/config', {
      method: 'POST',
      body: JSON.stringify({ bot_token, chat_id, enabled: enabled ?? true }),
    }),
  testTelegram: () => request<{ ok: boolean; message_id?: number }>('/telegram/test', { method: 'POST' }),
  sendTelegramReport: (mission_id: string, opportunities?: any[], drafts?: any[], candidate_name?: string) =>
    request<{ ok: boolean; chunks_sent: number }>('/telegram/send-report', {
      method: 'POST',
      body: JSON.stringify({ mission_id, opportunities: opportunities ?? [], drafts: drafts ?? [], candidate_name: candidate_name ?? 'Candidate' }),
    }),
};
