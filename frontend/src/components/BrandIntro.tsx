import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BrandIntroProps {
  onFinish?: () => void;
}

export const BrandIntro: React.FC<BrandIntroProps> = ({ onFinish }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if shown this session or if prefers reduced motion
    const alreadyShown = sessionStorage.getItem('rx_brand_intro_shown') === 'true';
    const isReduced = localStorage.getItem('rx_reduced_motion') === 'true' ||
                      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!alreadyShown && !isReduced) {
      setShow(true);
      const timer = setTimeout(() => {
        handleComplete();
      }, 3400);
      return () => clearTimeout(timer);
    } else {
      if (onFinish) onFinish();
    }
  }, []);

  const handleComplete = () => {
    sessionStorage.setItem('rx_brand_intro_shown', 'true');
    setShow(false);
    if (onFinish) onFinish();
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-page"
      >
        {/* Skip button always available */}
        <button
          onClick={handleComplete}
          className="absolute top-6 right-8 font-mono text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-pill bg-tile border border-border text-ink-2 hover:text-ink hover:border-border-strong shadow-sm transition-all"
        >
          Skip Intro &rarr;
        </button>

        <div className="relative w-80 h-80 flex items-center justify-center">
          {/* Dashed plum ring */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6, rotate: 360 }}
            transition={{
              scale: { duration: 0.8, delay: 0.2 },
              opacity: { duration: 0.5 },
              rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
            }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-rewind"
          />

          {/* Pulsing red ring */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.8, 0.3] }}
            transition={{
              duration: 1.4,
              repeat: 2,
              ease: 'easeInOut',
            }}
            className="absolute inset-6 rounded-full border-[1.5px] border-predict"
          />

          {/* Central Red X Core */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
            className="w-24 h-24 rounded-3xl bg-predict shadow-modal flex items-center justify-center z-10"
          >
            <span className="font-headline font-bold text-cream text-4xl select-none">
              X
            </span>
          </motion.div>

          {/* Flying verb labels from 4 corners */}
          <motion.span
            initial={{ x: -160, y: -160, opacity: 0 }}
            animate={{ x: -90, y: -90, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8, type: 'spring', damping: 20 }}
            className="absolute font-headline font-bold text-sm tracking-wide text-predict-text bg-tile px-2.5 py-1 rounded-pill border border-border shadow-sm"
          >
            Predict
          </motion.span>

          <motion.span
            initial={{ x: 160, y: -160, opacity: 0 }}
            animate={{ x: 90, y: -90, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.0, type: 'spring', damping: 20 }}
            className="absolute font-headline font-bold text-sm tracking-wide text-prove-text bg-tile px-2.5 py-1 rounded-pill border border-border shadow-sm"
          >
            Prove
          </motion.span>

          <motion.span
            initial={{ x: -160, y: 160, opacity: 0 }}
            animate={{ x: -90, y: 90, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2, type: 'spring', damping: 20 }}
            className="absolute font-headline font-bold text-sm tracking-wide text-recover-text bg-tile px-2.5 py-1 rounded-pill border border-border shadow-sm"
          >
            Recover
          </motion.span>

          <motion.span
            initial={{ x: 160, y: 160, opacity: 0 }}
            animate={{ x: 90, y: 90, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.4, type: 'spring', damping: 20 }}
            className="absolute font-headline font-bold text-sm tracking-wide text-rewind-text bg-tile px-2.5 py-1 rounded-pill border border-border shadow-sm"
          >
            Rewind
          </motion.span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BrandIntro;
