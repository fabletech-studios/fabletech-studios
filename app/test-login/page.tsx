'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function TestLogin() {
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1]}: ${message}`]);
  };

  const testLogin = async () => {
    addLog('Starting login test...');
    
    try {
      addLog('Calling signIn...');
      const result = await signIn('credentials', {
        email: 'admin@fabletech.com',
        password: 'admin123',
        redirect: false,
      });
      
      addLog(`SignIn result: ${JSON.stringify(result)}`);
      
      if (result?.error) {
        addLog(`Error: ${result.error}`);
      } else if (result?.ok) {
        addLog('Login successful!');
        setTimeout(() => {
          window.location.href = '/manage';
        }, 1000);
      }
    } catch (error) {
      addLog(`Caught error: ${error}`);
    }
  };

  const testDirectAPI = async () => {
    addLog('Testing direct API call...');
    
    try {
      const response = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@fabletech.com',
          password: 'admin123',
          redirect: false,
          csrfToken: await fetch('/api/auth/csrf').then(r => r.json()).then(d => d.csrfToken),
        }),
      });
      
      addLog(`Response status: ${response.status}`);
      const text = await response.text();
      addLog(`Response: ${text.substring(0, 200)}...`);
    } catch (error) {
      addLog(`API error: ${error}`);
    }
  };

  const testSimpleAPI = async () => {
    addLog('Testing simple API endpoint...');
    
    try {
      const response = await fetch('/api/test-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@fabletech.com',
          password: 'admin123',
        }),
      });
      
      const data = await response.json();
      addLog(`Simple API response: ${JSON.stringify(data)}`);
    } catch (error) {
      addLog(`Simple API error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Login Test Page</h1>
      
      <div className="space-y-4 mb-8">
        <button
          onClick={testLogin}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
        >
          Test NextAuth SignIn
        </button>
        
        <button
          onClick={testDirectAPI}
          className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded ml-4"
        >
          Test Direct API
        </button>
        
        <button
          onClick={testSimpleAPI}
          className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded ml-4"
        >
          Test Simple API
        </button>
      </div>
      
      <div className="bg-gray-900 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Logs:</h2>
        <div className="space-y-1 text-sm font-mono">
          {logs.map((log, i) => (
            <div key={i} className="text-gray-300">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}