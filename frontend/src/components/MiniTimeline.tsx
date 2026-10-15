import React from 'react';
import { motion } from 'framer-motion';

export interface TimelineStageInfo {
  name: string; // 'predict' | 'perform' | 'prove' | 'recover' | 'rewind'
  started_at: string;
  ended_at?: string | null;
  status: string; // 'COMPLETED' | 'RUNNING' | 'PENDING' | 'FAILED'
}

export interface TimelineFaultInfo {
  type: string;
  ts: string;
  step_id?: string | null;
}

interface MiniTimelineProps {
  stages?: TimelineStageInfo[];
  faults?: TimelineFaultInfo[];
  activeStage?: string;
  ariaStatus?: string;
  onStageClick?: (stage: string) => void;
  className?: string;
}

const STAGE_CONFIG = [
  { id: 'predict', label: 'Predict', color: 'var(--predict)', textColor: 'var(--predict-text)', bgLight: 'var(--predict-light)' },
  { id: 'perform', label: 'Perform', color: 'var(--recover)', textColor: 'var(--recover-text)', bgLight: 'var(--recover-light)' },
  { id: 'prove', label: 'Prove', color: 'var(--prove)', textColor: 'var(--prove-text)', bgLight: 'var(--prove-light)' },
  { id: 'rewind', label: 'Rewind', color: 'var(--rewind)', textColor: 'var(--rewind-text)', bgLight: 'var(--rewind-light)' },
];

export const MiniTimeline: React.FC<MiniTimelineProps> = ({
  stages = [],
  faults = [],
  activeStage = 'predict',
  ariaStatus = 'System nominal',
  onStageClick,
  className = '',
}) => {
  // Determine completion index
  const stageStatusMap: Record<string, string> = {};
  stages.forEach(s => {
    stageStatusMap[s.name.toLowerCase()] = s.status;
  });

  return (
    <div className={`tile p-3 mb-4 select-none relative ${className}`} role="region" aria-label="Mission Lifecycle Timeline">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-ink-2">
            Timeline Strip
          </span>
          <span className="text-border-strong">&bull;</span>
          <span className="font-mono text-[10px] text-ink-3" aria-live="polite">
            {ariaStatus}
          </span>
        </div>

        {faults.length > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-pill bg-recover-light border border-recover/40 text-recover-text font-mono text-[10px] font-bold">
            <span className="material-symbols-outlined text-xs">bolt</span>
            <span>{faults.length} Fault{faults.length > 1 ? 's' : ''} Injected</span>
          </div>
        )}
      </div>

      {/* Fault Flags Container */}
      <div className="relative h-4 mb-1">
        {faults.map((flt, idx) => {
          // Space flags across bar
          const leftPct = Math.min(90, Math.max(10, 25 + idx * 22));
          return (
            <div
              key={idx}
              className="absolute -top-1 -translate-x-1/2 cursor-pointer group z-10"
              style={{ left: `${leftPct}%` }}
              title={`Fault: ${flt.type} at ${new Date(flt.ts).toLocaleTimeString()}`}
            >
              <span className="material-symbols-outlined text-recover text-sm group-hover:scale-125 transition-transform">
                flag
              </span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block px-2 py-1 bg-ink text-cream text-[9px] font-mono rounded whitespace-nowrap shadow-modal z-30">
                {flt.type} ({flt.step_id || 'step'})
              </div>
            </div>
          );
        })}
      </div>

      {/* Segmented Timeline Bar */}
      <div className="relative h-3 w-full bg-sand rounded-pill overflow-hidden flex p-0.5 gap-1 border border-border">
        {STAGE_CONFIG.map((seg) => {
          const status = stageStatusMap[seg.id] || (activeStage === seg.id ? 'RUNNING' : 'PENDING');
          const isComplete = status === 'COMPLETED';
          const isRunning = status === 'RUNNING';

          return (
            <button
              key={seg.id}
              type="button"
              onClick={() => onStageClick && onStageClick(seg.id)}
              className="flex-1 h-full rounded-pill transition-all relative overflow-hidden focus-visible:ring-2 focus-visible:ring-predict outline-none"
              style={{
                backgroundColor: isComplete
                  ? seg.color
                  : isRunning
                  ? seg.bgLight
                  : 'var(--sand-light)',
              }}
              title={`${seg.label} stage (${status})`}
            >
              {isRunning && (
                <motion.div
                  className="absolute inset-0 opacity-40"
                  style={{ backgroundColor: seg.color }}
                  animate={{ opacity: [0.2, 0.7, 0.2] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Stage Labels */}
      <div className="flex justify-between items-center mt-2 px-1 text-[10px] font-mono">
        {STAGE_CONFIG.map((seg) => {
          const isActive = activeStage === seg.id;
          return (
            <span
              key={seg.id}
              onClick={() => onStageClick && onStageClick(seg.id)}
              className={`cursor-pointer transition-colors ${
                isActive ? 'font-bold underline underline-offset-4' : 'text-ink-3 hover:text-ink'
              }`}
              style={{ color: isActive ? seg.textColor : undefined }}
            >
              {seg.label}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default MiniTimeline;
