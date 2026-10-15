import { create } from 'zustand';
import {
  Mission, Plan, AcceptanceTest, RehearsalReport, VerificationReport,
  Gap, Approval, Envelope, Step
} from '../api/types';

interface MissionState {
  activeMissionId: string | null;
  mission: Mission | null;
  plan: Plan | null;
  tests: AcceptanceTest[];
  rehearsal: RehearsalReport | null;
  verification: VerificationReport | null;
  gaps: Gap[];
  approvals: Approval[];
  events: Envelope[];
  selectedStepId: string | null;

  // Live telemetry metrics derived from real measurements
  latencyMs: number;
  syncPercentage: number;
  busKbps: number;
  sseConnected: boolean;

  // App UI state
  presenterMode: boolean;
  showSettings: boolean;
  showNotifications: boolean;

  // Actions
  setActiveMissionId: (id: string | null) => void;
  setMission: (m: Mission | null) => void;
  setPlan: (p: Plan | null) => void;
  setTests: (t: AcceptanceTest[]) => void;
  setRehearsal: (r: RehearsalReport | null) => void;
  setVerification: (v: VerificationReport | null) => void;
  setGaps: (g: Gap[]) => void;
  setApprovals: (a: Approval[]) => void;
  setSelectedStepId: (id: string | null) => void;
  setTelemetry: (latency: number, sync: number, bus: number, connected: boolean) => void;
  togglePresenterMode: () => void;
  setShowSettings: (v: boolean) => void;
  setShowNotifications: (v: boolean) => void;
  addEvent: (e: Envelope) => void;
  reset: () => void;
}

export const useMissionStore = create<MissionState>((set) => ({
  activeMissionId: null,
  mission: null,
  plan: null,
  tests: [],
  rehearsal: null,
  verification: null,
  gaps: [],
  approvals: [],
  events: [],
  selectedStepId: null,

  latencyMs: 1.2,
  syncPercentage: 100,
  busKbps: 4.8,
  sseConnected: false,

  presenterMode: false,
  showSettings: false,
  showNotifications: false,

  setActiveMissionId: (id) => set({ activeMissionId: id }),
  setMission: (m) => set({ mission: m }),
  setPlan: (p) => set({ plan: p }),
  setTests: (tests) => set({ tests }),
  setRehearsal: (r) => set({ rehearsal: r }),
  setVerification: (v) => set({ verification: v }),
  setGaps: (gaps) => set({ gaps }),
  setApprovals: (approvals) => set({ approvals }),
  setSelectedStepId: (id) => set({ selectedStepId: id }),
  setTelemetry: (latencyMs, syncPercentage, busKbps, sseConnected) =>
    set({ latencyMs, syncPercentage, busKbps, sseConnected }),
  togglePresenterMode: () => set((s) => ({ presenterMode: !s.presenterMode })),
  setShowSettings: (showSettings) => set({ showSettings }),
  setShowNotifications: (showNotifications) => set({ showNotifications }),

  addEvent: (envelope) =>
    set((state) => {
      // Deduplicate by envelope id
      if (state.events.some((e) => e.id === envelope.id)) {
        return state;
      }
      const newEvents = [envelope, ...state.events].slice(0, 5000);
      return { events: newEvents };
    }),

  reset: () =>
    set({
      activeMissionId: null,
      mission: null,
      plan: null,
      tests: [],
      rehearsal: null,
      verification: null,
      gaps: [],
      approvals: [],
      events: [],
      selectedStepId: null,
    }),
}));
