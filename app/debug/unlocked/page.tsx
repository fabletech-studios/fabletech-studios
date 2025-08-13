'use client';

import { useState, useEffect } from 'react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import Link from 'next/link';
import { ArrowLeft, Lock, Unlock, AlertCircle } from 'lucide-react';

export default function DebugUnlockedPage() {
  const { customer } = useFirebaseCustomerAuth();
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customer) {
      setLoading(false);
      return;
    }

    const fetchDebugData = async () => {
      try {
        const token = localStorage.getItem('customerToken');
        if (!token) {
          setError('No auth token found');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/debug/check-unlocked', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setDebugData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDebugData();
  }, [customer]);

  if (!customer) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Debug: Unlocked Episodes</h1>
          <div className="bg-red-900/20 border border-red-700 p-4 rounded">
            <p>Please log in to view debug information</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Debug: Unlocked Episodes</h1>
          <p>Loading debug data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Debug: Unlocked Episodes</h1>
          <div className="bg-red-900/20 border border-red-700 p-4 rounded">
            <p>Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-8">Debug: Unlocked Episodes</h1>

        {/* Customer Info */}
        <div className="bg-gray-900 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Customer Information
          </h2>
          <div className="space-y-2">
            <p><strong>UID:</strong> <code className="bg-gray-800 px-2 py-1 rounded">{debugData?.uid}</code></p>
            <p><strong>Credits:</strong> {debugData?.credits}</p>
            <p><strong>Total Unlocked:</strong> {debugData?.unlockedCount} episodes</p>
            <p><strong>Data Source:</strong> {debugData?.source}</p>
          </div>
        </div>

        {/* Unlocked Episodes List */}
        <div className="bg-gray-900 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Unlock className="w-5 h-5 text-green-500" />
            Unlocked Episodes ({debugData?.unlockedCount || 0})
          </h2>
          
          {debugData?.unlockedEpisodesList && debugData.unlockedEpisodesList.length > 0 ? (
            <div className="space-y-2">
              {debugData.unlockedEpisodesList.map((episode: string, index: number) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-800 rounded">
                  <Unlock className="w-4 h-4 text-green-500" />
                  <code>{episode}</code>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <Lock className="w-5 h-5" />
              <p>No unlocked episodes found in database</p>
            </div>
          )}
        </div>

        {/* Raw Data */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Raw Episode Data</h2>
          <pre className="bg-gray-800 p-4 rounded overflow-x-auto text-xs">
            {JSON.stringify(debugData?.unlockedEpisodes || [], null, 2)}
          </pre>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700 rounded">
          <p className="text-sm">
            <strong>Note:</strong> If episodes are missing here but you remember unlocking them, 
            they may have been lost due to the Firebase security rules issue. The credits were 
            deducted but the episodes weren't saved to the database.
          </p>
        </div>
      </div>
    </div>
  );
}