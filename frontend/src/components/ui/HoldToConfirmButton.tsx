import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface HoldToConfirmButtonProps {
  onConfirm: () => void;
  holdDurationMs?: number;
  label: string;
  confirmWord?: string;
  variant?: 'primary' | 'destructive';
  className?: string;
}

export const HoldToConfirmButton: React.FC<HoldToConfirmButtonProps> = ({
  onConfirm,
  holdDurationMs = 1500,
  label,
  confirmWord,
  variant = 'primary',
  className = '',
}) => {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [showTypedModal, setShowTypedModal] = useState(false);
  const [typedInput, setTypedInput] = useState('');
  const timerRef = useRef<any>(null);
  const startRef = useRef<number>(0);

  const startHold = () => {
    setIsHolding(true);
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(100, (elapsed / holdDurationMs) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current);
        setIsHolding(false);
        setProgress(0);
        onConfirm();
      }
    }, 20);
  };

  const cancelHold = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsHolding(false);
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmWord && typedInput.trim().toUpperCase() === confirmWord.toUpperCase()) {
      setShowTypedModal(false);
      setTypedInput('');
      onConfirm();
    }
  };

  return (
    <>
      <div className="relative inline-flex items-center gap-2">
        <button
          type="button"
          onMouseDown={startHold}
          onMouseUp={cancelHold}
          onMouseLeave={cancelHold}
          onTouchStart={startHold}
          onTouchEnd={cancelHold}
          className={clsx(
            'relative overflow-hidden font-mono uppercase tracking-wider font-bold text-xs px-4 py-2 rounded-xl select-none transition-colors border shadow-sm',
            variant === 'destructive'
              ? 'bg-[var(--predict)] text-[var(--cream-text)] border-[var(--predict-border)] hover:opacity-90'
              : 'bg-[var(--rewind)] text-[var(--cream-text)] border-[var(--rewind-border)] hover:opacity-90',
            className
          )}
        >
          {/* Progress fill bar */}
          <span
            className="absolute left-0 top-0 bottom-0 bg-[var(--cream-text)]/30 transition-all duration-75 pointer-events-none"
            style={{ width: `${progress}%` }}
          />
          <span className="relative z-10 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">
              {progress > 0 ? 'lock_open' : 'lock'}
            </span>
            <span>{isHolding ? `HOLDING (${Math.round(progress)}%)` : label}</span>
          </span>
        </button>

        {confirmWord && (
          <button
            type="button"
            onClick={() => setShowTypedModal(true)}
            title="Alternative keyboard typed confirmation"
            className="p-1 text-[var(--ink-2)] hover:text-[var(--ink)] text-xs font-mono uppercase"
          >
            [TYPE]
          </button>
        )}
      </div>

      {showTypedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/40 backdrop-blur-sm p-4">
          <div className="bg-[var(--tile)] border border-[var(--border)] p-6 rounded-2xl shadow-xl max-w-md w-full flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <span className="font-mono text-xs uppercase tracking-wider font-bold text-[var(--ink)]">
                Manual Authorization Required
              </span>
              <button
                onClick={() => setShowTypedModal(false)}
                className="text-[var(--ink-2)] hover:text-[var(--ink)]"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <p className="text-sm text-[var(--ink-2)]">
              Type <strong className="text-[var(--ink)] font-mono">{confirmWord}</strong> below to confirm and authorize this action.
            </p>
            <form onSubmit={handleTypedSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                autoFocus
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder={confirmWord}
                className="w-full bg-[var(--sand-light)] border border-[var(--border-strong)] px-3 py-2 rounded-xl font-mono text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--predict)]"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTypedModal(false)}
                  className="px-3 py-2 font-mono text-xs text-[var(--ink-2)] uppercase hover:text-[var(--ink)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={typedInput.trim().toUpperCase() !== (confirmWord ?? '').toUpperCase()}
                  className="px-4 py-2 bg-[var(--predict)] text-[var(--cream-text)] font-mono text-xs font-bold uppercase rounded-xl disabled:opacity-40"
                >
                  Confirm Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
