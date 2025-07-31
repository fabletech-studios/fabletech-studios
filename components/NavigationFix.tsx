'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function NavigationFix() {
  const pathname = usePathname();

  useEffect(() => {
    // Force a re-render when pathname changes
    // This helps with the navigation issue where URL changes but page doesn't update
    const handleRouteChange = () => {
      // Small timeout to ensure the route change is processed
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    };

    handleRouteChange();
  }, [pathname]);

  return null;
}