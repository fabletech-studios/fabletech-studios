'use client';

import { useState, useEffect } from 'react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import { auth } from '@/lib/firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function DebugAuthPage() {
  const { user, customer, loading, login } = useFirebaseCustomerAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<any>({});

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  useEffect(() => {
    addLog('Debug page loaded');
    addLog(`Firebase auth available: ${!!auth}`);
    addLog(`User: ${user ? user.email : 'null'}`);
    addLog(`Customer: ${customer ? customer.name : 'null'}`);
    addLog(`Loading: ${loading}`);
  }, [user, customer, loading]);

  const testDirectLogin = async () => {
    try {
      addLog('Testing direct Firebase login...');
      if (!auth) {
        addLog('ERROR: Firebase auth not available');
        return;
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, 'newuser@example.com', 'password123');
      addLog(`SUCCESS: Logged in as ${userCredential.user.email}`);
      setTestResults(prev => ({ ...prev, directLogin: 'SUCCESS' }));
    } catch (error: any) {
      addLog(`ERROR: ${error.message}`);
      setTestResults(prev => ({ ...prev, directLogin: 'FAILED' }));
    }
  };

  const testContextLogin = async () => {
    try {
      addLog('Testing context login...');
      const result = await login('newuser@example.com', 'password123');
      addLog(`Context login result: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.error || ''}`);
      setTestResults(prev => ({ ...prev, contextLogin: result.success ? 'SUCCESS' : 'FAILED' }));
    } catch (error: any) {
      addLog(`ERROR: ${error.message}`);
      setTestResults(prev => ({ ...prev, contextLogin: 'FAILED' }));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Firebase Auth Debug</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Current State</h2>
          <div className="bg-gray-900 p-4 rounded">
            <p><strong>Firebase Auth:</strong> {auth ? 'Available' : 'Not Available'}</p>
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {user ? user.email : 'None'}</p>
            <p><strong>Customer:</strong> {customer ? `${customer.name} (${customer.credits} credits)` : 'None'}</p>
          </div>
          
          <h2 className="text-xl font-semibold mb-4 mt-6">Tests</h2>
          <div className="space-y-4">
            <button 
              onClick={testDirectLogin}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            >
              Test Direct Firebase Login
            </button>
            <button 
              onClick={testContextLogin}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
            >
              Test Context Login
            </button>
          </div>
          
          <h2 className="text-xl font-semibold mb-4 mt-6">Test Results</h2>
          <div className="bg-gray-900 p-4 rounded">
            <pre>{JSON.stringify(testResults, null, 2)}</pre>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          <div className="bg-gray-900 p-4 rounded h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-sm mb-1 font-mono">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}