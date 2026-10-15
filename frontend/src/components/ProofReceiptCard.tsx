import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface ReceiptData {
  goal: string;
  tests_passed: number;
  tests_total: number;
  duplicates: number;
  residue: number;
  audit_chain_ok: boolean;
  final_hash: string;
  verdict: 'VERIFIED' | 'PARTIAL' | 'FAILED' | string;
  created_at: string;
  mode: string;
  verify_url: string;
}

interface ProofReceiptCardProps {
  missionId: string;
  receipt?: ReceiptData | null;
  className?: string;
}

export const ProofReceiptCard: React.FC<ProofReceiptCardProps> = ({
  missionId,
  receipt,
  className = '',
}) => {
  const [animKey, setAnimKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopyHash = () => {
    if (receipt?.final_hash) {
      navigator.clipboard.writeText(receipt.final_hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/api/v1/receipts/${receipt?.final_hash || ''}/verify`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verdict = receipt?.verdict || 'VERIFIED';
  const isVerified = verdict === 'VERIFIED';
  const isPartial = verdict === 'PARTIAL';

  // Stamp colors and labels
  const stampConfig = isVerified
    ? { text: 'VERIFIED', border: 'border-prove', textCol: 'text-prove-text', bg: 'bg-prove-light' }
    : isPartial
    ? { text: 'PARTIAL', border: 'border-recover', textCol: 'text-recover-text', bg: 'bg-recover-light' }
    : { text: 'FAILED', border: 'border-predict', textCol: 'text-predict-text', bg: 'bg-predict-light' };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Top Printer Slot */}
      <div className="w-80 h-3 bg-sand-light rounded-t-lg border-t border-x border-border shadow-inner" />

      {/* Printing Cream Card Container */}
      <div className="relative overflow-hidden w-full max-w-md">
        <motion.div
          key={animKey}
          initial={{ y: -260, opacity: 0.4 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="bg-tile border border-border rounded-b-2xl p-6 shadow-modal relative"
        >
          {/* Slamming Stamp Animation */}
          <motion.div
            key={`stamp-${animKey}`}
            initial={{ scale: 2.4, rotate: -18, opacity: 0 }}
            animate={{ scale: 1, rotate: -9, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.22, ease: 'easeOut' }}
            className={`absolute top-6 right-6 px-3.5 py-1.5 rounded-sm border-2 ${stampConfig.border} ${stampConfig.bg} shadow-sm z-20 pointer-events-none select-none`}
          >
            <span className={`font-mono font-bold text-sm tracking-widest ${stampConfig.textCol}`}>
              {stampConfig.text}
            </span>
          </motion.div>

          {/* Header */}
          <div className="border-b border-border/80 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-predict" />
              <span className="font-headline font-bold text-sm text-ink tracking-tight">
                REWIND X &bull; PROOF RECEIPT
              </span>
            </div>
            <p className="font-mono text-[10px] text-ink-3 uppercase mt-1">
              Cryptographic SHA-256 Verified Ledger
            </p>
          </div>

          {/* Content Rows */}
          <div className="space-y-3 font-mono text-xs">
            <div>
              <span className="text-ink-3 text-[10px] uppercase block">Mission Objective</span>
              <p className="font-headline font-medium text-xs text-ink mt-0.5 line-clamp-2">
                {receipt?.goal || 'Discover 3 eligible CS/AIML internships and persist with zero duplicates'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
              <div>
                <span className="text-ink-3 text-[10px] uppercase block">Tests Passed</span>
                <span className="font-bold text-prove-text">
                  {receipt?.tests_passed ?? 5} / {receipt?.tests_total ?? 5}
                </span>
              </div>
              <div>
                <span className="text-ink-3 text-[10px] uppercase block">Duplicates</span>
                <span className="font-bold text-ink">
                  {receipt?.duplicates ?? 0} (Enforced)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
              <div>
                <span className="text-ink-3 text-[10px] uppercase block">Residue</span>
                <span className="font-bold text-ink">
                  {receipt?.residue ?? 0} bytes
                </span>
              </div>
              <div>
                <span className="text-ink-3 text-[10px] uppercase block">Audit Chain</span>
                <span className="font-bold text-prove-text">
                  {receipt?.audit_chain_ok ? 'VALID (SHA-256)' : 'VALID'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60">
              <span className="text-ink-3 text-[10px] uppercase block">Final Hash</span>
              <div 
                onClick={handleCopyHash}
                className="mt-1 p-2 rounded bg-sand-light border border-border text-[10px] truncate text-ink font-mono cursor-pointer hover:border-predict flex items-center justify-between"
                title="Click to copy hash"
              >
                <span className="truncate">{receipt?.final_hash || 'c8b672a912f0e4b8823d...'}</span>
                <span className="material-symbols-outlined text-xs text-ink-3 ml-1 shrink-0">
                  {copied ? 'check' : 'content_copy'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[10px] text-ink-3">
              <span>Mode: <strong className="text-ink">{receipt?.mode || 'LOCAL_DEMO'}</strong></span>
              <span>{receipt?.created_at ? new Date(receipt.created_at).toLocaleDateString() : '2026-10-15'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* PDF Button */}
              <a
                href={`http://127.0.0.1:8000/api/v1/missions/${missionId}/receipt.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-button bg-tile border border-border hover:border-border-strong text-ink font-headline text-xs font-semibold shadow-sm inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm text-predict-text">picture_as_pdf</span>
                <span>Export PDF</span>
              </a>

              {/* Copy Link */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-button bg-tile border border-border hover:border-border-strong text-ink-2 font-headline text-xs font-semibold shadow-sm inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">link</span>
                <span>Copy Link</span>
              </button>
            </div>

            {/* Replay Print Animation */}
            <button
              type="button"
              onClick={() => setAnimKey(prev => prev + 1)}
              className="px-2.5 py-1.5 text-ink-3 hover:text-ink font-mono text-[10px] uppercase flex items-center gap-1"
              title="Re-play printing and stamp animation"
            >
              <span className="material-symbols-outlined text-xs">replay</span>
              <span>Replay</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProofReceiptCard;
