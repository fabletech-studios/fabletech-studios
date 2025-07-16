'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { 
  createCustomer, 
  signInCustomer, 
  signOutCustomer, 
  sendPasswordReset,
  getCurrentCustomer,
  onAuthStateChange,
  CustomerData
} from '@/lib/firebase/auth-service';

interface FirebaseAuthContextType {
  user: User | null;
  customer: CustomerData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateCredits: (credits: number) => void;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch customer data from Firestore
        const customerData = await getCurrentCustomer(firebaseUser);
        setCustomer(customerData);
      } else {
        setCustomer(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await signInCustomer(email, password);
      
      if (result.success && result.customerData) {
        setCustomer(result.customerData);
        // Store token for API calls if needed
        if (result.token) {
          localStorage.setItem('firebaseToken', result.token);
        }
        return { success: true };
      }
      
      return { success: false, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const result = await createCustomer(email, password, name);
      
      if (result.success && result.customerData) {
        setCustomer(result.customerData);
        // Store token for API calls if needed
        if (result.token) {
          localStorage.setItem('firebaseToken', result.token);
        }
        return { success: true };
      }
      
      return { success: false, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message || 'Signup failed' };
    }
  };

  const logout = async () => {
    try {
      await signOutCustomer();
      localStorage.removeItem('firebaseToken');
      setUser(null);
      setCustomer(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const result = await sendPasswordReset(email);
      return result;
    } catch (error: any) {
      return { success: false, error: error.message || 'Password reset failed' };
    }
  };

  const updateCredits = (credits: number) => {
    if (customer) {
      setCustomer({ ...customer, credits });
    }
  };

  return (
    <FirebaseAuthContext.Provider 
      value={{ 
        user, 
        customer, 
        loading, 
        login, 
        signup, 
        logout, 
        resetPassword, 
        updateCredits 
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
};