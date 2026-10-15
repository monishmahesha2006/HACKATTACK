import React from 'react';
import clsx from 'clsx';

interface DiffLine {
  type: 'add' | 'remove' | 'same';
  content: string;
}

interface DiffPanelProps {
  title?: string;
  lines: DiffLine[];
  className?: string;
}

export const DiffPanel: React.FC<DiffPanelProps> = ({
  title = 'STATE MUTATION DELTA',
  lines,
  className = '',
}) => {
  return (
    <div className={clsx('rounded-xl border border-[var(--border)] overflow-hidden font-mono text-xs shadow-sm', className)}>
      <div className="bg-[var(--sand)] text-[var(--ink)] px-3 py-1.5 flex items-center justify-between text-[11px] uppercase tracking-wider font-bold border-b border-[var(--border)]">
        <span>{title}</span>
        <span className="text-[var(--prove-text)] font-semibold">LIVE BUFFER</span>
      </div>
      <div className="bg-[var(--tile)] p-2 max-h-64 overflow-y-auto space-y-0.5">
        {lines.map((l, idx) => (
          <div
            key={idx}
            className={clsx(
              'px-2 py-0.5 flex items-start gap-2 select-text rounded',
              l.type === 'add' && 'bg-[var(--prove-light)] text-[var(--prove-text)]',
              l.type === 'remove' && 'bg-[var(--predict-light)] text-[var(--predict-text)]',
              l.type === 'same' && 'text-[var(--ink-2)]'
            )}
          >
            <span className="shrink-0 font-bold opacity-60">
              {l.type === 'add' ? '+' : l.type === 'remove' ? '-' : ' '}
            </span>
            <span className="break-all whitespace-pre-wrap">{l.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
