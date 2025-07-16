'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [jsWorking, setJsWorking] = useState(false);
  const { data: session, status } = useSession();
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };
  
  useEffect(() => {
    setJsWorking(true);
    addLog('JavaScript loaded successfully');
    addLog(`Session status: ${status}`);
    addLog(`Session data: ${JSON.stringify(session)}`);
    
    // Check for eval availability
    try {
      const testEval = new Function('return true');
      addLog('Function constructor works (no CSP eval restriction)');
    } catch (e) {
      addLog(`CSP eval restriction detected: ${e.message}`);
    }
  }, [session, status]);
  
  const testBasicJS = () => {
    addLog('Button clicked - JavaScript event handling works');
    alert('JavaScript is working!');
  };
  
  const testSignIn = async () => {
    addLog('Starting sign in test...');
    try {
      const result = await signIn('credentials', {
        email: 'admin@fabletech.com',
        password: 'admin123',
        redirect: false,
      });
      addLog(`Sign in result: ${JSON.stringify(result)}`);
    } catch (error) {
      addLog(`Sign in error: ${error.message}`);
    }
  };
  
  const testFetch = async () => {
    addLog('Testing fetch API...');
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      addLog(`Session API response: ${JSON.stringify(data)}`);
    } catch (error) {
      addLog(`Fetch error: ${error.message}`);
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Debug Page</h1>
      
      <div className="space-y-4 mb-8">
        <div className="bg-gray-900 p-4 rounded">
          <h2 className="font-bold mb-2">Status Checks:</h2>
          <p>JavaScript Loaded: {jsWorking ? '✅ Yes' : '❌ No'}</p>
          <p>Session Status: {status}</p>
          <p>Session User: {session?.user?.email || 'Not logged in'}</p>
        </div>
        
        <div className="space-x-2">
          <button
            onClick={testBasicJS}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Test Basic JS
          </button>
          
          <button
            onClick={testSignIn}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
          >
            Test Sign In
          </button>
          
          <button
            onClick={testFetch}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
          >
            Test Fetch
          </button>
        </div>
      </div>
      
      <div className="bg-gray-900 p-4 rounded">
        <h2 className="font-bold mb-2">Debug Logs:</h2>
        <div className="font-mono text-sm space-y-1">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="text-gray-300">{log}</div>
            ))
          )}
        </div>
      </div>
      
      <noscript>
        <div className="mt-4 p-4 bg-red-900 rounded">
          JavaScript is disabled in your browser!
        </div>
      </noscript>
    </div>
  );
}