import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ProofReceiptCard from '../components/ProofReceiptCard';

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: missions } = useQuery({
    queryKey: ['missions'],
    queryFn: async () => {
      const res = await fetch('http://127.0.0.1:8000/api/v1/missions?limit=10');
      return res.json();
    },
  });

  const activeMissionId = id || missions?.items?.[0]?.id || 'msn_87240000';

  const { data: receipt, isLoading } = useQuery({
    queryKey: ['receipt', activeMissionId],
    queryFn: async () => {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/missions/${activeMissionId}/receipt`);
      if (!res.ok) throw new Error('Receipt not found');
      return res.json();
    },
    enabled: !!activeMissionId,
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="tile p-6 accent-top-prove flex items-center justify-between">
        <div>
          <span className="font-mono text-xs uppercase font-bold text-prove-text">
            Independent Verification
          </span>
          <h1 className="font-headline font-bold text-2xl text-ink tracking-tight mt-0.5">
            Mission Proof Receipt & Certificate
          </h1>
          <p className="font-body text-xs text-ink-2 mt-1">
            Official cryptographic execution receipt anchored to immutable SHA-256 hash chains.
          </p>
        </div>

        {id && (
          <button
            onClick={() => navigate(`/missions/${id}`)}
            className="p-2 rounded-xl bg-sand-light hover:bg-sand text-ink-2 transition-colors border border-border"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </button>
        )}
      </div>

      {/* Proof Receipt Printable Card */}
      <div className="py-6 flex justify-center">
        {isLoading ? (
          <div className="tile p-12 font-mono text-xs text-ink-3">
            Generating cryptographic proof receipt...
          </div>
        ) : (
          <ProofReceiptCard
            missionId={activeMissionId}
            receipt={receipt}
          />
        )}
      </div>
    </div>
  );
}
