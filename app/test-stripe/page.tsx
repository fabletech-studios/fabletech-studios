'use client';

import { useEffect, useState } from 'react';
import { stripePromise } from '@/lib/stripe-client';

export default function TestStripePage() {
  const [status, setStatus] = useState('Checking Stripe...');
  const [keyInfo, setKeyInfo] = useState('');

  useEffect(() => {
    const checkStripe = async () => {
      // Check environment variable
      const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      setKeyInfo(`Key loaded: ${key ? 'Yes' : 'No'}, Prefix: ${key?.substring(0, 7) || 'N/A'}`);
      
      // Check Stripe promise
      if (!stripePromise) {
        setStatus('❌ Stripe promise is null');
        return;
      }

      try {
        const stripe = await stripePromise;
        if (stripe) {
          setStatus('✅ Stripe loaded successfully!');
        } else {
          setStatus('❌ Stripe is null after loading');
        }
      } catch (error) {
        setStatus(`❌ Error loading Stripe: ${error}`);
      }
    };

    checkStripe();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Stripe Test Page</h1>
      <div className="space-y-2">
        <p>Status: {status}</p>
        <p>Environment: {keyInfo}</p>
        <p>Direct check: {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Key exists' : 'Key missing'}</p>
      </div>
    </div>
  );
}