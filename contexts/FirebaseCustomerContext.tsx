'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User
} from 'firebase/auth';
import { getFirebaseCustomer, FirebaseCustomer } from '@/lib/firebase/customer-service';

interface CustomerAuthContextType {
  user: User | null;
  customer: FirebaseCustomer | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateCredits: (credits: number) => void;
  refreshCustomer: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function FirebaseCustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<FirebaseCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const initAuth = async () => {
      // Only run on client side
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      // Wait for Firebase auth to be available
      let attempts = 0;
      const maxAttempts = 20;
      
      while (!auth && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!auth) {
        console.warn('Firebase Auth not available after initialization attempts');
        setLoading(false);
        return;
      }

      // Set up auth state listener
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('Auth state changed:', firebaseUser ? firebaseUser.email : 'No user');
        setUser(firebaseUser);
        
        if (firebaseUser) {
          try {
            // Fetch customer data from Firestore
            const customerData = await getFirebaseCustomer(firebaseUser.uid);
            console.log('Customer data loaded:', customerData ? customerData.name : 'No customer data');
            setCustomer(customerData);
            
            // Store token for API calls
            const token = await firebaseUser.getIdToken();
            localStorage.setItem('customerToken', token);
          } catch (error) {
            console.error('Error fetching customer data:', error);
            setCustomer(null);
          }
        } else {
          setCustomer(null);
          localStorage.removeItem('customerToken');
        }
        
        setLoading(false);
      });
    };
    
    initAuth();
    
    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const refreshCustomer = async () => {
    if (user) {
      const customerData = await getFirebaseCustomer(user.uid);
      setCustomer(customerData);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      if (!auth) {
        return { success: false, error: 'Authentication not initialized' };
      }

      // Sign in directly with Firebase Auth on the client
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get customer data from Firestore
      const customerData = await getFirebaseCustomer(firebaseUser.uid);
      if (!customerData) {
        return { success: false, error: 'Customer data not found' };
      }
      
      // Store token for API calls
      const token = await firebaseUser.getIdToken();
      localStorage.setItem('customerToken', token);
      
      // The onAuthStateChanged listener will update the state
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/invalid-credential') {
        return { success: false, error: 'Invalid email or password' };
      }
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      // Use the API for signup since it handles customer document creation
      const res = await fetch('/api/customer/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });

      const data = await res.json();

      if (data.success) {
        // The API creates the Firebase Auth user and Firestore document
        // onAuthStateChanged will detect the new user and update state
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }
    localStorage.removeItem('customerToken');
    setCustomer(null);
    router.push('/');
  };

  const updateCredits = (credits: number) => {
    if (customer) {
      setCustomer({ ...customer, credits });
    }
  };

  return (
    <CustomerAuthContext.Provider value={{ 
      user, 
      customer, 
      loading, 
      login, 
      signup, 
      logout, 
      updateCredits,
      refreshCustomer 
    }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export const useFirebaseCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseCustomerAuth must be used within a FirebaseCustomerAuthProvider');
  }
  return context;
};