import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export default function RealityGapPage() {
  const qc = useQueryClient();
  const [missionId, setMissionId] = useState('');

  const { data: missions } = useQuery({
    queryKey: ['missions'],
    queryFn: () => api.listMissions(50),
  });

  const activeMissions = missions?.items?.filter(m =>
    ['RUNNING', 'COMPLETED', 'PAUSED', 'RECOVERING', 'PARTIALLY_COMPLETED', 'FAILED'].includes(m.status)
  ) || [];

  const selectedMission = missionId || activeMissions[0]?.id;

  const { data: gaps, isLoading } = useQuery({
    queryKey: ['gaps', selectedMission],
    queryFn: () => api.listGaps(selectedMission),
    enabled: !!selectedMission,
    refetchInterval: 5000,
  });

  const repairMutation = useMutation({
    mutationFn: (gapId: string) => api.repairGap(selectedMission!, gapId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gaps', selectedMission] }),
  });

  const severityConfig: Record<string, { bg: string; text: string; border: string }> = {
    INFO: { bg: 'var(--sand-light)', text: 'var(--ink)', border: 'var(--border)' },
    WARN: { bg: 'var(--recover-light)', text: 'var(--recover-text)', border: 'var(--recover-border)' },
    ERROR: { bg: 'var(--predict-light)', text: 'var(--predict-text)', border: 'var(--predict-border)' },
    CRITICAL: { bg: 'var(--predict-light)', text: 'var(--predict-text)', border: 'var(--predict)' },
  };

  const statusConfig: Record<string, { color: string; label: string }> = {
    OPEN: { color: 'var(--predict-text)', label: 'OPEN' },
    REPAIRING: { color: 'var(--recover-text)', label: 'REPAIRING' },
    RESOLVED: { color: 'var(--prove-text)', label: 'RESOLVED' },
    ACCEPTED: { color: 'var(--ink-2)', label: 'ACCEPTED' },
  };

  const openGaps = gaps?.filter(g => g.status === 'OPEN') || [];
  const resolvedGaps = gaps?.filter(g => g.status === 'RESOLVED') || [];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-[var(--tile)] border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-['Bricolage_Grotesque'] font-bold text-lg text-[var(--ink)]">REALITY GAP MONITOR</h1>
            <p className="font-mono text-[10px] uppercase mt-0.5 text-[var(--ink-2)] tracking-wider">
              Expected vs observed state divergence · autonomous repair
            </p>
          </div>
          {/* Mission Selector */}
          <select
            value={selectedMission || ''}
            onChange={e => setMissionId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--sand-light)] font-mono text-[11px] text-[var(--ink)] outline-none focus:border-[var(--predict)]"
          >
            {activeMissions.map(m => (
              <option key={m.id} value={m.id}>
                {m.id.replace('msn_', '').substring(0, 8)} — {m.goal.substring(0, 40)}
              </option>
            ))}
            {activeMissions.length === 0 && <option value="">No missions available</option>}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'TOTAL GAPS', val: gaps?.length || 0, color: 'var(--ink-2)' },
            { label: 'OPEN', val: openGaps.length, color: 'var(--predict)' },
            { label: 'REPAIRING', val: gaps?.filter(g => g.status === 'REPAIRING').length || 0, color: 'var(--recover)' },
            { label: 'RESOLVED', val: resolvedGaps.length, color: 'var(--prove)' },
          ].map(stat => (
            <div key={stat.label} className="tile p-4">
              <div className="font-mono text-[10px] uppercase mb-1 text-[var(--ink-2)] tracking-wider">{stat.label}</div>
              <div className="font-['Bricolage_Grotesque'] font-bold text-3xl" style={{ color: stat.color }}>{stat.val}</div>
            </div>
          ))}
        </div>

        {!selectedMission ? (
          <div className="tile p-12 text-center">
            <span className="material-symbols-outlined block mb-2 text-4xl text-[var(--ink-3)]">radar</span>
            <p className="font-mono text-xs uppercase text-[var(--ink-2)]">SELECT A MISSION TO MONITOR GAPS</p>
          </div>
        ) : isLoading ? (
          <div className="tile p-8 text-center">
            <span className="font-mono text-xs text-[var(--ink-2)]">SCANNING FOR REALITY GAPS...</span>
          </div>
        ) : !gaps?.length ? (
          <div className="tile p-12 text-center border-[var(--prove-border)] bg-[var(--prove-light)]/20">
            <span className="material-symbols-outlined block mb-2 text-4xl text-[var(--prove)]">verified</span>
            <p className="font-['Bricolage_Grotesque'] font-bold text-lg text-[var(--prove-text)]">REALITY VERIFIED — NO GAPS DETECTED</p>
            <p className="font-mono text-xs mt-1 uppercase text-[var(--ink-2)]">Observed state matches expected state across all monitored dimensions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {gaps.map(gap => {
              const sev = severityConfig[gap.severity] || severityConfig.INFO;
              const status = statusConfig[gap.status] || { color: 'var(--ink)', label: gap.status };
              return (
                <div
                  key={gap.id}
                  className="tile p-0 overflow-hidden"
                  style={{ borderColor: sev.border }}
                >
                  <div
                    className="px-4 py-3 border-b flex items-center gap-3"
                    style={{ borderColor: 'var(--border)', backgroundColor: sev.bg }}
                  >
                    <div>
                      <span
                        className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-lg border font-bold"
                        style={{ backgroundColor: 'var(--tile)', color: sev.text, borderColor: sev.border }}
                      >
                        {gap.severity}
                      </span>
                    </div>
                    <span className="font-mono text-xs uppercase text-[var(--ink-2)] font-semibold">{gap.kind}</span>
                    <div className="ml-auto flex items-center gap-3">
                      <span className="font-mono text-xs uppercase font-bold" style={{ color: status.color }}>
                        {status.label}
                      </span>
                      {gap.status === 'OPEN' && !gap.needs_human && (
                        <button
                          onClick={() => repairMutation.mutate(gap.id)}
                          disabled={repairMutation.isPending}
                          className="px-3 py-1 rounded-xl font-mono text-xs uppercase text-[var(--cream-text)] bg-[var(--predict)] hover:opacity-90 transition-opacity font-bold"
                        >
                          AUTO REPAIR
                        </button>
                      )}
                      {gap.needs_human && (
                        <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-[var(--recover-light)] text-[var(--recover-text)] border border-[var(--recover-border)] font-bold">
                          HUMAN REQUIRED
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="font-mono text-[10px] uppercase mb-1 text-[var(--ink-2)]">EXPECTED</div>
                      <div className="font-mono text-xs p-2.5 rounded-xl bg-[var(--sand-light)] text-[var(--ink)] border border-[var(--border)] break-all">
                        {JSON.stringify(gap.expected)}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase mb-1 text-[var(--ink-2)]">OBSERVED</div>
                      <div className="font-mono text-xs p-2.5 rounded-xl bg-[var(--predict-light)] text-[var(--predict-text)] border border-[var(--predict-border)] break-all">
                        {JSON.stringify(gap.observed)}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase mb-1 text-[var(--ink-2)]">SAFE NEXT ACTION</div>
                      <div className="text-sm font-medium text-[var(--ink)]">{gap.safe_next_action}</div>
                      {gap.likely_cause && (
                        <div className="text-xs mt-1 text-[var(--ink-2)]">
                          Cause: {gap.likely_cause}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--sand-light)]">
                    <div className="font-mono text-[10px] text-[var(--ink-2)]">
                      ID: {gap.id} · Detected: {new Date(gap.detected_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
