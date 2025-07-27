'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  duration?: number;
  onComplete?: () => void;
}

export default function SuccessAnimation({
  show,
  message = 'Success!',
  duration = 3000,
  onComplete
}: SuccessAnimationProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    if (show) {
      // Generate confetti particles
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Background overlay */}
          <motion.div
            className="absolute inset-0 bg-black/50 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onComplete}
          />

          {/* Success container */}
          <motion.div
            className="relative z-10"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20
            }}
          >
            {/* Main circle */}
            <div className="relative">
              <motion.div
                className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl"
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(34, 197, 94, 0.4)',
                    '0 0 0 30px rgba(34, 197, 94, 0)',
                  ]
                }}
                transition={{
                  duration: 1,
                  repeat: 2,
                  ease: 'easeOut'
                }}
              >
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Check className="w-16 h-16 text-white" strokeWidth={3} />
                </motion.div>
              </motion.div>

              {/* Confetti particles */}
              {particles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="absolute top-1/2 left-1/2 w-2 h-2"
                  initial={{ x: 0, y: 0, scale: 0 }}
                  animate={{
                    x: particle.x,
                    y: particle.y,
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.3 + particle.id * 0.05,
                    ease: 'easeOut'
                  }}
                >
                  <Sparkles className="w-full h-full text-yellow-400" />
                </motion.div>
              ))}
            </div>

            {/* Message */}
            <motion.p
              className="text-center mt-6 text-xl font-semibold text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {message}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}