'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useBadgeSidebar } from '@/contexts/BadgeSidebarContext';
import BadgeSidebar from '@/components/badges/BadgeSidebar';

export default function BadgeSidebarWrapper({ children }: { children: React.ReactNode }) {
  const { isBadgeSidebarVisible, setBadgeSidebarVisible } = useBadgeSidebar();
  const pathname = usePathname();
  
  // Don't show badge sidebar on admin pages
  const isAdminPage = pathname?.startsWith('/manage') || pathname?.startsWith('/admin');
  
  return (
    <>
      {children}
      {!isAdminPage && (
        <BadgeSidebar 
          isVisible={isBadgeSidebarVisible} 
          onToggle={setBadgeSidebarVisible} 
        />
      )}
    </>
  );
}