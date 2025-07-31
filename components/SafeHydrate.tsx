'use client';

import { ReactNode, useEffect, useState } from 'react';

interface SafeHydrateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function SafeHydrate({ children, fallback = null }: SafeHydrateProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    try {
      // Wait a tick to ensure DOM is ready
      const timer = setTimeout(() => {
        setIsHydrated(true);
      }, 0);

      return () => clearTimeout(timer);
    } catch (error) {
      console.error('Hydration error:', error);
      setHasError(true);
    }
  }, []);

  if (hasError) {
    return <>{fallback}</>;
  }

  if (!isHydrated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}