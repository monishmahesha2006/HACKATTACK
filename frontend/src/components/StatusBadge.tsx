import React from 'react';

export type StatusType =
  | 'CREATED'
  | 'PLANNING'
  | 'AWAITING_APPROVAL'
  | 'REHEARSING'
  | 'READY'
  | 'RUNNING'
  | 'PAUSED'
  | 'RECOVERING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REWINDING'
  | 'REWOUND'
  | 'PENDING'
  | 'DONE'
  | 'SKIPPED'
  | 'COMPENSATED'
  | 'FALLBACK'
  | 'VERIFIED'
  | 'INFERRED'
  | 'UNVERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'BLOCKED'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'INFO'
  | 'WARN'
  | 'ERROR'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  className = '',
}) => {
  const norm = String(status || '').toUpperCase();

  let bg = 'bg-sand-light';
  let text = 'text-ink-2';
  let border = 'border-border';
  let pip = 'bg-ink-3';

  // 1. Success / Verified / Approved (Olive)
  if (['COMPLETED', 'DONE', 'VERIFIED', 'APPROVED', 'PASS', 'NOMINAL'].includes(norm)) {
    bg = 'bg-prove-light';
    text = 'text-prove-text';
    border = 'border-prove/40';
    pip = 'bg-prove';
  }
  // 2. Active / Running / Planning / In-progress (Plum)
  else if (['RUNNING', 'REHEARSING', 'PLANNING', 'VERIFYING', 'REWINDING'].includes(norm)) {
    bg = 'bg-rewind-light';
    text = 'text-rewind-text';
    border = 'border-rewind/40';
    pip = 'bg-rewind';
  }
  // 3. Warning / Attention / Fallback / Partial (Ochre)
  else if (['AWAITING_APPROVAL', 'PARTIALLY_COMPLETED', 'PARTIALLY_VERIFIED', 'FALLBACK', 'RECOVERING', 'WARN', 'MEDIUM'].includes(norm)) {
    bg = 'bg-recover-light';
    text = 'text-recover-text';
    border = 'border-recover/40';
    pip = 'bg-recover';
  }
  // 4. Critical / Fault / Error / Blocked / Failed (Red)
  else if (['FAILED', 'CRITICAL', 'ERROR', 'FAULT', 'BLOCKED', 'REJECTED', 'HIGH'].includes(norm)) {
    bg = 'bg-predict-light';
    text = 'text-predict-text';
    border = 'border-predict/40';
    pip = 'bg-predict';
  }

  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-wider font-semibold rounded-pill border shadow-sm ${
        isSmall ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      } ${bg} ${text} ${border} ${className}`}
    >
      <span className={`rounded-full shrink-0 ${isSmall ? 'w-1.5 h-1.5' : 'w-2 h-2'} ${pip}`} />
      <span>{label || norm}</span>
    </span>
  );
};

export default StatusBadge;
