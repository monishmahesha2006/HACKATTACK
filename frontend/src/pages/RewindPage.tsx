import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../api/client';
import BorderButton from '../components/ui/BorderButton';
import { HashChip } from '../components/ui/HashChip';

export default function RewindPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [scrubberIndex, setScrubberIndex] = useState(0);
  const [preview, setPreview] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  const { data: mission } = useQuery({
    queryKey: ['mission', id],
    queryFn: () => api.getMission(id!),
    enabled: !!id,
  });

  const { data: plan } = useQuery({
    queryKey: ['mission-plan', id],
    queryFn: () => api.getMissionPlan(id!),
    enabled: !!id,
  });

  const previewMutation = useMutation({
    mutationFn: (targetStepId?: string) => api.previewRewind(id!, targetStepId),
    onSuccess: (data) => setPreview(data),
  });

  const executeMutation = useMutation({
    mutationFn: () => api.executeRewind(id!, preview?.preview_hash || 'preview_hash_default'),
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ['mission', id] });
    },
  });

  const steps = plan?.steps || [];

  const handleScrubberChange = (val: number) => {
    setScrubberIndex(val);
    const targetStep = steps[val];
    if (targetStep) {
      previewMutation.mutate(targetStep.id);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="tile p-6 accent-top-rewind flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/missions/${id}`)}
            className="p-2 rounded-xl bg-sand-light hover:bg-sand text-ink-2 transition-colors border border-border"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase font-bold text-rewind-text">
                Inverse State Machine
              </span>
              <span className="text-border-strong">&bull;</span>
              <span className="font-mono text-xs text-ink-2">{id}</span>
            </div>
            <h1 className="font-headline font-bold text-2xl text-ink tracking-tight mt-0.5">
              Autonomous State Rewind & Compensation
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {preview && (
            <BorderButton
              onClick={() => executeMutation.mutate()}
              loading={executeMutation.isPending}
              disabled={executeMutation.isPending}
              variant="plum"
            >
              Execute Rewind
            </BorderButton>
          )}
        </div>
      </div>

      {/* Scrubber Tile */}
      <div className="tile p-6 accent-top-rewind">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rewind">history</span>
            <h2 className="font-headline font-bold text-base text-ink">
              Timeline Scrubber (Reverse Dependency Walk)
            </h2>
          </div>
          <span className="font-mono text-xs text-ink-3">
            Target Step: <strong className="text-ink">{steps[scrubberIndex]?.id || 'Initial State'}</strong>
          </span>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min={0}
          max={Math.max(0, steps.length - 1)}
          value={scrubberIndex}
          onChange={(e) => handleScrubberChange(parseInt(e.target.value))}
          className="w-full accent-rewind cursor-pointer h-2 bg-sand rounded-pill"
        />

        <div className="flex justify-between text-[10px] font-mono text-ink-3 mt-2">
          <span>T=0 Genesis</span>
          <span>Reverse Compensation &rarr;</span>
          <span>T=Latest ({steps.length} Steps)</span>
        </div>
      </div>

      {/* World Restored Confirmation Card */}
      {result && (
        <div className="tile p-6 accent-top-prove border-prove">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-prove">verified</span>
            <h3 className="font-headline font-bold text-lg text-prove-text">
              World Restored &bull; Residue Confirmed 0 Bytes
            </h3>
          </div>
          <p className="font-body text-xs text-ink-2">
            All reversible sheet modifications and draft files were cleanly purged and compensated.
          </p>
        </div>
      )}

      {/* Non-Reversible Residual Effects (Ochre Card) */}
      <div className="tile p-6 accent-top-recover">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-recover">report_problem</span>
          <h3 className="font-headline font-bold text-base text-recover-text">
            Non-Reversible Effects & External Boundaries
          </h3>
        </div>
        <p className="font-body text-xs text-ink-2">
          Outbound recruiter emails sent with valid cryptographic tokens cannot be physically retracted from external mail relays.
          They are quarantined and flagged in the audit trail.
        </p>
      </div>

      {/* Step Compensation Plan */}
      <div className="tile p-6">
        <h3 className="font-headline font-bold text-base text-ink mb-4 pb-2 border-b border-border">
          Step Compensation Matrix
        </h3>
        <div className="space-y-3 font-mono text-xs">
          {steps.map((stp, idx) => {
            const willRewind = idx >= scrubberIndex;
            return (
              <div
                key={stp.id}
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  willRewind
                    ? 'bg-rewind-light/40 border-rewind/40 text-ink'
                    : 'bg-sand-light/40 border-border text-ink-3'
                }`}
              >
                <div>
                  <span className="font-bold">{stp.id}</span> &bull; {stp.description}
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-pill border ${
                  willRewind
                    ? 'bg-rewind text-cream border-rewind'
                    : 'bg-sand text-ink-2 border-border'
                }`}>
                  {willRewind ? 'COMPENSATING' : 'RETAINED'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
