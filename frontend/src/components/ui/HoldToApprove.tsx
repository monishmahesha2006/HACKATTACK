import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface HoldToApproveProps {
  onApprove: () => void;
  holdDurationMs?: number;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const HoldToApprove: React.FC<HoldToApproveProps> = ({
  onApprove,
  holdDurationMs = 1000,
  label = 'Hold 1s to Authorize',
  className = '',
  disabled = false,
}) => {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const timerRef = useRef<any>(null);
  const startRef = useRef<number>(0);

  const startHold = () => {
    if (disabled || isApproved) return;
    setIsHolding(true);
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(100, (elapsed / holdDurationMs) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current);
        setIsHolding(false);
        setIsApproved(true);
        setProgress(100);
        onApprove();
      }
    }, 16);
  };

  const cancelHold = () => {
    if (isApproved) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsHolding(false);
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className={`relative inline-flex ${className}`}>
      <motion.button
        type="button"
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        whileHover={disabled ? {} : { scale: 1.01 }}
        whileTap={disabled ? {} : { scale: 0.98 }}
        disabled={disabled || isApproved}
        className={`relative overflow-hidden font-headline font-semibold text-sm px-6 py-3 rounded-button select-none transition-all duration-300 border-2 outline-none focus-visible:ring-2 focus-visible:ring-predict focus-visible:ring-offset-2 ${
          isApproved
            ? 'bg-prove text-cream border-prove shadow-tile'
            : isHolding
            ? 'bg-sand-light text-ink border-rewind shadow-tile'
            : 'bg-tile text-ink border-border hover:border-border-strong shadow-sm'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {/* Plum border fill progress bar */}
        {!isApproved && (
          <span
            className="absolute left-0 bottom-0 top-0 bg-rewind/20 pointer-events-none transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        )}

        <span className="relative z-10 flex items-center justify-center gap-2">
          {isApproved ? (
            <>
              <svg className="w-5 h-5 text-cream" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Authorized & Dispatched</span>
            </>
          ) : isHolding ? (
            <>
              <svg className="w-4 h-4 text-rewind-text animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="text-rewind-text">Holding ({Math.round(progress)}%)...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-ink-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>{label}</span>
            </>
          )}
        </span>
      </motion.button>
    </div>
  );
};

export default HoldToApprove;
