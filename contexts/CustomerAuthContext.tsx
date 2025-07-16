'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Customer {
  id: string;
  email: string;
  name: string;
  credits: number;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateCredits: (credits: number) => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('customerToken');
    if (token) {
      fetchCustomerData(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCustomerData = async (token: string) => {
    try {
      const res = await fetch('/api/customer/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
      } else {
        localStorage.removeItem('customerToken');
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      localStorage.removeItem('customerToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('customerToken', data.token);
        setCustomer(data.customer);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const res = await fetch('/api/customer/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('customerToken', data.token);
        setCustomer(data.customer);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
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
    <CustomerAuthContext.Provider value={{ customer, loading, login, signup, logout, updateCredits }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};