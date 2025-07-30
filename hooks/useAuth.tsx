'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getFirebaseCustomer } from '@/lib/firebase/customer-service';

interface AuthContextType {
  user: User | null;
  customer: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  customer: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const customerData = await getFirebaseCustomer(user.uid);
          setCustomer(customerData);
        } catch (error) {
          console.error('Error fetching customer data:', error);
          setCustomer(null);
        }
      } else {
        setCustomer(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, customer, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}