'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RecoverEpisodesPage() {
  const [customerId, setCustomerId] = useState('Uqj5R014tGSLA0iUIW7rhEkjDwI3');
  const [seriesId, setSeriesId] = useState('series-1752726210472-bo9ch9nhe');
  const [episodeNumbers, setEpisodeNumbers] = useState('3,4,5');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRecover = async () => {
    setLoading(true);
    setResult(null);

    const token = localStorage.getItem('customerToken');
    if (!token) {
      setResult({ error: 'Please log in as admin' });
      setLoading(false);
      return;
    }

    const episodes = episodeNumbers.split(',').map(num => ({
      seriesId,
      episodeNumber: parseInt(num.trim())
    }));

    try {
      const response = await fetch('/api/admin/recover-episodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId,
          episodes
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin: Recover Lost Episodes</h1>
        
        <div className="bg-gray-900 p-6 rounded-lg mb-6">
          <p className="text-sm text-gray-400 mb-4">
            Use this tool to restore episodes that were unlocked but not saved to the database 
            due to the Firebase security rules issue.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Customer ID</label>
              <input
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 rounded border border-gray-700 focus:border-red-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Series ID</label>
              <input
                type="text"
                value={seriesId}
                onChange={(e) => setSeriesId(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 rounded border border-gray-700 focus:border-red-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Episode Numbers (comma-separated)</label>
              <input
                type="text"
                value={episodeNumbers}
                onChange={(e) => setEpisodeNumbers(e.target.value)}
                placeholder="3,4,5"
                className="w-full px-4 py-2 bg-gray-800 rounded border border-gray-700 focus:border-red-600 focus:outline-none"
              />
            </div>

            <button
              onClick={handleRecover}
              disabled={loading}
              className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded font-semibold"
            >
              {loading ? 'Processing...' : 'Recover Episodes'}
            </button>
          </div>
        </div>

        {result && (
          <div className={`p-6 rounded-lg ${result.error ? 'bg-red-900/20 border border-red-700' : 'bg-green-900/20 border border-green-700'}`}>
            {result.error ? (
              <div>
                <p className="font-semibold text-red-400 mb-2">Error</p>
                <p>{result.error}</p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-green-400 mb-2">Success!</p>
                <p>{result.message}</p>
                {result.addedEpisodes && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-400">Added episodes:</p>
                    <ul className="list-disc list-inside">
                      {result.addedEpisodes.map((ep: any, i: number) => (
                        <li key={i}>Episode {ep.episodeNumber}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="mt-2 text-sm">Total unlocked: {result.totalUnlocked}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}