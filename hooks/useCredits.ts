'use client';

import { useState, useEffect } from 'react';

interface CreditPurchaseOption {
  id: string;
  credits: number;
  price: number;
  bonus?: number;
  popular?: boolean;
}

export const creditOptions: CreditPurchaseOption[] = [
  { id: 'starter', credits: 50, price: 4.99 },
  { id: 'popular', credits: 100, price: 9.99, popular: true },
  { id: 'premium', credits: 200, price: 19.99 },
];

export function useCredits() {
  const [credits, setCredits] = useState(100); // Start with 100 free credits
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch from API/database
    const storedCredits = localStorage.getItem('userCredits');
    if (storedCredits) {
      setCredits(parseInt(storedCredits));
    }
    setLoading(false);
  }, []);

  const addCredits = (amount: number) => {
    const newTotal = credits + amount;
    setCredits(newTotal);
    localStorage.setItem('userCredits', newTotal.toString());
  };

  const spendCredits = (amount: number): boolean => {
    if (credits >= amount) {
      const newTotal = credits - amount;
      setCredits(newTotal);
      localStorage.setItem('userCredits', newTotal.toString());
      return true;
    }
    return false;
  };

  return {
    credits,
    loading,
    addCredits,
    spendCredits,
    creditOptions,
  };
}