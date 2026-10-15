import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import { HashChip } from '../components/ui/HashChip';

export default function AuditLedgerPage() {
  const [missionFilter, setMissionFilter] = useState('');

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audit-events', missionFilter],
    queryFn: () => api.listAuditEvents(missionFilter || undefined, 100),
    refetchInterval: 5000,
  });

  const { data: chainVerification, refetch: refetchChain, isFetching: verifying } = useQuery({
    queryKey: ['audit-chain-verify'],
    queryFn: api.verifyAuditChain,
    enabled: false,
    staleTime: 0,
  });

  const tamperTestMutation = useMutation({
    mutationFn: api.runTamperTest,
  });

  const events = auditData?.items || [];

  const typeColor: Record<string, string> = {
    'step.started': 'var(--recover)',
    'step.done': 'var(--prove)',
    'step.failed': 'var(--predict)',
    'mission.created': 'var(--ink)',
    'mission.completed': 'var(--prove)',
    'system.boot': 'var(--ink-2)',
    'approval.decided': 'var(--recover)',
    'rewind.executed': 'var(--rewind)',
  };

  const getTypeColor = (type: string) => {
    for (const [key, color] of Object.entries(typeColor)) {
      if (type.includes(key.split('.')[1])) return color;
    }
    return 'var(--ink-2)';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-[var(--tile)] border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-['Bricolage_Grotesque'] font-bold text-lg text-[var(--ink)]">
              CRYPTOGRAPHIC AUDIT LEDGER
            </h1>
            <p className="font-mono text-[10px] uppercase mt-0.5 text-[var(--ink-2)] tracking-wider">
              Hash-chained tamper-evident event log · SHA-256 sequential linkage
            </p>
          </div>
          <div className="flex items-center gap-3">
            {chainVerification && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-[10px] uppercase font-bold border"
                style={{
                  backgroundColor: chainVerification.valid ? 'var(--prove-light)' : 'var(--predict-light)',
                  color: chainVerification.valid ? 'var(--prove-text)' : 'var(--predict-text)',
                  borderColor: chainVerification.valid ? 'var(--prove-border)' : 'var(--predict-border)',
                }}
              >
                <span className="material-symbols-outlined text-xs">
                  {chainVerification.valid ? 'verified' : 'error'}
                </span>
                CHAIN {chainVerification.valid ? 'VALID' : 'TAMPERED'} ({chainVerification.checked} events)
              </div>
            )}
            <button
              onClick={() => refetchChain()}
              disabled={verifying}
              className="px-3 py-1.5 rounded-xl border border-[var(--prove)] text-[var(--prove)] hover:bg-[var(--prove-light)] font-mono text-[10px] uppercase font-bold tracking-wider transition-colors"
            >
              {verifying ? 'VERIFYING...' : 'VERIFY CHAIN'}
            </button>
            <button
              onClick={() => tamperTestMutation.mutate()}
              disabled={tamperTestMutation.isPending}
              className="px-3 py-1.5 rounded-xl border border-[var(--recover)] text-[var(--recover-text)] hover:bg-[var(--recover-light)] font-mono text-[10px] uppercase font-bold tracking-wider transition-colors"
            >
              {tamperTestMutation.isPending ? 'TESTING...' : 'TAMPER TEST'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex flex-col p-6 space-y-4">
        {/* Filter bar */}
        <div className="tile p-3 flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase text-[var(--ink-2)] tracking-wider font-bold">FILTER:</span>
          <input
            value={missionFilter}
            onChange={e => setMissionFilter(e.target.value)}
            placeholder="Mission ID (e.g. msn_abc123)"
            className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--sand-light)] font-mono text-xs text-[var(--ink)] outline-none focus:border-[var(--predict)] w-60"
          />
          <span className="font-mono text-xs ml-auto text-[var(--ink-2)] font-semibold">
            {events.length} EVENTS
          </span>
        </div>

        {/* Tamper test result */}
        {tamperTestMutation.data && (
          <div className="tile p-3 bg-[var(--sand-light)] border-[var(--border)]">
            <span className="font-mono text-xs uppercase text-[var(--predict-text)] font-semibold">
              TAMPER TEST: {JSON.stringify(tamperTestMutation.data)}
            </span>
          </div>
        )}

        {/* Audit Table */}
        <div className="tile p-0 overflow-hidden flex-1 flex flex-col">
          {/* Header row */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--sand)] font-mono text-[9px] uppercase text-[var(--ink-2)] font-bold tracking-wider">
            <div className="col-span-1 text-right">SEQ</div>
            <div className="col-span-2">TYPE</div>
            <div className="col-span-1">ACTOR</div>
            <div className="col-span-1">STATUS</div>
            <div className="col-span-3">SUMMARY</div>
            <div className="col-span-2">HASH</div>
            <div className="col-span-2 text-right">TIMESTAMP</div>
          </div>

          {isLoading && (
            <div className="px-4 py-12 text-center font-mono text-xs text-[var(--ink-2)]">
              LOADING AUDIT LOG...
            </div>
          )}

          <div className="overflow-auto divide-y divide-[var(--border)]">
            {events.map((event) => (
              <div
                key={event.id}
                className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-[var(--sand-light)] transition-colors"
              >
                <div className="col-span-1 font-mono text-[10px] text-right text-[var(--ink-2)]">
                  {event.seq}
                </div>
                <div className="col-span-2">
                  <span
                    className="font-mono text-[9px] uppercase px-2 py-0.5 rounded-lg border font-bold"
                    style={{
                      borderColor: getTypeColor(event.type),
                      color: getTypeColor(event.type),
                      backgroundColor: 'var(--tile)',
                    }}
                  >
                    {event.type}
                  </span>
                </div>
                <div className="col-span-1 font-mono text-[10px] truncate text-[var(--ink-2)]">
                  {event.actor}
                </div>
                <div className="col-span-1">
                  <span
                    className="font-mono text-[10px] uppercase font-bold"
                    style={{ color: event.status === 'OK' ? 'var(--prove)' : 'var(--predict)' }}
                  >
                    {event.status}
                  </span>
                </div>
                <div className="col-span-3 text-xs text-[var(--ink)] truncate">
                  {event.result_summary || '—'}
                </div>
                <div className="col-span-2">
                  <HashChip hash={event.hash} />
                </div>
                <div className="col-span-2 font-mono text-[10px] text-right text-[var(--ink-2)]">
                  {new Date(event.ts).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            ))}
          </div>

          {!isLoading && events.length === 0 && (
            <div className="px-4 py-16 text-center">
              <span className="material-symbols-outlined block mb-2 text-4xl text-[var(--ink-3)]">receipt_long</span>
              <p className="font-mono text-xs uppercase text-[var(--ink-2)]">AUDIT LOG EMPTY</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
