import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import HoldToApprove from '../components/ui/HoldToApprove';
import { HashChip } from '../components/ui/HashChip';

export default function RehearsalApprovalPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const { data: rehearsal, isLoading: rLoading } = useQuery({
    queryKey: ['rehearsal', id],
    queryFn: () => api.getRehearsal(id!),
    enabled: !!id,
  });

  const { data: approvals, isLoading: aLoading } = useQuery({
    queryKey: ['approvals', id],
    queryFn: () => api.listApprovals('PENDING', id),
    enabled: !!id,
    refetchInterval: 3000,
  });

  const rehearseMutation = useMutation({
    mutationFn: () => api.rehearseMission(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rehearsal', id] }),
  });

  const decideMutation = useMutation({
    mutationFn: ({ approvalId, decision }: { approvalId: string; decision: 'approve' | 'reject' }) =>
      api.decideApproval(approvalId, decision, undefined, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals', id] });
      setSelectedApproval(null);
      setNote('');
    },
  });

  const currentApproval = approvals?.find(a => a.id === selectedApproval);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="tile p-6 accent-top-predict flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/missions/${id}`)}
            className="p-2 rounded-xl bg-sand-light hover:bg-sand text-ink-2 transition-colors border border-border"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase font-bold text-predict-text">
                Digital Twin Rehearsal
              </span>
              <span className="text-border-strong">&bull;</span>
              <span className="font-mono text-xs text-ink-2">{id}</span>
            </div>
            <h1 className="font-headline font-bold text-2xl text-ink tracking-tight mt-0.5">
              Rehearsal & Approval Gate
            </h1>
          </div>
        </div>

        <button
          onClick={() => rehearseMutation.mutate()}
          disabled={rehearseMutation.isPending}
          className="px-4 py-2 rounded-button bg-predict text-cream font-headline text-xs font-semibold shadow-sm hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">science</span>
          <span>{rehearseMutation.isPending ? 'Simulating...' : 'Run Rehearsal'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Rehearsal Report (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          {!rehearsal ? (
            <div className="tile p-12 text-center text-ink-3 font-mono text-xs">
              No rehearsal report generated yet. Click "Run Rehearsal" to evaluate side-effects.
            </div>
          ) : (
            <>
              {/* Proof of Unchanged State */}
              <div className="tile p-6 accent-top-prove">
                <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-prove">lock</span>
                    <h2 className="font-headline font-bold text-base text-ink">
                      Real State Unchanged Proof
                    </h2>
                  </div>
                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-pill bg-prove-light text-prove-text font-bold border border-prove/30">
                    {rehearsal.provenance}
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-ink-3 uppercase text-[10px] w-20">Before Hash:</span>
                    <HashChip hash={rehearsal.real_state_unchanged_proof.before_hash} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-ink-3 uppercase text-[10px] w-20">After Hash:</span>
                    <HashChip hash={rehearsal.real_state_unchanged_proof.after_hash} />
                  </div>
                  <div className="p-2.5 rounded-lg bg-prove-light/40 border border-prove/30 flex items-center gap-2 text-prove-text font-headline text-xs font-semibold">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    <span>Live filesystem & external records verified intact during simulation.</span>
                  </div>
                </div>
              </div>

              {/* Predicted Diff */}
              <div className="tile p-6 accent-top-recover">
                <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-recover">difference</span>
                    <h2 className="font-headline font-bold text-base text-ink">
                      Predicted Mutation Diff
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-sand-light rounded-xl border border-border text-center">
                    <span className="font-mono text-[10px] text-ink-3 uppercase block mb-1">Creates</span>
                    <span className="font-headline font-bold text-2xl text-prove-text">
                      {rehearsal.predicted_diff.creates.length}
                    </span>
                  </div>
                  <div className="p-3 bg-sand-light rounded-xl border border-border text-center">
                    <span className="font-mono text-[10px] text-ink-3 uppercase block mb-1">Updates</span>
                    <span className="font-headline font-bold text-2xl text-recover-text">
                      {rehearsal.predicted_diff.updates.length}
                    </span>
                  </div>
                  <div className="p-3 bg-sand-light rounded-xl border border-border text-center">
                    <span className="font-mono text-[10px] text-ink-3 uppercase block mb-1">Deletes</span>
                    <span className="font-headline font-bold text-2xl text-predict-text">
                      {rehearsal.predicted_diff.deletes.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Irreversible Operations Alert */}
              {rehearsal.irreversible_ops.length > 0 && (
                <div className="tile p-6 accent-top-predict border-predict/40">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-predict-text">gavel</span>
                    <h3 className="font-headline font-bold text-base text-predict-text">
                      Irreversible Operations Requiring Operator Gate ({rehearsal.irreversible_ops.length})
                    </h3>
                  </div>
                  <p className="font-body text-xs text-ink-2">
                    Outbound communications (e.g. <strong className="text-ink">send_email</strong>) pause automatically at the approval gate before transmission.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Approval Queue (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          <div className="tile p-6 accent-top-rewind">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rewind">approval</span>
                <h3 className="font-headline font-bold text-base text-ink">
                  Approval Queue ({approvals?.length || 0})
                </h3>
              </div>
            </div>

            {aLoading ? (
              <div className="p-4 font-mono text-xs text-ink-3">Checking approval queue...</div>
            ) : !approvals?.length ? (
              <div className="p-6 text-center text-prove-text font-mono text-xs flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>All gates clear. Zero pending approvals.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {approvals.map(a => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedApproval(a.id === selectedApproval ? null : a.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedApproval === a.id
                        ? 'bg-sand-light border-predict shadow-sm'
                        : 'bg-tile border-border hover:border-border-strong'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-headline font-bold text-sm text-ink">{a.action}</span>
                      <span className="font-mono text-[10px] uppercase font-bold text-predict-text px-2 py-0.5 rounded-pill bg-predict-light">
                        {a.risk}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-ink-2 truncate">{a.target}</div>
                    <div className="font-body text-xs text-ink-3 mt-1">{a.risk_explanation}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Decision Box with HoldToApprove */}
          {currentApproval && (
            <div className="tile p-6 border-predict">
              <h4 className="font-headline font-bold text-sm text-ink mb-3 pb-2 border-b border-border">
                Authorize Action: {currentApproval.action}
              </h4>

              <div className="space-y-3 text-xs mb-4">
                <div className="font-body text-ink-2">
                  Target: <strong className="text-ink">{currentApproval.target}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-predict-light/50 border border-predict/30 text-predict-text font-mono text-[11px]">
                  IRREVERSIBLE: Outbound external dispatch. Single-use token will be generated.
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => decideMutation.mutate({ approvalId: currentApproval.id, decision: 'reject' })}
                  className="px-4 py-3 rounded-button border border-border text-predict-text hover:bg-predict-light font-headline text-xs font-semibold"
                >
                  Reject
                </button>

                <HoldToApprove
                  onApprove={() => decideMutation.mutate({ approvalId: currentApproval.id, decision: 'approve' })}
                  label="Hold 1s to Authorize"
                  className="flex-1"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
