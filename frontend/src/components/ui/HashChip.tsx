import React, { useState } from 'react';
import clsx from 'clsx';

interface HashChipProps {
  hash: string;
  prefix?: string;
  className?: string;
}

export const HashChip: React.FC<HashChipProps> = ({ hash, prefix, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const display = hash.length > 12 ? `${hash.slice(0, 6)}••••${hash.slice(-4)}` : hash;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      title={`Click to copy: ${hash}`}
      className={clsx(
        'inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider bg-[var(--sand-light)] hover:bg-[var(--sand)] text-[var(--ink)] px-2 py-0.5 rounded-lg border border-[var(--border)] transition-colors select-none',
        className
      )}
    >
      {prefix && <span className="text-[var(--ink-2)]">{prefix}:</span>}
      <span className="font-semibold">{display}</span>
      <span className="material-symbols-outlined text-[12px] leading-none text-[var(--ink-2)]">
        {copied ? 'check' : 'content_copy'}
      </span>
    </button>
  );
};
