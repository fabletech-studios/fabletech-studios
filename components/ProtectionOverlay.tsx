'use client';

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Camera, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProtectionOverlayProps {
  isActive: boolean;
  reason?: string;
  severity?: 'warning' | 'alert' | 'critical';
  onDismiss?: () => void;
}

export default function ProtectionOverlay({ 
  isActive, 
  reason = 'Screen recording detected', 
  severity = 'warning',
  onDismiss 
}: ProtectionOverlayProps) {
  const [showDismiss, setShowDismiss] = useState(false);

  useEffect(() => {
    if (isActive && severity === 'warning') {
      // Allow dismissal after 5 seconds for warnings
      const timer = setTimeout(() => setShowDismiss(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isActive, severity]);

  const severityConfig = {
    warning: {
      bg: 'bg-yellow-900/90',
      border: 'border-yellow-700',
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      title: 'Content Protection Active'
    },
    alert: {
      bg: 'bg-orange-900/90',
      border: 'border-orange-700',
      icon: Camera,
      iconColor: 'text-orange-500',
      title: 'Recording Detected'
    },
    critical: {
      bg: 'bg-red-900/90',
      border: 'border-red-700',
      icon: Shield,
      iconColor: 'text-red-500',
      title: 'Security Violation'
    }
  };

  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none"
        >
          {/* Blur overlay - removed to not block interactions */}
          {/* <div className="absolute inset-0 backdrop-blur-md" /> */}
          
          {/* Warning message */}
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className={`absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 ${config.bg} ${config.border} border rounded-lg p-4 pointer-events-auto`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`w-6 h-6 ${config.iconColor} flex-shrink-0`} />
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">{config.title}</h3>
                <p className="text-sm text-gray-300">{reason}</p>
                
                {severity === 'critical' && (
                  <p className="text-xs text-gray-400 mt-2">
                    Your session will be terminated if violations continue.
                  </p>
                )}
              </div>
            </div>
            
            {showDismiss && onDismiss && (
              <button
                onClick={onDismiss}
                className="mt-3 text-xs text-gray-400 hover:text-white transition"
              >
                Dismiss
              </button>
            )}
          </motion.div>

          {/* Watermark grid for critical violations */}
          {severity === 'critical' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="grid grid-cols-3 gap-8 p-8 opacity-20">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-center">
                    <div className="text-center">
                      <Shield className="w-16 h-16 text-red-500 mx-auto mb-2" />
                      <p className="text-xs text-red-500 font-bold">PROTECTED</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Eye tracking indicator */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-4 right-4 bg-black/80 rounded-full p-3 pointer-events-none"
          >
            <Eye className="w-6 h-6 text-red-500" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}