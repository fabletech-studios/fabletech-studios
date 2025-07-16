'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import BadgeNotification from '@/components/badges/BadgeNotification';
import { markBadgesAsNotified } from '@/lib/firebase/badge-service';
import { useFirebaseCustomerAuth } from './FirebaseCustomerContext';

interface BadgeNotificationContextType {
  showBadgeNotification: (badgeIds: string[]) => void;
}

const BadgeNotificationContext = createContext<BadgeNotificationContextType | undefined>(undefined);

export const useBadgeNotification = () => {
  const context = useContext(BadgeNotificationContext);
  if (!context) {
    throw new Error('useBadgeNotification must be used within BadgeNotificationProvider');
  }
  return context;
};

export const BadgeNotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [badgeIds, setBadgeIds] = useState<string[]>([]);
  const [isShowing, setIsShowing] = useState(false);
  const { customer } = useFirebaseCustomerAuth();

  const showBadgeNotification = (newBadgeIds: string[]) => {
    if (newBadgeIds.length > 0) {
      setBadgeIds(newBadgeIds);
      setIsShowing(true);
    }
  };

  const handleClose = async () => {
    setIsShowing(false);
    
    // Mark badges as notified
    if (customer && badgeIds.length > 0) {
      await markBadgesAsNotified(customer.uid, badgeIds);
    }
    
    setBadgeIds([]);
  };

  return (
    <BadgeNotificationContext.Provider value={{ showBadgeNotification }}>
      {children}
      {isShowing && (
        <BadgeNotification 
          badgeIds={badgeIds} 
          onClose={handleClose}
        />
      )}
    </BadgeNotificationContext.Provider>
  );
};