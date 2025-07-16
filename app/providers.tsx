'use client';

import { SessionProvider } from 'next-auth/react';
import { FirebaseCustomerAuthProvider } from '@/contexts/FirebaseCustomerContext';
import { BadgeNotificationProvider } from '@/contexts/BadgeNotificationContext';
import { BadgeSidebarProvider } from '@/contexts/BadgeSidebarContext';
import BadgeSidebarWrapper from '@/components/BadgeSidebarWrapper';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <FirebaseCustomerAuthProvider>
        <BadgeSidebarProvider>
          <BadgeNotificationProvider>
            <BadgeSidebarWrapper>
              {children}
            </BadgeSidebarWrapper>
          </BadgeNotificationProvider>
        </BadgeSidebarProvider>
      </FirebaseCustomerAuthProvider>
    </SessionProvider>
  );
}