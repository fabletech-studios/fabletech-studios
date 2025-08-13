'use client';

import { useState, useEffect } from 'react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';

export default function AdminDataPage() {
  const { customer } = useFirebaseCustomerAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllCustomers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('customerToken');
      if (!token) {
        setError('No auth token found. Please log in.');
        return;
      }

      const response = await fetch('/api/admin/list-all-customers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customer && customer.uid === 'IIP8rWwMCeZ62Svix1lcZPyRkRj2') {
      fetchAllCustomers();
    }
  }, [customer]);

  if (!customer || customer.uid !== 'IIP8rWwMCeZ62Svix1lcZPyRkRj2') {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Admin Data View</h1>
          <p className="text-red-400">This page is only available for authorized users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">All Customer Data</h1>
        
        <button 
          onClick={fetchAllCustomers}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded font-semibold mb-6"
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>

        {error && (
          <div className="bg-red-900 p-4 rounded mb-4">
            <p className="font-bold">Error: {error}</p>
          </div>
        )}

        {data && (
          <>
            <div className="bg-gray-900 p-6 rounded mb-6">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <p>Total Customers: {data.totalCustomers}</p>
              <p>Customers with Purchases (>100 credits): {data.customersWithPurchases}</p>
              <p>Your Accounts Found: {data.yourAccounts?.length || 0}</p>
            </div>

            {data.yourAccounts && data.yourAccounts.length > 0 && (
              <div className="bg-yellow-900 p-6 rounded mb-6">
                <h2 className="text-xl font-semibold mb-4">YOUR ACCOUNTS (oryshchynskyy@gmail.com)</h2>
                {data.yourAccounts.map((acc: any, i: number) => (
                  <div key={i} className="mb-4 p-4 bg-black rounded">
                    <p><strong>UID:</strong> {acc.uid}</p>
                    <p><strong>Credits:</strong> {acc.credits}</p>
                    <p><strong>Unlocked Episodes:</strong> {acc.unlockedEpisodes}</p>
                    <p><strong>Auth Provider:</strong> {acc.authProvider}</p>
                    <p><strong>Created:</strong> {acc.createdAt}</p>
                    <p><strong>Updated:</strong> {acc.updatedAt}</p>
                    {acc.unlockedEpisodeDetails && acc.unlockedEpisodeDetails.length > 0 && (
                      <div className="mt-2">
                        <p><strong>Episode Details:</strong></p>
                        {acc.unlockedEpisodeDetails.map((ep: any, j: number) => (
                          <p key={j} className="ml-4">- Episode {ep.episodeNumber} (Series: {ep.seriesId})</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="bg-gray-900 p-6 rounded mb-6">
              <h2 className="text-xl font-semibold mb-4">All Customers (sorted by credits)</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Credits</th>
                      <th className="text-left p-2">Unlocked</th>
                      <th className="text-left p-2">UID</th>
                      <th className="text-left p-2">Provider</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.allCustomers?.map((customer: any, i: number) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{customer.email}</td>
                        <td className="p-2 font-bold">{customer.credits}</td>
                        <td className="p-2">{customer.unlockedEpisodes}</td>
                        <td className="p-2 text-xs font-mono">{customer.uid.substring(0, 10)}...</td>
                        <td className="p-2">{customer.authProvider}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {data.recentPurchases && data.recentPurchases.length > 0 && (
              <div className="bg-gray-900 p-6 rounded">
                <h2 className="text-xl font-semibold mb-4">Recent Purchases</h2>
                {data.recentPurchases.map((purchase: any, i: number) => (
                  <div key={i} className="mb-2">
                    <p>Customer: {purchase.customerId} - {purchase.credits} credits for ${purchase.amount/100}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}