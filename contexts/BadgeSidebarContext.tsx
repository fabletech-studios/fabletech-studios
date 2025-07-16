'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFirebaseCustomerAuth } from './FirebaseCustomerContext';

interface BadgeSidebarContextType {
  isBadgeSidebarVisible: boolean;
  setBadgeSidebarVisible: (visible: boolean) => void;
}

const BadgeSidebarContext = createContext<BadgeSidebarContextType | undefined>(undefined);

export function BadgeSidebarProvider({ children }: { children: React.ReactNode }) {
  const { customer } = useFirebaseCustomerAuth();
  const [isBadgeSidebarVisible, setIsBadgeSidebarVisible] = useState(true);

  // Load preference from localStorage
  useEffect(() => {
    if (customer) {
      const stored = localStorage.getItem(`badge-sidebar-visible-${customer.uid}`);
      if (stored !== null) {
        setIsBadgeSidebarVisible(stored === 'true');
      }
    }
  }, [customer]);

  const setBadgeSidebarVisible = (visible: boolean) => {
    setIsBadgeSidebarVisible(visible);
    if (customer) {
      localStorage.setItem(`badge-sidebar-visible-${customer.uid}`, visible.toString());
    }
  };

  return (
    <BadgeSidebarContext.Provider value={{ isBadgeSidebarVisible, setBadgeSidebarVisible }}>
      {children}
    </BadgeSidebarContext.Provider>
  );
}

export function useBadgeSidebar() {
  const context = useContext(BadgeSidebarContext);
  if (context === undefined) {
    throw new Error('useBadgeSidebar must be used within a BadgeSidebarProvider');
  }
  return context;
}