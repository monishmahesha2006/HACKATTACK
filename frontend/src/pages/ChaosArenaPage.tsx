import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export default function ChaosArenaPage() {
  const qc = useQueryClient();
  const [selectedFaultId, setSelectedFaultId] = useState<string>('all');
  const [injectServer, setInjectServer] = useState('');
  const [injectFault, setInjectFault] = useState('');

  const { data: scenarios } = useQuery({
    queryKey: ['chaos-scenarios'],
    queryFn: api.getChaosScenarios,
  });

  const { data: runs, isLoading: rLoading } = useQuery({
    queryKey: ['chaos-runs'],
    queryFn: api.getChaosRuns,
    refetchInterval: 3000,
  });

  const runMutation = useMutation({
    mutationFn: () => api.runChaos(selectedFaultId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chaos-runs'] }),
  });

  const injectMutation = useMutation({
    mutationFn: () => api.injectFault(injectServer, injectFault),
    onSuccess: () => { setInjectServer(''); setInjectFault(''); },
  });

  const clearMutation = useMutation({
    mutationFn: () => api.clearFaults(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chaos-runs'] }),
  });

  const runStatusColor: Record<string, string> = {
    RUNNING: 'var(--recover)',
    PASS: 'var(--prove)',
    FAIL: 'var(--predict)',
  };

  const verificationColor: Record<string, string> = {
    VERIFIED: 'var(--prove)',
    FAILED: 'var(--predict)',
    PARTIALLY_VERIFIED: 'var(--recover)',
    UNVERIFIED: 'var(--ink-2)',
    BLOCKED: 'var(--predict)',
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-[var(--tile)] border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-['Bricolage_Grotesque'] font-bold text-lg text-[var(--ink)]">CHAOS ARENA</h1>
            <p className="font-mono text-[10px] uppercase mt-0.5 text-[var(--ink-2)] tracking-wider">
              Fault injection · resilience testing · recovery verification
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending}
              className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--tile)] text-[var(--ink)] hover:bg-[var(--sand-light)] font-mono text-[10px] uppercase font-bold tracking-wider transition-colors"
            >
              CLEAR FAULTS
            </button>
            <button
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending}
              className="px-4 py-1.5 rounded-xl text-[var(--cream-text)] bg-[var(--predict)] hover:opacity-90 font-mono text-[10px] uppercase font-bold tracking-wider border border-[var(--predict-border)] shadow-[var(--shadow-tile)] transition-all"
            >
              {runMutation.isPending ? 'INJECTING...' : '⚡ RUN CHAOS'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 content-start">
        {/* Fault Scenarios */}
        <div className="col-span-1 space-y-4">
          <div className="tile p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--sand)]">
              <span className="font-mono text-[10px] uppercase text-[var(--ink)] font-bold tracking-wider">FAULT SCENARIOS</span>
            </div>
            {/* All option */}
            <div
              onClick={() => setSelectedFaultId('all')}
              className="px-4 py-3 border-b border-[var(--border)] cursor-pointer transition-colors"
              style={{ backgroundColor: selectedFaultId === 'all' ? 'var(--sand-light)' : 'transparent' }}
            >
              <div className="font-semibold text-sm text-[var(--ink)]">All Scenarios</div>
              <div className="text-xs text-[var(--ink-2)]">Run all fault injection scenarios</div>
            </div>
            {scenarios?.map(scenario => (
              <div
                key={scenario.id}
                onClick={() => setSelectedFaultId(scenario.id)}
                className="px-4 py-3 border-b border-[var(--border)] last:border-0 cursor-pointer transition-colors hover:bg-[var(--sand-light)]"
                style={{ backgroundColor: selectedFaultId === scenario.id ? 'var(--sand-light)' : 'transparent' }}
              >
                <div className="font-semibold text-sm text-[var(--ink)]">{scenario.name}</div>
                <div className="text-xs mt-0.5 text-[var(--ink-2)]">{scenario.description}</div>
                <div className="text-xs mt-1 text-[var(--prove-text)] font-semibold">
                  ✓ {scenario.expected_behavior}
                </div>
              </div>
            ))}
          </div>

          {/* Manual Inject */}
          <div className="tile p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--sand)]">
              <span className="font-mono text-[10px] uppercase text-[var(--ink)] font-bold tracking-wider">MANUAL INJECT</span>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="font-mono text-[9px] uppercase block mb-1 text-[var(--ink-2)] font-bold">SERVER</label>
                <input
                  value={injectServer}
                  onChange={e => setInjectServer(e.target.value)}
                  placeholder="e.g. sheets"
                  className="w-full px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--sand-light)] text-xs font-mono text-[var(--ink)] outline-none focus:border-[var(--predict)]"
                />
              </div>
              <div>
                <label className="font-mono text-[9px] uppercase block mb-1 text-[var(--ink-2)] font-bold">FAULT TYPE</label>
                <input
                  value={injectFault}
                  onChange={e => setInjectFault(e.target.value)}
                  placeholder="e.g. NETWORK_ERROR"
                  className="w-full px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--sand-light)] text-xs font-mono text-[var(--ink)] outline-none focus:border-[var(--predict)]"
                />
              </div>
              <button
                onClick={() => injectMutation.mutate()}
                disabled={!injectServer || !injectFault || injectMutation.isPending}
                className="w-full py-2 rounded-xl text-[var(--cream-text)] bg-[var(--recover)] hover:opacity-90 font-mono text-[10px] uppercase font-bold tracking-wider border border-[var(--recover-border)] disabled:opacity-50 transition-opacity"
              >
                INJECT FAULT
              </button>
            </div>
          </div>
        </div>

        {/* Run History */}
        <div className="col-span-1 lg:col-span-2">
          <div className="tile p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--sand)] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-[var(--ink-2)]">science</span>
              <span className="font-mono text-[10px] uppercase text-[var(--ink)] font-bold tracking-wider">
                CHAOS RUN HISTORY ({runs?.length || 0})
              </span>
            </div>
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-[var(--border)] font-mono text-[9px] uppercase bg-[var(--sand-light)] text-[var(--ink-2)] tracking-wider">
              <div className="col-span-2">FAULT</div>
              <div className="col-span-2">TARGET</div>
              <div className="col-span-1">STATUS</div>
              <div className="col-span-3">RECOVERY</div>
              <div className="col-span-1 text-right">TRIES</div>
              <div className="col-span-1">VERIFY</div>
              <div className="col-span-1 text-right">DUR.</div>
              <div className="col-span-1 text-right">TIME</div>
            </div>
            {rLoading && (
              <div className="p-8 text-center font-mono text-xs text-[var(--ink-2)]">LOADING RUNS...</div>
            )}
            {!rLoading && !runs?.length && (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined block mb-2 text-4xl text-[var(--ink-3)]">bolt</span>
                <p className="font-mono text-xs uppercase text-[var(--ink-2)]">NO CHAOS RUNS YET</p>
              </div>
            )}
            <div className="max-h-[500px] overflow-auto divide-y divide-[var(--border)]">
              {runs?.map(run => (
                <div key={run.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-[var(--sand-light)] transition-colors">
                  <div className="col-span-2 font-mono text-[10px] text-[var(--ink)] font-bold truncate">{run.fault_id}</div>
                  <div className="col-span-2 font-mono text-[10px] text-[var(--ink-2)] truncate">{run.target}</div>
                  <div className="col-span-1">
                    <span className="font-mono text-[9px] uppercase font-bold" style={{ color: runStatusColor[run.status] }}>
                      {run.status}
                    </span>
                  </div>
                  <div className="col-span-3 text-xs text-[var(--ink-2)] truncate">
                    {run.recovery_strategy}
                  </div>
                  <div className="col-span-1 font-mono text-[10px] text-right font-semibold" style={{ color: run.attempts > 1 ? 'var(--recover-text)' : 'var(--ink-2)' }}>
                    {run.attempts}
                  </div>
                  <div className="col-span-1">
                    <span className="font-mono text-[9px] uppercase font-bold" style={{ color: verificationColor[run.final_verification] || 'var(--ink-2)' }}>
                      {run.final_verification?.substring(0, 6)}
                    </span>
                  </div>
                  <div className="col-span-1 font-mono text-[10px] text-right text-[var(--ink-2)]">
                    {run.duration_ms ? `${run.duration_ms}ms` : '—'}
                  </div>
                  <div className="col-span-1 font-mono text-[10px] text-right text-[var(--ink-2)]">
                    {new Date(run.ran_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
