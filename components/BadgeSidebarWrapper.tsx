'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useBadgeSidebar } from '@/contexts/BadgeSidebarContext';
import BadgeSidebar from '@/components/badges/BadgeSidebar';
import BadgeHorizontalBar from '@/components/badges/BadgeHorizontalBar';

export default function BadgeSidebarWrapper({ children }: { children: React.ReactNode }) {
  const { isBadgeSidebarVisible, setBadgeSidebarVisible } = useBadgeSidebar();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  
  // Don't show badge sidebar on admin pages
  const isAdminPage = pathname?.startsWith('/manage') || pathname?.startsWith('/admin');
  
  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <>
      {/* Mobile: Badge bar is part of page flow */}
      {!isAdminPage && isMobile && (
        <BadgeHorizontalBar 
          isVisible={isBadgeSidebarVisible} 
          onToggle={setBadgeSidebarVisible} 
        />
      )}
      
      {/* Page content */}
      {children}
      
      {/* Desktop: Badge sidebar is fixed */}
      {!isAdminPage && !isMobile && (
        <BadgeSidebar 
          isVisible={isBadgeSidebarVisible} 
          onToggle={setBadgeSidebarVisible} 
        />
      )}
    </>
  );
}