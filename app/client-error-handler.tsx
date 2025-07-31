'use client';

import { useEffect } from 'react';
import { clientLogger } from '@/lib/client-logger';

export default function ClientErrorHandler() {
  useEffect(() => {
    // Prevent browser extension errors from breaking the app
    const originalError = window.onerror;
    const originalUnhandledRejection = window.onunhandledrejection;
    const originalConsoleError = console.error;

    // Override console.error to suppress extension errors
    console.error = function(...args) {
      const errorStr = args[0]?.toString() || '';
      
      // Suppress browser extension errors completely
      if (
        errorStr.includes('mce-autosize-textarea') ||
        errorStr.includes('webcomponents-ce.js') ||
        errorStr.includes('overlay_bundle.js') ||
        errorStr.includes('A custom element with name') ||
        errorStr.includes('has already been defined')
      ) {
        return; // Don't log to console
      }
      
      // Call original console.error for other errors
      originalConsoleError.apply(console, args);
    };

    window.onerror = function(message, source, lineno, colno, error) {
      const errorStr = message?.toString() || '';
      
      // Check if it's a browser extension error
      if (clientLogger.isExtensionError(errorStr) || (source && clientLogger.isExtensionError(source))) {
        clientLogger.log(errorStr, 'warning', 'Browser Extension');
        console.warn('Suppressed browser extension error:', message);
        return true; // Prevent default error handling
      }

      // Handle React hydration errors
      if (clientLogger.isHydrationError(errorStr)) {
        clientLogger.log(errorStr, 'warning', 'React Hydration');
        console.warn('React hydration error - suppressing');
        // Just suppress the error, don't try to recover
        return true;
      }
      
      // Log other errors
      if (error) {
        clientLogger.log(error, 'error', source || 'Unknown');
      }

      // Call original handler for other errors
      if (originalError) {
        return originalError(message, source, lineno, colno, error);
      }
      return false;
    };

    window.onunhandledrejection = function(event) {
      // Check for extension errors in promise rejections
      if (event.reason && clientLogger.isExtensionError(event.reason)) {
        clientLogger.log(event.reason, 'warning', 'Promise Rejection');
        console.warn('Suppressed browser extension promise rejection:', event.reason);
        event.preventDefault();
        return;
      }
      
      // Log unhandled promise rejections
      if (event.reason) {
        clientLogger.log(event.reason, 'error', 'Unhandled Promise');
      }

      // Call original handler
      if (originalUnhandledRejection) {
        return originalUnhandledRejection(event);
      }
    };

    // Cleanup
    return () => {
      window.onerror = originalError;
      window.onunhandledrejection = originalUnhandledRejection;
      console.error = originalConsoleError;
    };
  }, []);

  return null;
}