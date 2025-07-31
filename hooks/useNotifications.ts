import { useCallback } from 'react';
import { useNotification, notifications } from '@/components/notifications/NotificationProvider';

export function useNotifications() {
  const { showNotification } = useNotification();

  const notify = useCallback({
    // Success notifications
    success: (title: string, message?: string) => 
      showNotification(notifications.success(title, message)),
    
    // Error notifications
    error: (title: string, message?: string) => 
      showNotification(notifications.error(title, message)),
    
    // Episode unlocked
    episodeUnlocked: () => 
      showNotification(notifications.episodeUnlocked()),
    
    // Credits notifications
    creditsDeducted: (amount: number) => 
      showNotification(notifications.creditsDeducted(amount)),
    
    creditsAdded: (amount: number) => 
      showNotification(notifications.creditsAdded(amount)),
    
    // Payment notifications
    paymentProcessing: () => 
      showNotification(notifications.paymentProcessing()),
    
    paymentSuccess: () => 
      showNotification(notifications.paymentSuccess()),
    
    // Auth notifications
    loginSuccess: () => 
      showNotification(notifications.loginSuccess()),
    
    signupSuccess: () => 
      showNotification(notifications.signupSuccess()),
    
    // Generic notifications
    info: (title: string, message?: string) => 
      showNotification({ type: 'info', title, message }),
    
    warning: (title: string, message?: string) => 
      showNotification({ type: 'warning', title, message }),
    
    loading: (title: string, message?: string) => 
      showNotification({ type: 'loading', title, message, persistent: true }),
  }, [showNotification]);

  return notify;
}