import React from 'react';
import clsx from 'clsx';

interface PanelHeaderProps {
  icon?: string;
  moduleId?: string;
  title: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  icon,
  moduleId,
  title,
  badge,
  action,
}) => {
  return (
    <div className="h-9 px-space-md border-b border-hairline flex items-center justify-between shrink-0 bg-surface-container-lowest select-none">
      <div className="flex items-center gap-space-sm">
        {icon && (
          <span className="material-symbols-outlined text-base leading-none text-primary-container">
            {icon}
          </span>
        )}
        {moduleId && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-outline">
            {moduleId}
          </span>
        )}
        <span className="font-mono text-label-md uppercase tracking-wider font-bold text-on-surface">
          {title}
        </span>
        {badge}
      </div>
      {action && <div className="flex items-center gap-space-xs">{action}</div>}
    </div>
  );
};

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({ children, className = '', header }) => {
  return (
    <div
      className={clsx(
        'corner-ticks bg-surface-container-lowest border border-hairline rounded-lg shadow-sm flex flex-col relative overflow-hidden',
        className
      )}
    >
      {header}
      <div className="p-space-md flex-1 min-h-0">{children}</div>
    </div>
  );
};
