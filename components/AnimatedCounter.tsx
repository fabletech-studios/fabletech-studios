'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  showChange?: boolean;
}

export default function AnimatedCounter({
  value,
  duration = 0.8,
  className = '',
  prefix = '',
  suffix = '',
  showChange = true
}: AnimatedCounterProps) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (current) => Math.round(current));
  
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  const previousValue = spring.getPrevious() || 0;
  const change = value - previousValue;
  const isIncreasing = change > 0;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <motion.span
        key={value}
        initial={{ opacity: 0, y: isIncreasing ? 10 : -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: isIncreasing ? -10 : 10 }}
        transition={{ duration: 0.3 }}
      >
        {prefix}
        <motion.span className="font-mono tabular-nums">
          {display}
        </motion.span>
        {suffix}
      </motion.span>

      {/* Change indicator */}
      {showChange && change !== 0 && (
        <motion.span
          className={`absolute -right-12 text-sm font-semibold ${
            isIncreasing ? 'text-green-500' : 'text-red-500'
          }`}
          initial={{ opacity: 0, x: -10, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, y: isIncreasing ? -20 : 20 }}
          transition={{ duration: 0.5 }}
        >
          {isIncreasing ? '+' : ''}{change}
        </motion.span>
      )}

      {/* Pulse effect on change */}
      {change !== 0 && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          initial={{ scale: 1, opacity: 0 }}
          animate={{
            scale: [1, 1.5, 1.5],
            opacity: [0, 0.3, 0],
          }}
          transition={{ duration: 0.6 }}
          style={{
            background: isIncreasing 
              ? 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)'
          }}
        />
      )}
    </div>
  );
}