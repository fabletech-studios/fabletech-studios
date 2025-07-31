'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Sparkles,
  CreditCard,
  X,
  Loader
} from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'credit' | 'loading';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  hideNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

const notificationIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  credit: CreditCard,
  loading: Loader,
};

const notificationColors = {
  success: {
    bg: 'bg-gradient-to-r from-green-900/90 to-green-800/90',
    border: 'border-green-600',
    icon: 'text-green-400',
    text: 'text-green-100',
  },
  error: {
    bg: 'bg-gradient-to-r from-red-900/90 to-red-800/90',
    border: 'border-red-600',
    icon: 'text-red-400',
    text: 'text-red-100',
  },
  warning: {
    bg: 'bg-gradient-to-r from-yellow-900/90 to-yellow-800/90',
    border: 'border-yellow-600',
    icon: 'text-yellow-400',
    text: 'text-yellow-100',
  },
  info: {
    bg: 'bg-gradient-to-r from-blue-900/90 to-blue-800/90',
    border: 'border-blue-600',
    icon: 'text-blue-400',
    text: 'text-blue-100',
  },
  credit: {
    bg: 'bg-gradient-to-r from-purple-900/90 to-purple-800/90',
    border: 'border-purple-600',
    icon: 'text-purple-400',
    text: 'text-purple-100',
  },
  loading: {
    bg: 'bg-gradient-to-r from-gray-900/90 to-gray-800/90',
    border: 'border-gray-600',
    icon: 'text-gray-400',
    text: 'text-gray-100',
  },
};

function NotificationItem({ notification, onClose }: { notification: Notification; onClose: () => void }) {
  const Icon = notificationIcons[notification.type];
  const colors = notificationColors[notification.type];

  React.useEffect(() => {
    if (!notification.persistent && notification.duration !== 0) {
      const timer = setTimeout(() => {
        onClose();
      }, notification.duration || 4000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`
        relative overflow-hidden
        ${colors.bg} ${colors.border}
        backdrop-blur-sm
        border rounded-xl
        shadow-2xl
        p-4 pr-12
        min-w-[320px] max-w-[420px]
        cursor-pointer
      `}
      onClick={onClose}
      role="alert"
      aria-live="polite"
    >
      {/* Background shimmer effect */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 animate-shimmer" />
      </div>

      <div className="relative flex items-start gap-3">
        <div className={`flex-shrink-0 ${colors.icon}`}>
          {notification.type === 'loading' ? (
            <Icon className="w-5 h-5 animate-spin" />
          ) : notification.type === 'credit' ? (
            <div className="relative">
              <Icon className="w-5 h-5" />
              <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-400" />
            </div>
          ) : (
            <Icon className="w-5 h-5" />
          )}
        </div>
        
        <div className="flex-1">
          <h4 className={`font-semibold ${colors.text}`}>
            {notification.title}
          </h4>
          {notification.message && (
            <p className={`text-sm mt-1 ${colors.text} opacity-90`}>
              {notification.message}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className={`absolute top-3 right-3 ${colors.icon} hover:opacity-70 transition-opacity`}
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar for timed notifications */}
      {!notification.persistent && notification.type !== 'loading' && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: (notification.duration || 4000) / 1000, ease: 'linear' }}
          className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 origin-left"
        />
      )}
    </motion.div>
  );
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { ...notification, id }]);
  }, []);

  const hideNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification, clearNotifications }}>
      {children}
      <div className="fixed top-4 right-4 z-50 pointer-events-none">
        <AnimatePresence>
          <div className="space-y-3 pointer-events-auto">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClose={() => hideNotification(notification.id)}
              />
            ))}
          </div>
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

// Pre-configured notification helpers
export const notifications = {
  success: (title: string, message?: string) => ({
    type: 'success' as const,
    title,
    message,
  }),
  
  error: (title: string, message?: string) => ({
    type: 'error' as const,
    title,
    message,
  }),
  
  episodeUnlocked: () => ({
    type: 'credit' as const,
    title: '🎉 Episode Unlocked!',
    message: 'Enjoy your new content',
  }),
  
  creditsDeducted: (amount: number) => ({
    type: 'credit' as const,
    title: `${amount} Credits Used`,
    message: 'Thank you for your purchase',
  }),
  
  creditsAdded: (amount: number) => ({
    type: 'credit' as const,
    title: 'Credits Added!',
    message: `${amount} credits have been added to your account`,
  }),
  
  paymentProcessing: () => ({
    type: 'loading' as const,
    title: 'Processing Payment...',
    message: 'Please wait',
    persistent: true,
  }),
  
  paymentSuccess: () => ({
    type: 'success' as const,
    title: 'Payment Successful!',
    message: 'Your credits are now available',
  }),
  
  loginSuccess: () => ({
    type: 'success' as const,
    title: 'Welcome Back!',
    duration: 2000,
  }),
  
  signupSuccess: () => ({
    type: 'success' as const,
    title: 'Account Created!',
    message: 'Welcome to FableTech Studios',
  }),
};