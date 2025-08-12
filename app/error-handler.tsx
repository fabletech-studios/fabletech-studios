'use client';

import { useEffect } from 'react';
import { clientLogger } from '@/lib/client-logger';

export default function ErrorHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Ignore browser extension errors
      if (clientLogger.isExtensionError(event.error || event.message)) {
        event.preventDefault();
        return;
      }
      
      // Ignore hydration errors in production
      if (process.env.NODE_ENV === 'production' && clientLogger.isHydrationError(event.error || event.message)) {
        event.preventDefault();
        return;
      }
      
      // Log other errors
      clientLogger.log(event.error || event.message, 'error', 'window.onerror');
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Ignore browser extension errors
      if (clientLogger.isExtensionError(event.reason)) {
        event.preventDefault();
        return;
      }
      
      clientLogger.log(event.reason, 'error', 'unhandledrejection');
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  return <>{children}</>;
}