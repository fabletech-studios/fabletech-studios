'use client';

import { SessionProvider } from 'next-auth/react';
import { FirebaseCustomerAuthProvider } from '@/contexts/FirebaseCustomerContext';
import { BadgeNotificationProvider } from '@/contexts/BadgeNotificationContext';
import { BadgeSidebarProvider } from '@/contexts/BadgeSidebarContext';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import BadgeSidebarWrapper from '@/components/BadgeSidebarWrapper';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <FirebaseCustomerAuthProvider>
        <NotificationProvider>
          <BadgeSidebarProvider>
            <BadgeNotificationProvider>
              <BadgeSidebarWrapper>
                {children}
              </BadgeSidebarWrapper>
            </BadgeNotificationProvider>
          </BadgeSidebarProvider>
        </NotificationProvider>
      </FirebaseCustomerAuthProvider>
    </SessionProvider>
  );
}