'use client';

import { useState } from 'react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import { useRouter } from 'next/navigation';

export default function RestorePage() {
  const { customer } = useFirebaseCustomerAuth();
  const router = useRouter();
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRestore = async () => {
    setRestoring(true);
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('customerToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      const response = await fetch('/api/admin/restore-customer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          credits: 750, // Your approximate credit amount
          unlockedEpisodes: [
            { seriesId: 'series-1752726210472-bo9ch9nhe', episodeNumber: 2, unlockedAt: new Date() },
            { seriesId: 'series-1752726210472-bo9ch9nhe', episodeNumber: 3, unlockedAt: new Date() },
            { seriesId: 'series-1752726210472-bo9ch9nhe', episodeNumber: 4, unlockedAt: new Date() },
            { seriesId: 'series-1752726210472-bo9ch9nhe', episodeNumber: 5, unlockedAt: new Date() },
            // Add all episodes you remember unlocking
          ]
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Success! Your account has been restored. Refreshing...');
        setTimeout(() => {
          window.location.href = '/profile';
        }, 2000);
      } else {
        throw new Error(data.error || 'Restore failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRestoring(false);
    }
  };

  if (!customer || customer.uid !== 'IIP8rWwMCeZ62Svix1lcZPyRkRj2') {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Emergency Restore</h1>
          <p className="text-red-400">This page is only available for authorized users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Emergency Account Restore</h1>
        
        <div className="bg-gray-900 p-6 rounded mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <p><strong>Email:</strong> {customer.email}</p>
          <p><strong>Current Credits:</strong> {customer.credits}</p>
          <p><strong>Unlocked Episodes:</strong> {customer.unlockedEpisodes?.length || 0}</p>
        </div>

        <div className="bg-yellow-900 p-6 rounded mb-6">
          <h2 className="text-xl font-semibold mb-4">Will Restore To:</h2>
          <p><strong>Credits:</strong> 750</p>
          <p><strong>Unlocked Episodes:</strong> Episodes 2-5 of your series</p>
          <p className="mt-4 text-sm">Note: Adjust the restore endpoint if you need different values</p>
        </div>

        <button
          onClick={handleRestore}
          disabled={restoring}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-8 py-4 rounded-lg font-bold text-lg w-full"
        >
          {restoring ? 'Restoring...' : 'RESTORE MY ACCOUNT'}
        </button>

        {message && (
          <div className="mt-4 p-4 bg-green-900 rounded">
            <p className="font-bold">{message}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-900 rounded">
            <p className="font-bold">Error: {error}</p>
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-800 rounded">
          <p className="text-sm">This emergency restore will:</p>
          <ul className="list-disc list-inside text-sm mt-2">
            <li>Set your credits to 750</li>
            <li>Unlock episodes 2-5 of your series</li>
            <li>Preserve your account UID and email</li>
          </ul>
        </div>
      </div>
    </div>
  );
}