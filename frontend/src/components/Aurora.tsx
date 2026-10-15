import React from 'react';
import { motion } from 'framer-motion';

interface AuroraProps {
  className?: string;
}

export const Aurora: React.FC<AuroraProps> = ({ className = '' }) => {
  return (
    <div 
      className={`absolute inset-0 overflow-hidden pointer-events-none -z-10 ${className}`}
      aria-hidden="true"
    >
      {/* Blush blob */}
      <motion.div
        className="absolute -top-24 -left-20 w-[460px] h-[460px] rounded-full"
        style={{
          background: 'radial-gradient(circle, var(--aurora-blush) 0%, transparent 70%)',
          filter: 'blur(70px)',
          opacity: 0.5,
        }}
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -30, 40, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Peach blob */}
      <motion.div
        className="absolute top-1/4 -right-28 w-[520px] h-[520px] rounded-full"
        style={{
          background: 'radial-gradient(circle, var(--aurora-peach) 0%, transparent 70%)',
          filter: 'blur(80px)',
          opacity: 0.45,
        }}
        animate={{
          x: [0, -50, 20, 0],
          y: [0, 40, -30, 0],
          scale: [1, 0.9, 1.05, 1],
        }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Sand warm glow */}
      <motion.div
        className="absolute top-1/2 left-1/4 w-[420px] h-[420px] rounded-full"
        style={{
          background: 'radial-gradient(circle, var(--aurora-sand) 0%, transparent 70%)',
          filter: 'blur(75px)',
          opacity: 0.4,
        }}
        animate={{
          x: [0, 30, -40, 0],
          y: [0, -25, 30, 0],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Rose bottom glow */}
      <motion.div
        className="absolute -bottom-20 right-1/3 w-[480px] h-[480px] rounded-full"
        style={{
          background: 'radial-gradient(circle, var(--aurora-rose) 0%, transparent 70%)',
          filter: 'blur(85px)',
          opacity: 0.42,
        }}
        animate={{
          x: [0, -35, 45, 0],
          y: [0, 35, -20, 0],
          scale: [1, 1.08, 0.96, 1],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};

export default Aurora;
