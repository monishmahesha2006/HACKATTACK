import React from 'react';
import clsx from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'relative inline-flex items-center justify-center font-mono uppercase tracking-wider font-bold transition-all duration-100 ease-linear rounded-DEFAULT select-none focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'text-label-xs px-space-sm py-1 gap-1',
    md: 'text-label-md px-space-md py-space-sm gap-space-xs',
    lg: 'text-label-lg px-space-lg py-space-md gap-space-sm',
  }[size];

  const variantClasses = {
    primary:
      'bg-[var(--predict)] text-[var(--cream-text)] hover:opacity-90 shadow-[var(--shadow-tile)] border border-[var(--predict-border)]',
    secondary:
      'bg-[var(--tile)] text-[var(--ink)] hover:bg-[var(--sand-light)] border border-[var(--border)] shadow-[var(--shadow-tile)]',
    destructive:
      'bg-[var(--predict)] text-[var(--cream-text)] hover:opacity-90 border border-[var(--predict-border)] shadow-[var(--shadow-tile)]',
    ghost:
      'bg-transparent text-[var(--ink-2)] hover:bg-[var(--sand-light)] hover:text-[var(--ink)]',
  }[variant];

  return (
    <button
      className={clsx(base, sizeClasses, variantClasses, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined text-base animate-spin">sync</span>
      ) : icon ? (
        <span className="material-symbols-outlined text-base leading-none">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
