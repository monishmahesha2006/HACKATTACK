import React, { useState } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface BorderButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode;
  loading?: boolean;
  disabledReason?: string;
  variant?: 'primary' | 'secondary' | 'plum' | 'olive';
  icon?: React.ReactNode;
}

export const BorderButton: React.FC<BorderButtonProps> = ({
  children,
  loading = false,
  disabledReason,
  variant = 'primary',
  disabled = false,
  onClick,
  className = '',
  ...props
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const isDisabled = disabled || loading;

  const bgStyle = variant === 'primary' 
    ? 'bg-predict hover:opacity-95 text-cream shadow-sm'
    : variant === 'plum'
    ? 'bg-rewind hover:opacity-95 text-cream shadow-sm'
    : variant === 'olive'
    ? 'bg-prove hover:opacity-95 text-cream shadow-sm'
    : 'bg-tile text-ink border border-border hover:border-border-strong hover:bg-sand-light';

  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={() => isDisabled && disabledReason && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <motion.button
        whileHover={isDisabled ? {} : { scale: 1.015, y: -1 }}
        whileTap={isDisabled ? {} : { scale: 0.97 }}
        disabled={isDisabled}
        onClick={onClick}
        className={`relative overflow-hidden font-headline font-semibold text-sm px-5 py-2.5 rounded-button inline-flex items-center justify-center gap-2 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-predict focus-visible:ring-offset-2 ${bgStyle} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
        {...props}
      >
        {/* Animated travelling lighter border line for primary buttons */}
        {variant === 'primary' && !isDisabled && (
          <span 
            className="absolute inset-0 pointer-events-none rounded-button overflow-hidden" 
            aria-hidden="true"
          >
            <span 
              className="absolute -inset-[100%] animate-[spin_4s_linear_infinite]"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0 320deg, var(--predict-glow) 340deg, transparent 360deg)',
                opacity: 0.85
              }}
            />
            <span className="absolute inset-[1.5px] rounded-[10.5px] bg-predict" />
          </span>
        )}

        {/* Content */}
        <span className="relative z-10 inline-flex items-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-cream" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span>Executing...</span>
            </>
          ) : (
            children
          )}
        </span>
      </motion.button>

      {/* Tooltip for disabled reasons */}
      {showTooltip && disabledReason && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-ink text-cream text-xs rounded-sm whitespace-nowrap shadow-modal z-50 pointer-events-none">
          {disabledReason}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-ink" />
        </div>
      )}
    </div>
  );
};

export default BorderButton;
