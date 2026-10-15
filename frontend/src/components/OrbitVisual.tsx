import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface OrbitStage {
  id: 'PLAN' | 'REHEARSE' | 'PERFORM' | 'PROVE';
  label: string;
  stepNumber: string;
  verb: string;
  x: number;
  y: number;
  dotColor: string;
  textColor: string;
  lightBg: string;
  borderColor: string;
  desc: string;
  invariant: string;
}

export const ORBIT_STAGES: OrbitStage[] = [
  {
    id: 'PLAN',
    label: 'PLAN',
    stepNumber: '01',
    verb: 'predict',
    x: 0,
    y: -125, // Top (12 o'clock)
    dotColor: 'var(--predict)',
    textColor: 'var(--predict-text)',
    lightBg: 'var(--predict-light)',
    borderColor: 'var(--predict-border)',
    desc: 'Dual-verified planner graphs reversible steps and constraints with strict pre-conditions.',
    invariant: 'Reversible Plan Graph · Constraint Verification',
  },
  {
    id: 'REHEARSE',
    label: 'REHEARSE',
    stepNumber: '02',
    verb: 'recover',
    x: 125, // Right (3 o'clock)
    y: 0,
    dotColor: 'var(--recover)',
    textColor: 'var(--recover-text)',
    lightBg: 'var(--recover-light)',
    borderColor: 'var(--recover-border)',
    desc: 'Digital twin runs forward without touching live production state or external services.',
    invariant: 'Zero Mutation Sandbox · Shadow Execution',
  },
  {
    id: 'PERFORM',
    label: 'PERFORM',
    stepNumber: '03',
    verb: 'prove',
    x: 0,
    y: 125, // Bottom (6 o'clock)
    dotColor: 'var(--prove)',
    textColor: 'var(--prove-text)',
    lightBg: 'var(--prove-light)',
    borderColor: 'var(--prove-border)',
    desc: 'Journaled execution with idempotency keys and human approval gate before email dispatch.',
    invariant: 'Idempotency Enforcement · Human Approval Gate',
  },
  {
    id: 'PROVE',
    label: 'PROVE',
    stepNumber: '04',
    verb: 'rewind',
    x: -125, // Left (9 o'clock)
    y: 0,
    dotColor: 'var(--rewind)',
    textColor: 'var(--rewind-text)',
    lightBg: 'var(--rewind-light)',
    borderColor: 'var(--rewind-border)',
    desc: 'Independent re-read verified against frozen acceptance tests with SHA-256 ledger proof.',
    invariant: 'Cryptographic Ledger · 5/5 Acceptance Tests',
  },
];

const STAGE_ORDER: Record<string, number> = {
  PLAN: 0,
  REHEARSE: 1,
  PERFORM: 2,
  PROVE: 3,
};

interface OrbitVisualProps {
  runningMission?: {
    id: string;
    status: string;
    phase?: string;
  } | null;
  activePhase?: string;
}

