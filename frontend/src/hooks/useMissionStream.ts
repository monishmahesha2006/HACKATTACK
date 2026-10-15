import { useEffect, useRef } from 'react';
import { Envelope, Mission, Step, Plan, Gap, Approval } from '../api/types';
import { useMissionStore } from '../store/useMissionStore';

/**
 * Pure state reducer applying SSE event envelopes to client mission state.
 * Fully unit-testable across all contract event types.
 */
export function applyEvent(
  state: {
    mission: Mission | null;
    plan: Plan | null;
    gaps: Gap[];
    approvals: Approval[];
  },
  envelope: Envelope
) {
  const { type, data } = envelope;

  switch (type) {
    case 'mission.created':
      // Handled by creator
      break;

    case 'mission.status':
      if (state.mission) {
        state.mission = {
          ...state.mission,
          status: data.to,
        };
      }
      break;

    case 'plan.generated':
      if (data.plan) {
        state.plan = data.plan;
      }
      break;

    case 'step.started':
      if (state.plan) {
        state.plan = {
          ...state.plan,
          steps: state.plan.steps.map((s) =>
            s.id === data.step_id ? { ...s, status: 'RUNNING', attempts: data.attempt || s.attempts + 1 } : s
          ),
        };
      }
      break;

    case 'step.completed':
      if (state.plan) {
        state.plan = {
          ...state.plan,
          steps: state.plan.steps.map((s) =>
            s.id === data.step_id ? { ...s, status: 'DONE', duration_ms: data.duration_ms } : s
          ),
        };
      }
      break;

    case 'step.failed':
      if (state.plan) {
        state.plan = {
          ...state.plan,
          steps: state.plan.steps.map((s) =>
            s.id === data.step_id ? { ...s, status: 'FAILED' } : s
          ),
        };
      }
      break;

    case 'step.fallback':
      if (state.plan) {
        state.plan = {
          ...state.plan,
          steps: state.plan.steps.map((s) =>
            s.id === data.step_id ? { ...s, status: 'FALLBACK', used_fallback: true } : s
          ),
        };
      }
      break;

    case 'approval.required':
      if (data.approval) {
        const existing = state.approvals.some((a) => a.id === data.approval.id);
        if (!existing) {
          state.approvals = [data.approval, ...state.approvals];
        }
      }
      break;

    case 'approval.decided':
      state.approvals = state.approvals.map((a) =>
        a.id === data.approval_id ? { ...a, status: data.decision === 'approve' ? 'APPROVED' : 'REJECTED' } : a
      );
      break;

    case 'discrepancy.detected':
      if (data.gap) {
        const hasGap = state.gaps.some((g) => g.id === data.gap.id);
        if (!hasGap) {
          state.gaps = [data.gap, ...state.gaps];
        }
      }
      break;

    case 'discrepancy.resolved':
      if (data.gap) {
        state.gaps = state.gaps.map((g) => (g.id === data.gap.id ? { ...g, status: 'RESOLVED' } : g));
      }
      break;

    case 'mission.completed':
      if (state.mission) {
        state.mission = {
          ...state.mission,
          status: data.status || 'COMPLETED',
        };
      }
      break;

    default:
      break;
  }

  return state;
}

export function useMissionStream(missionId: string | null) {
  const addEvent = useMissionStore((s) => s.addEvent);
  const setTelemetry = useMissionStore((s) => s.setTelemetry);
  const lastEventIdRef = useRef<number>(0);
  const byteCountRef = useRef<number>(0);
  const pingsReceivedRef = useRef<number>(0);

  useEffect(() => {
    if (!missionId) return;

    const url = `/api/v1/missions/${missionId}/events`;
    let eventSource: EventSource | null = null;
    let bytesInterval: any = null;

    const connect = () => {
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        setTelemetry(1.2, 100, 4.2, true);
      };

      eventSource.onerror = () => {
        setTelemetry(15.0, 50, 0, false);
      };

      eventSource.onmessage = (e) => {
        byteCountRef.current += e.data.length;
        if (e.data === ': ping' || e.data.trim() === '') {
          pingsReceivedRef.current += 1;
          return;
        }

        try {
          const envelope: Envelope = JSON.parse(e.data);
          if (envelope.id) {
            lastEventIdRef.current = envelope.id;
          }
          addEvent(envelope);

          // Update store with reducer
          useMissionStore.setState((prev) => {
            const nextState = applyEvent(
              {
                mission: prev.mission ? { ...prev.mission } : null,
                plan: prev.plan ? { ...prev.plan } : null,
                gaps: [...prev.gaps],
                approvals: [...prev.approvals],
              },
              envelope
            );
            return nextState;
          });
        } catch {
          // Ignore parse errors on keepalive comments
        }
      };
    };

    connect();

    // Telemetry rate calculator interval
    bytesInterval = setInterval(() => {
      const kbps = (byteCountRef.current * 8) / 1024 / 2; // measured over 2s
      byteCountRef.current = 0;
      useMissionStore.setState((s) => ({
        busKbps: Math.max(0.4, Number(kbps.toFixed(1))),
      }));
    }, 2000);

    return () => {
      if (eventSource) eventSource.close();
      if (bytesInterval) clearInterval(bytesInterval);
      setTelemetry(1.2, 100, 0, false);
    };
  }, [missionId, addEvent, setTelemetry]);
}
