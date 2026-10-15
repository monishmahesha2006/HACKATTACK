import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import { Step, StepStatus } from '../api/types';
import StatusBadge from '../components/StatusBadge';
import MiniTimeline from '../components/MiniTimeline';
import BorderButton from '../components/ui/BorderButton';
import TelegramPanel from '../components/TelegramPanel';

export default function MissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [serverFilter, setServerFilter] = useState('ALL');
  const [toolSearch, setToolSearch] = useState('');
  const [pauseFeedScroll, setPauseFeedScroll] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const { data: mission, isLoading: mLoading } = useQuery({
    queryKey: ['mission', id],
    queryFn: () => api.getMission(id!),
    refetchInterval: 2000,
    enabled: !!id,
  });

  const { data: plan } = useQuery({
    queryKey: ['mission-plan', id],
    queryFn: () => api.getMissionPlan(id!),
    refetchInterval: 3000,
    enabled: !!id,
  });

  const { data: timelineData } = useQuery({
    queryKey: ['mission-timeline', id],
    queryFn: async () => {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/missions/${id}/timeline`);
      return res.json();
    },
    refetchInterval: 3000,
    enabled: !!id,
  });

  const { data: invocations, refetch: refetchInvocations } = useQuery({
    queryKey: ['tool-invocations', id],
    queryFn: async () => {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/mcp/invocations?mission_id=${id}`);
      return res.json();
    },
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
    enabled: !!id,
  });

  const runMutation = useMutation({
    mutationFn: () => api.runMission(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mission', id] });
      qc.invalidateQueries({ queryKey: ['tool-invocations', id] });
      qc.invalidateQueries({ queryKey: ['mission-timeline', id] });
      refetchInvocations();
    },
  });

  const pauseMutation = useMutation({
    mutationFn: () => api.pauseMission(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mission', id] });
      qc.invalidateQueries({ queryKey: ['tool-invocations', id] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => api.resumeMission(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mission', id] });
      qc.invalidateQueries({ queryKey: ['tool-invocations', id] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.cancelMission(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mission', id] });
      qc.invalidateQueries({ queryKey: ['tool-invocations', id] });
    },
  });

  if (mLoading) {
    return (
      <div className="p-8 font-mono text-xs text-ink-3">
        Loading mission journal and state...
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="p-8 font-mono text-xs text-predict-text">
        Mission not found.
      </div>
    );
  }

  const steps = plan?.steps || [];
  const progressPct = steps.length > 0 ? Math.round((mission.counts.done / steps.length) * 100) : 0;
  const isRunnable = ['CREATED', 'READY', 'PLANNING'].includes(mission.status);
  const isPaused = mission.status === 'PAUSED';
  const isRunning = mission.status === 'RUNNING';
  const isCompleted = ['COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'CANCELLED', 'REWOUND'].includes(mission.status);

  // Correctly extract items array from paginated response
  const rawInvocations: any[] = Array.isArray(invocations?.items)
    ? invocations.items
    : (Array.isArray(invocations) ? invocations : []);

  const filteredInvocations = rawInvocations.filter(inv => {
    const matchServer = serverFilter === 'ALL' || inv.server_id === serverFilter;
    const matchSearch = !toolSearch || inv.tool?.toLowerCase().includes(toolSearch.toLowerCase());
    return matchServer && matchSearch;
  });

  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Card */}
      <div className="tile p-6 accent-top-predict flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/missions')}
            className="p-2 rounded-xl bg-sand-light hover:bg-sand text-ink-2 transition-colors border border-border mt-1"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-ink-2">{mission.id}</span>
              <span className="text-border-strong">&bull;</span>
              <StatusBadge status={mission.status} />
              <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-pill bg-sand text-ink-2 font-bold">
                {mission.mode}
              </span>
            </div>
            <h1 className="font-headline font-bold text-xl sm:text-2xl text-ink tracking-tight">
              {mission.goal}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate(`/missions/${id}/rehearsal`)}
            className="px-3.5 py-2 rounded-button bg-tile border border-border hover:border-border-strong text-ink font-headline text-xs font-semibold shadow-sm transition-all"
          >
            Rehearsal
          </button>

          {isRunnable && (
            <BorderButton
              onClick={() => runMutation.mutate()}
              loading={runMutation.isPending}
              disabled={runMutation.isPending}
            >
              ▶ Execute
            </BorderButton>
          )}

          {isRunning && (
            <button
              onClick={() => pauseMutation.mutate()}
              className="px-4 py-2 rounded-button bg-recover text-cream font-headline text-xs font-semibold shadow-sm hover:opacity-95"
            >
              ⏸ Pause
            </button>
          )}

          {isPaused && (
            <button
              onClick={() => resumeMutation.mutate()}
              className="px-4 py-2 rounded-button bg-prove text-cream font-headline text-xs font-semibold shadow-sm hover:opacity-95"
            >
              ▶ Resume
            </button>
          )}

          {isCompleted && (
            <>
              <button
                onClick={() => navigate(`/missions/${id}/verification`)}
                className="px-3.5 py-2 rounded-button bg-prove text-cream font-headline text-xs font-semibold shadow-sm hover:opacity-95"
              >
                Verify State
              </button>
              <button
                onClick={() => navigate(`/missions/${id}/report`)}
                className="px-3.5 py-2 rounded-button bg-tile border border-border hover:border-border-strong text-ink font-headline text-xs font-semibold shadow-sm"
              >
                Proof Receipt
              </button>
              <button
                onClick={() => navigate(`/missions/${id}/rewind`)}
                className="px-3.5 py-2 rounded-button bg-rewind text-cream font-headline text-xs font-semibold shadow-sm hover:opacity-95"
              >
                ↩ Rewind
              </button>
            </>
          )}

          {!isCompleted && mission.status !== 'CANCELLED' && (
            <button
              onClick={() => { if (confirm('Cancel this mission?')) cancelMutation.mutate(); }}
              className="px-3 py-2 rounded-button border border-border text-predict-text hover:bg-predict-light font-headline text-xs font-semibold"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Mini Timeline Strip Component */}
      <MiniTimeline
        stages={timelineData?.stages || []}
        faults={timelineData?.faults || []}
        activeStage={mission.phase.toLowerCase()}
        ariaStatus={`Phase: ${mission.phase}, ${mission.counts.done}/${steps.length} steps complete`}
      />

      {/* Telegram Report Delivery — shown when mission is completed */}
      {isCompleted && (
        <div className="flex items-start gap-2 mb-1">
          <div className="flex-1">
            <TelegramPanel missionId={id} compact />
          </div>
        </div>
      )}

      {/* Step Graph & Progress Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step Flow List (2 cols) */}
        <div className="lg:col-span-2 tile p-6">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-ink-2">account_tree</span>
              <h2 className="font-headline font-bold text-base text-ink">
                Execution Steps & Invariants ({steps.length})
              </h2>
            </div>
            <span className="font-mono text-xs text-ink-3">
              Progress: <strong className="text-ink">{progressPct}%</strong>
            </span>
          </div>

          <div className="space-y-3">
            {steps.map((stp, idx) => {
              const isSelected = selectedStep?.id === stp.id;
              const isDone = stp.status === 'DONE';
              const isRunning = stp.status === 'RUNNING';
              const isAwaiting = stp.status === 'AWAITING_APPROVAL';

              return (
                <motion.div
                  key={stp.id}
                  whileHover={{ scale: 1.01, x: 2 }}
                  onClick={() => setSelectedStep(stp)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-sand-light border-predict ring-2 ring-predict/20 shadow-sm'
                      : isRunning
                      ? 'bg-sand-light border-predict animate-pulse shadow-sm'
                      : isDone
                      ? 'bg-tile border-prove/30 hover:border-border-strong'
                      : 'bg-tile border-border hover:border-border-strong'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-bold text-ink-3 w-5 shrink-0">
                      0{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-headline font-semibold text-sm text-ink truncate">
                        {stp.description}
                      </div>
                      <div className="flex items-center gap-2 mt-1 font-mono text-[10px] text-ink-3">
                        <span>{stp.server}/{stp.tool}</span>
                        <span>&bull;</span>
                        <span className={stp.risk === 'CRITICAL' ? 'text-predict-text font-bold' : 'text-ink-2'}>
                          Risk: {stp.risk}
                        </span>
                        <span>&bull;</span>
                        <span>{stp.reversibility}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={stp.status} size="sm" />
                    <span className="material-symbols-outlined text-ink-3 text-sm">
                      chevron_right
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Live Tool Calls Feed (1 col) */}
        <div 
          className="tile p-6 flex flex-col justify-between"
          onMouseEnter={() => setPauseFeedScroll(true)}
          onMouseLeave={() => setPauseFeedScroll(false)}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-prove animate-pulse" />
                <h3 className="font-headline font-bold text-sm text-ink">
                  Live MCP Tool Calls
                </h3>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sand font-bold text-ink-2">
                  {filteredInvocations.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-sand text-ink-3">
                  {pauseFeedScroll ? 'PAUSED' : 'AUTO-REFRESH 2s'}
                </span>
              </div>
            </div>

            {/* Server Filter Chips */}
            <div className="flex flex-wrap gap-1 mb-3">
              {['ALL', 'web_fixture', 'rewindx_domain', 'sheets', 'drafts'].map(srv => (
                <button
                  key={srv}
                  onClick={() => setServerFilter(srv)}
                  className={`px-2 py-0.5 rounded-pill font-mono text-[9px] uppercase border transition-colors ${
                    serverFilter === srv
                      ? 'bg-predict text-cream border-predict font-bold'
                      : 'bg-sand-light text-ink-2 border-border hover:border-border-strong'
                  }`}
                >
                  {srv === 'ALL' ? 'ALL SERVERS' : srv}
                </button>
              ))}
            </div>

            {/* Feed List */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto no-scrollbar pr-0.5">
              {filteredInvocations.length === 0 ? (
                <div className="p-6 text-center font-mono text-xs text-ink-3 border border-dashed border-border rounded-lg bg-sand-light/30">
                  <span className="material-symbols-outlined text-lg mb-1 block text-ink-3">terminal</span>
                  No tool calls logged for filter: <strong className="text-ink-2">{serverFilter}</strong>
                </div>
              ) : (
                filteredInvocations.slice(0, 20).map((inv, idx) => {
                  const isError = inv.status === 'ERROR' || inv.error_class;
                  const isFallback = inv.summary?.includes('FALLBACK') || inv.result_summary?.includes('FALLBACK');

                  const formatSummaryText = (text: string | undefined) => {
                    if (!text) return 'Completed OK';
                    if (text.startsWith('{') || text.startsWith('(')) {
                      try {
                        const sanitized = text
                          .replace(/'/g, '"')
                          .replace(/True/g, 'true')
                          .replace(/False/g, 'false')
                          .replace(/None/g, 'null');
                        const p = JSON.parse(sanitized);
                        if (p.message) return p.message;
                        if (p.summary) return p.summary;
                        if (p.rows_written) return `Wrote ${p.rows_written} rows to sheet`;
                        if (p.draft_id) return `Draft created: ${p.draft_id}`;
                        return Object.entries(p).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' · ');
                      } catch {
                        return text.slice(0, 85);
                      }
                    }
                    return text;
                  };

                  return (
                    <div 
                      key={inv.id || idx} 
                      className={`p-2.5 rounded-lg border text-xs font-mono transition-all ${
                        isError
                          ? 'bg-predict-light/40 border-predict-border'
                          : isFallback
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-sand-light/50 border-border hover:border-border-strong'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-ink-3 mb-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span 
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              isError ? 'bg-predict' : isFallback ? 'bg-amber-500' : 'bg-prove'
                            }`} 
                          />
                          <span className="font-semibold text-ink-3">{inv.server_id}</span>
                          <span className="text-border-strong">/</span>
                          <span className="font-bold text-ink truncate">{inv.tool}</span>
                          {inv.attempt && inv.attempt > 1 && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                              A{inv.attempt}
                            </span>
                          )}
                        </div>
                        <span className={`flex-shrink-0 font-mono text-[9px] ${inv.duration_ms > 150 ? 'text-predict font-bold' : 'text-ink-3'}`}>
                          {inv.duration_ms ? `${inv.duration_ms.toFixed(1)}ms` : '0ms'}
                        </span>
                      </div>
                      <div className={`text-[11px] truncate leading-tight ${
                        isError ? 'text-predict font-medium' : isFallback ? 'text-amber-900 font-medium' : 'text-ink'
                      }`}>
                        {formatSummaryText(inv.result_summary || inv.summary)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Step Side Drawer */}
      <AnimatePresence>
        {selectedStep && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-ink/20 backdrop-blur-sm p-4">
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="bg-tile border border-border-strong p-6 rounded-2xl shadow-modal max-w-md w-full h-[90vh] flex flex-col justify-between overflow-y-auto"
            >
              <div>
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                  <span className="font-headline font-bold text-base text-ink">
                    Step Inspection & Proof
                  </span>
                  <button onClick={() => setSelectedStep(null)}>
                    <span className="material-symbols-outlined text-ink-2">close</span>
                  </button>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-ink-3 text-[10px] uppercase block">ID</span>
                    <span className="font-bold text-ink">{selectedStep.id}</span>
                  </div>

                  <div>
                    <span className="text-ink-3 text-[10px] uppercase block">Description</span>
                    <p className="font-headline text-ink text-sm font-medium mt-0.5">
                      {selectedStep.description}
                    </p>
                  </div>

                  <div>
                    <span className="text-ink-3 text-[10px] uppercase block">Idempotency Key</span>
                    <div 
                      onClick={() => handleCopyHash(selectedStep.idempotency_key)}
                      className="p-2 rounded bg-sand-light border border-border truncate text-ink cursor-pointer hover:border-predict flex items-center justify-between mt-0.5"
                    >
                      <span className="truncate">{selectedStep.idempotency_key}</span>
                      <span className="material-symbols-outlined text-xs text-ink-3">
                        {copiedHash ? 'check' : 'content_copy'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                    <div>
                      <span className="text-ink-3 text-[10px] uppercase block">Risk</span>
                      <span className="font-bold text-ink">{selectedStep.risk}</span>
                    </div>
                    <div>
                      <span className="text-ink-3 text-[10px] uppercase block">Reversibility</span>
                      <span className="font-bold text-ink">{selectedStep.reversibility}</span>
                    </div>
                  </div>

                  {selectedStep.result_summary && (
                    <div className="pt-2 border-t border-border">
                      <span className="text-ink-3 text-[10px] uppercase block">Result Summary</span>
                      <p className="font-mono text-xs text-ink-2 bg-sand-light p-2 rounded mt-1 border border-border">
                        {selectedStep.result_summary}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <button
                  onClick={() => setSelectedStep(null)}
                  className="px-4 py-2 bg-tile border border-border rounded-button font-headline text-xs font-semibold text-ink"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