export default function OrbitVisual({ runningMission, activePhase }: OrbitVisualProps) {
  const [selectedStageId, setSelectedStageId] = useState<string>('PLAN');

  // Detect reduced motion from prefers-reduced-motion media query and .reduce-motion class
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const local = localStorage.getItem('rx_reduced_motion') === 'true';
    const hasClass = document.documentElement.classList.contains('reduce-motion');
    return media || local || hasClass;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      const local = localStorage.getItem('rx_reduced_motion') === 'true';
      const hasClass = document.documentElement.classList.contains('reduce-motion');
      setPrefersReducedMotion(e.matches || local || hasClass);
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    const observer = new MutationObserver(() => {
      const hasClass = document.documentElement.classList.contains('reduce-motion');
      const local = localStorage.getItem('rx_reduced_motion') === 'true';
      setPrefersReducedMotion(mediaQuery.matches || local || hasClass);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      observer.disconnect();
    };
  }, []);

  // Determine if a real mission is running
  const isRunning = Boolean(
    runningMission &&
    ['RUNNING', 'PLANNING', 'REHEARSING'].includes(runningMission.status)
  );

  // Determine current active stage during a run
  const currentLiveStageId: string | null = isRunning
    ? (runningMission?.status === 'REHEARSING'
        ? 'REHEARSE'
        : (activePhase && STAGE_ORDER[activePhase] !== undefined ? activePhase : 'PLAN'))
    : null;

  const currentLiveStage = ORBIT_STAGES.find(s => s.id === currentLiveStageId) || null;
  const currentLiveIndex = currentLiveStageId ? (STAGE_ORDER[currentLiveStageId] ?? -1) : -1;

  // Selected stage details (syncs with live stage if running)
  const activeDetailStageId = currentLiveStageId || selectedStageId;
  const activeDetailStage = ORBIT_STAGES.find(s => s.id === activeDetailStageId) || ORBIT_STAGES[0];

  // Disable rotation if mission is running or reduced motion is on
  const shouldAnimateRotation = !isRunning && !prefersReducedMotion;
  const shouldAnimatePulse = !prefersReducedMotion;

  return (
    <div className="flex flex-col items-center">
      {/* =========================================================================
          ORBIT CANVAS (320px x 320px)
          ========================================================================= */}
      <div 
        className="relative w-80 h-80 my-4 flex items-center justify-center select-none"
        aria-label="Interactive execution lifecycle orbit"
      >
        {/* 1. Outer dashed ring in plum (--rewind) at 70% opacity, rotating counter-clockwise (28s) */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: '290px',
            height: '290px',
            border: '1.5px dashed var(--rewind)',
            opacity: 0.7,
          }}
          animate={shouldAnimatePulse ? { rotate: -360 } : { rotate: 0 }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* 2. Inner solid ring in red (--predict) at 50% opacity, 1.5px */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: '250px',
            height: '250px',
            border: '1.5px solid var(--predict)',
            opacity: 0.5,
          }}
        />

        {/* 3. The rotating orbit layer containing the 4 stage nodes */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          animate={shouldAnimateRotation ? { rotate: 360 } : { rotate: 0 }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {ORBIT_STAGES.map((node) => {
            const isLive = isRunning && node.id === currentLiveStageId;
            const nodeIndex = STAGE_ORDER[node.id];
            const isFinished = isRunning && currentLiveIndex > -1 && nodeIndex < currentLiveIndex;
            const isSelected = node.id === activeDetailStageId;
            const isDimmed = isRunning && !isLive;

            return (
              <div
                key={node.id}
                className="absolute flex items-center justify-center pointer-events-auto"
                style={{
                  transform: `translate(${node.x}px, ${node.y}px)`,
                }}
              >
                {/* Counter-rotate each node so labels stay upright while the orbit rotates */}
                <motion.div
                  animate={shouldAnimateRotation ? { rotate: -360 } : { rotate: 0 }}
                  transition={{
                    duration: 40,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  <motion.button
                    type="button"
                    onClick={() => setSelectedStageId(node.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedStageId(node.id);
                      }
                    }}
                    tabIndex={0}
                    aria-label={`Stage ${node.stepNumber} ${node.label}: ${node.desc}`}
                    animate={
                      isLive && shouldAnimatePulse
                        ? { scale: [1, 1.12, 1] }
                        : { scale: isSelected ? 1.05 : 1 }
                    }
                    transition={
                      isLive && shouldAnimatePulse
                        ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
                        : { duration: 0.2 }
                    }
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-pill font-mono text-[11px] font-bold tracking-wider cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2"
                    style={{
                      backgroundColor: 'var(--tile)',
                      border: isSelected || isLive
                        ? `1.5px solid ${node.dotColor}`
                        : '1px solid var(--border)',
                      boxShadow: isLive
                        ? `0 0 16px ${node.dotColor}`
                        : isSelected
                        ? 'var(--shadow-tile)'
                        : 'var(--shadow-sm)',
                      opacity: isDimmed ? 0.5 : 1,
                    }}
                  >
                    {/* Status dot or finished checkmark */}
                    {isFinished ? (
                      <span 
                        className="font-mono text-[10px] font-bold leading-none"
                        style={{ color: node.textColor }}
                      >
                        ✓
                      </span>
                    ) : (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: node.dotColor,
                          boxShadow: isLive ? `0 0 6px ${node.dotColor}` : 'none',
                        }}
                      />
                    )}

                    {/* Label text in its specific text shade */}
                    <span 
                      className="font-bold leading-none select-none"
                      style={{ color: node.textColor }}
                    >
                      {node.label}
                    </span>
                  </motion.button>
                </motion.div>
              </div>
            );
          })}
        </motion.div>

        {/* 4. Travelling dot from core to live node when mission is running */}
        {isRunning && currentLiveStage && shouldAnimatePulse && (
          <motion.div
            className="absolute rounded-full pointer-events-none z-20"
            style={{
              width: '8px',
              height: '8px',
              backgroundColor: currentLiveStage.dotColor,
              boxShadow: `0 0 8px ${currentLiveStage.dotColor}`,
            }}
            animate={{
              x: [0, currentLiveStage.x],
              y: [0, currentLiveStage.y],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* 5. Solid Red (--predict) X Core (64px circle) with 2s pulsing outer red ring */}
        <div className="relative z-10 flex items-center justify-center">
          {/* 1.5px red ring that pulses outward and fades every 2s */}
          {shouldAnimatePulse && (
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: '64px',
                height: '64px',
                border: '1.5px solid var(--predict)',
              }}
              animate={{
                scale: [1, 1.7],
                opacity: [0.85, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          )}

          {/* Solid Red Core Circle */}
          <motion.div
            animate={
              shouldAnimatePulse
                ? { scale: [1, 1.04, 1] }
                : { scale: 1 }
            }
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-16 h-16 rounded-full flex items-center justify-center cursor-default select-none transition-transform"
            style={{
              backgroundColor: 'var(--predict)',
              boxShadow: 'var(--shadow-tile)',
            }}
          >
            <span
              className="font-headline font-bold text-2xl select-none leading-none"
              style={{ color: 'var(--tile)' }}
            >
              X
            </span>
          </motion.div>
        </div>
      </div>

      {/* =========================================================================
          INTERACTIVE DETAIL CARD
          Switches when clicking or focusing (Enter/Space) a node
          ========================================================================= */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeDetailStage.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md p-4 rounded-card border transition-all mt-1"
          style={{
            backgroundColor: 'var(--tile)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: activeDetailStage.dotColor }}
              />
              <span
                className="font-mono text-xs font-bold tracking-wider"
                style={{ color: activeDetailStage.textColor }}
              >
                {activeDetailStage.stepNumber}. {activeDetailStage.label}
              </span>
            </div>

            <span
              className="font-mono text-[9px] uppercase px-2 py-0.5 rounded-pill font-semibold border"
              style={{
                backgroundColor: 'var(--sand-light)',
                color: 'var(--ink-2)',
                borderColor: 'var(--border)',
              }}
            >
              {isRunning && activeDetailStage.id === currentLiveStageId
                ? 'LIVE STAGE'
                : 'LIFECYCLE STAGE'}
            </span>
          </div>

          <p 
            className="font-body text-xs leading-relaxed mb-2"
            style={{ color: 'var(--ink)' }}
          >
            {activeDetailStage.desc}
          </p>

          <div 
            className="pt-2 border-t flex items-center justify-between text-[10px] font-mono"
            style={{ borderColor: 'var(--border)' }}
          >
            <span style={{ color: 'var(--ink-3)' }}>Invariant Guarantee:</span>
            <span className="font-bold" style={{ color: activeDetailStage.textColor }}>
              {activeDetailStage.invariant}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
