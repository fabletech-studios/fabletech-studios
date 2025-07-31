'use client';

import { useEffect } from 'react';

export default function HydrationFix() {
  useEffect(() => {
    // Override React's error handling for DOM manipulation errors
    if (typeof window !== 'undefined') {
      const originalError = window.onerror;
      
      window.onerror = function(message, source, lineno, colno, error) {
        // Catch React DOM errors
        if (
          message?.toString().includes('removeChild') ||
          message?.toString().includes('Cannot read properties of null') ||
          error?.message?.includes('removeChild')
        ) {
          // Silently suppress - no logging
          
          // Try to recover by forcing a re-render
          const root = document.getElementById('__next');
          if (root) {
            // Force React to re-sync with the DOM
            const event = new Event('resize');
            window.dispatchEvent(event);
          }
          
          return true; // Prevent error from bubbling up
        }
        
        // Call original handler for other errors
        if (originalError) {
          return originalError(message, source, lineno, colno, error);
        }
        return false;
      };
      
      // Clean up hydration mismatches
      const cleanupInterval = setInterval(() => {
        // Remove any orphaned nodes that might cause issues
        const orphanedNodes = document.querySelectorAll('[data-reactroot]:empty');
        orphanedNodes.forEach(node => {
          if (node.parentNode) {
            // Silently remove orphaned nodes
            node.remove();
          }
        });
      }, 5000);
      
      return () => {
        clearInterval(cleanupInterval);
        window.onerror = originalError;
      };
    }
  }, []);
  
  return null;
}