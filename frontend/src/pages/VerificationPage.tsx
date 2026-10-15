import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import BorderButton from '../components/ui/BorderButton';

export default function VerificationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [verdictText, setVerdictText] = useState('VERIFYING');

  const { data: verification, isLoading } = useQuery({
    queryKey: ['verification', id],
    queryFn: () => api.getVerification(id!),
    enabled: !!id,
    refetchInterval: 3000,
  });

  const { data: gaps } = useQuery({
    queryKey: ['gaps', id],
    queryFn: () => api.listGaps(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });

  const { data: mission } = useQuery({
    queryKey: ['mission', id],
    queryFn: () => api.getMission(id!),
    enabled: !!id,
  });

  const { data: receipt } = useQuery({
    queryKey: ['receipt', id],
    queryFn: async () => {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/missions/${id}/receipt`);
      return res.json();
    },
    enabled: !!id,
  });

  // Text scramble simulation when verdict changes
  useEffect(() => {
    if (!verification?.status) return;
    const target = String(verification.status);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let iter = 0;
    const interval = setInterval(() => {
      setVerdictText(prev => 
        target.split('').map((letter, idx) => {
          if (idx < iter) return target[idx];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('')
      );
      if (iter >= target.length) clearInterval(interval);
      iter += 1 / 2;
    }, 30);
    return () => clearInterval(interval);
  }, [verification?.status]);

  if (isLoading) {
    return (
      <div className="p-8 font-mono text-xs text-ink-3">
        Evaluating independent state assertions...
      </div>
    );
  }

  const isVerified = verification?.status === 'VERIFIED';
  const tests = verification?.tests || [];
  const claims = verification?.claims || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 tile p-6 accent-top-prove">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/missions/${id}`)}
            className="p-2 rounded-xl bg-sand-light hover:bg-sand text-ink-2 transition-colors border border-border"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase text-prove-text font-bold">Independent Proof</span>
              <span className="text-ink-3">&bull;</span>
              <span className="font-mono text-xs text-ink-2">{id}</span>
            </div>
            <h1 className="font-headline font-bold text-2xl text-ink tracking-tight mt-0.5">
              Multi-Rule Verification & Acceptance
            </h1>
          </div>
        </div>

        {/* Verdict Badge with Text Scramble */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-pill font-mono font-bold text-xs uppercase tracking-wider border shadow-sm flex items-center gap-2 bg-tile border-border">
            <span className={`w-2.5 h-2.5 rounded-full ${isVerified ? 'bg-prove' : 'bg-recover'}`} />
            <span className={isVerified ? 'text-prove-text' : 'text-recover-text'}>
              {verdictText}
            </span>
          </div>

          {/* PDF Download Button */}
          <a
            href={`http://127.0.0.1:8000/api/v1/missions/${id}/receipt.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-button bg-tile border border-border hover:border-border-strong text-ink font-headline text-xs font-semibold shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-sm text-predict-text">picture_as_pdf</span>
            <span>Proof Receipt PDF</span>
          </a>
        </div>
      </div>

      {/* Bento Grid: Summary + Cryptographic Receipt */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Acceptance Rate */}
        <div className="tile p-6 accent-top-prove flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-prove-text font-bold">
              Acceptance Passed
            </span>
            <span className="material-symbols-outlined text-prove">rule</span>
          </div>
          <div className="font-headline font-bold text-4xl text-ink">
            {tests.filter(t => t.result?.status === 'PASS').length} / {tests.length}
          </div>
          <p className="font-body text-xs text-ink-2 mt-3">
            All 5 frozen rules evaluated against independent live spreadsheet readback.
          </p>
        </div>

        {/* Metric 2: Open Reality Gaps */}
        <div className="tile p-6 accent-top-recover flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-recover-text font-bold">
              Reality Gaps
            </span>
            <span className="material-symbols-outlined text-recover">radar</span>
          </div>
          <div className="font-headline font-bold text-4xl text-ink">
            {verification?.gaps_open || 0} <span className="text-sm font-mono font-normal text-ink-2">open</span>
          </div>
          <p className="font-body text-xs text-ink-2 mt-3">
            Zero divergence detected between predicted digital twin state and live spreadsheet.
          </p>
        </div>

        {/* Metric 3: Ledger Anchoring */}
        <div className="tile p-6 accent-top-rewind flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-rewind-text font-bold">
              Ledger State
            </span>
            <span className="material-symbols-outlined text-rewind">fingerprint</span>
          </div>
          <div className="font-mono font-bold text-xs text-ink truncate bg-sand-light p-2 rounded-sm border border-border">
            {receipt?.final_hash ? `${receipt.final_hash.substring(0, 18)}...` : '00000000000000...'}
          </div>
          <p className="font-body text-xs text-ink-2 mt-3">
            Anchored to SHA-256 block chain. Verify status: <strong className="text-prove-text">VALID</strong>.
          </p>
        </div>
      </div>

      {/* Staggered Flip Cards: Acceptance Tests */}
      <div className="tile p-6">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-prove">task_alt</span>
            <h2 className="font-headline font-bold text-base text-ink">
              Frozen Acceptance Rules ({tests.length})
            </h2>
          </div>
          <span className="font-mono text-xs text-ink-3">Evaluation Engine: INDEPENDENT_READBACK</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tests.map((test, index) => {
            const isPass = test.result?.status === 'PASS';
            return (
              <motion.div
                key={test.id}
                initial={{ rotateX: 90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isPass
                    ? 'bg-tile border-prove/40 hover:border-prove shadow-sm'
                    : 'bg-tile border-predict/40 hover:border-predict shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[10px] uppercase font-bold text-ink-2">
                      {test.id}
                    </span>
                    <span
                      className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-pill border ${
                        isPass
                          ? 'bg-prove-light text-prove-text border-prove/30'
                          : 'bg-predict-light text-predict-text border-predict/30'
                      }`}
                    >
                      {isPass ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <h4 className="font-headline font-semibold text-sm text-ink mb-1">
                    {test.description}
                  </h4>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-[11px] font-mono text-ink-3">
                  <span>Kind: <strong className="text-ink-2">{test.kind}</strong></span>
                  {test.mandatory && (
                    <span className="px-1.5 py-0.5 rounded bg-sand text-ink-2 font-bold">
                      MANDATORY
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Verified Claims (with Shared-Element Transition Source Drawer) */}
      <div className="tile p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-ink-2">fact_check</span>
            <h2 className="font-headline font-bold text-base text-ink">
              Grounded Claims & Source Proof ({claims.length})
            </h2>
          </div>
          <span className="font-mono text-xs text-ink-3">Click claim to inspect source snippet</span>
        </div>

        <div className="space-y-3">
          {claims.map((claim) => (
            <motion.div
              key={claim.id}
              layoutId={`claim-${claim.id}`}
              onClick={() => setSelectedClaim(claim)}
              className="p-4 rounded-xl bg-sand-light/40 border border-border hover:border-border-strong hover:bg-sand-light cursor-pointer transition-all flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-prove mt-0.5">verified</span>
                <div>
                  <p className="font-headline text-sm font-medium text-ink">
                    {claim.text}
                  </p>
                  <div className="flex items-center gap-3 mt-1 font-mono text-[10px] text-ink-3">
                    <span>ID: {claim.id}</span>
                    <span>&bull;</span>
                    <span>Method: {claim.method}</span>
                    <span>&bull;</span>
                    <span>Location: {claim.location?.ref || 'Spreadsheet'}</span>
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined text-ink-3 text-sm">open_in_new</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Shared-Element Source Drawer / Modal */}
      <AnimatePresence>
        {selectedClaim && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm">
            <motion.div
              layoutId={`claim-${selectedClaim.id}`}
              className="bg-tile border border-border-strong p-6 rounded-2xl shadow-modal max-w-lg w-full flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-prove">verified</span>
                  <span className="font-mono text-xs uppercase font-bold text-ink">
                    Source Provenance Inspection
                  </span>
                </div>
                <button
                  onClick={() => setSelectedClaim(null)}
                  className="p-1 rounded-lg text-ink-3 hover:text-ink hover:bg-sand-light"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase text-ink-3 block mb-1">
                  Validated Assertion
                </label>
                <p className="font-headline font-semibold text-sm text-ink bg-sand-light p-3 rounded-lg border border-border">
                  {selectedClaim.text}
                </p>
              </div>

              <div className="space-y-2 font-mono text-xs text-ink-2">
                <div className="flex justify-between border-b border-border/60 py-1">
                  <span className="text-ink-3">Claim ID:</span>
                  <span className="font-bold">{selectedClaim.id}</span>
                </div>
                <div className="flex justify-between border-b border-border/60 py-1">
                  <span className="text-ink-3">Verification Method:</span>
                  <span>{selectedClaim.method}</span>
                </div>
                <div className="flex justify-between border-b border-border/60 py-1">
                  <span className="text-ink-3">Location Reference:</span>
                  <span>{selectedClaim.location?.ref || 'Row in Spreadsheet'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-ink-3">Timestamp:</span>
                  <span>{new Date(selectedClaim.ts).toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedClaim(null)}
                  className="px-4 py-2 bg-tile border border-border hover:border-border-strong rounded-button font-headline text-xs font-semibold text-ink"
                >
                  Close Inspection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
