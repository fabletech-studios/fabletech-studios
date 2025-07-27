'use client';

import { useEffect, useState } from 'react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import { useRouter } from 'next/navigation';

export default function PurchaseDebugPage() {
  const { customer, user, loading } = useFirebaseCustomerAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  useEffect(() => {
    addLog('Page mounted');
    addLog(`Auth loading: ${loading}`);
    addLog(`User exists: ${!!user}`);
    addLog(`Customer exists: ${!!customer}`);
    
    if (user) {
      addLog(`User email: ${user.email}`);
    }
    
    if (customer) {
      addLog(`Customer name: ${customer.name}`);
      addLog(`Customer credits: ${customer.credits}`);
    }
    
    const token = localStorage.getItem('customerToken');
    addLog(`Customer token exists: ${!!token}`);
    
    // Check if stripePromise loads
    import('@/lib/stripe-client').then(module => {
      addLog(`Stripe module loaded: ${!!module.stripePromise}`);
      if (module.stripePromise) {
        module.stripePromise.then(stripe => {
          addLog(`Stripe instance: ${!!stripe}`);
        }).catch(err => {
          addLog(`Stripe error: ${err}`);
        });
      }
    });
  }, [loading, user, customer]);

  const testPurchaseFlow = async () => {
    addLog('Testing purchase flow...');
    
    if (!customer) {
      addLog('ERROR: No customer!');
      return;
    }
    
    const token = localStorage.getItem('customerToken');
    if (!token) {
      addLog('ERROR: No token!');
      return;
    }
    
    try {
      addLog('Creating checkout session...');
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ packageId: 'starter' }),
      });
      
      addLog(`Response status: ${response.status}`);
      const data = await response.json();
      addLog(`Response data: ${JSON.stringify(data)}`);
      
      if (response.ok && data.sessionId) {
        addLog('✅ Checkout session created successfully!');
        addLog('Would redirect to Stripe checkout...');
      }
    } catch (error: any) {
      addLog(`ERROR: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Purchase Debug Page</h1>
      
      <div className="mb-8 space-y-2">
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        <p>User: {user ? user.email : 'None'}</p>
        <p>Customer: {customer ? customer.name : 'None'}</p>
      </div>
      
      <button
        onClick={testPurchaseFlow}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg mb-4"
        disabled={!customer}
      >
        Test Purchase Flow
      </button>
      
      <button
        onClick={() => router.push('/credits/purchase')}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg mb-4 ml-4"
      >
        Go to Real Purchase Page
      </button>
      
      <div className="bg-gray-900 rounded-lg p-4">
        <h2 className="font-bold mb-2">Debug Logs:</h2>
        <pre className="text-xs font-mono whitespace-pre-wrap">
          {logs.join('\n')}
        </pre>
      </div>
    </div>
  );
}