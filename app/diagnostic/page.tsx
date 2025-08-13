'use client';

import { useState, useEffect } from 'react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';

export default function DiagnosticPage() {
  const { customer } = useFirebaseCustomerAuth();
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('customerToken');
      if (!token) {
        setError('No auth token found. Please log in.');
        return;
      }

      const response = await fetch('/api/test/diagnose-customer', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setDiagnosticData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customer) {
      runDiagnostic();
    }
  }, [customer]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Customer Diagnostic Tool</h1>
        
        {!customer && (
          <div className="bg-red-900 p-4 rounded mb-4">
            <p>Please log in to run diagnostics</p>
          </div>
        )}

        {customer && (
          <div className="bg-gray-900 p-6 rounded mb-4">
            <h2 className="text-xl font-semibold mb-4">Current Customer State</h2>
            <div className="space-y-2">
              <p><strong>Email:</strong> {customer.email}</p>
              <p><strong>Credits:</strong> {customer.credits}</p>
              <p><strong>UID:</strong> {customer.uid}</p>
              <p><strong>Unlocked Episodes:</strong> {customer.unlockedEpisodes?.length || 0}</p>
            </div>
          </div>
        )}

        <button 
          onClick={runDiagnostic}
          disabled={loading || !customer}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded font-semibold mb-6"
        >
          {loading ? 'Running Diagnostic...' : 'Run Diagnostic'}
        </button>

        {error && (
          <div className="bg-red-900 p-4 rounded mb-4">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {diagnosticData && (
          <div className="bg-gray-900 p-6 rounded">
            <h2 className="text-xl font-semibold mb-4">Diagnostic Results</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-yellow-400">
                Status: {diagnosticData.duplicate_detection}
              </h3>
              {diagnosticData.duplicate_detection === 'DUPLICATES_FOUND' && (
                <p className="text-red-400">⚠️ Multiple customer documents found! This is causing the unlock issues.</p>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Token Information</h3>
              <pre className="bg-black p-4 rounded overflow-x-auto text-sm">
                {JSON.stringify(diagnosticData.token_info, null, 2)}
              </pre>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Primary UID Being Used</h3>
              <p className="font-mono bg-black p-2 rounded">{diagnosticData.primary_uid}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Customer Documents Found: {diagnosticData.customers_found}</h3>
              {diagnosticData.customers?.map((cust: any, index: number) => (
                <div key={index} className="bg-black p-4 rounded mb-2">
                  <p><strong>Source:</strong> {cust.source}</p>
                  <p><strong>UID:</strong> {cust.uid}</p>
                  <p><strong>Email:</strong> {cust.email}</p>
                  <p><strong>Credits:</strong> {cust.credits}</p>
                  <p><strong>Unlocked Episodes:</strong> {cust.unlocked_episodes}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Full Response</h3>
              <pre className="bg-black p-4 rounded overflow-x-auto text-xs">
                {JSON.stringify(diagnosticData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}