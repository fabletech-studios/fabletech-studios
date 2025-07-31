'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function NavigationFix() {
  const pathname = usePathname();
  const router = useRouter();
  
  useEffect(() => {
    // Suppress hydration warnings and handle navigation errors
    if (typeof window !== 'undefined') {
      const originalError = console.error;
      console.error = (...args) => {
        const errorStr = args[0]?.toString() || '';
        
        // Suppress known warnings
        if (
          errorStr.includes('Warning: Text content did not match') ||
          errorStr.includes('Warning: Did not expect server HTML') ||
          errorStr.includes('Hydration failed') ||
          errorStr.includes('Extra attributes from the server') ||
          errorStr.includes('Did not expect server HTML to contain')
        ) {
          return;
        }
        
        // Suppress browser extension errors
        if (
          errorStr.includes('mce-autosize-textarea') ||
          errorStr.includes('webcomponents-ce.js') ||
          errorStr.includes('overlay_bundle.js')
        ) {
          return;
        }
        
        originalError.apply(console, args);
      };
      
      // Handle React DOM errors
      const handleError = (event: ErrorEvent) => {
        if (
          event.message.includes('removeChild') ||
          event.message.includes('insertBefore') ||
          event.message.includes('Cannot read properties of null')
        ) {
          event.preventDefault();
          console.warn('Caught React DOM error, attempting recovery...');
          
          // Force a clean navigation
          setTimeout(() => {
            if (window.location.pathname !== pathname) {
              window.location.href = pathname;
            }
          }, 100);
        }
      };
      
      window.addEventListener('error', handleError);
      return () => window.removeEventListener('error', handleError);
    }
  }, [pathname]);

  useEffect(() => {
    // Force refresh on navigation if needed
    const handleRouteChange = () => {
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    };

    handleRouteChange();
  }, [pathname]);

  return null;
}