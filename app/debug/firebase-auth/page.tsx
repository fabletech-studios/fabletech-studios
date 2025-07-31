'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader, RefreshCw, Copy } from 'lucide-react';

export default function FirebaseAuthDebugPage() {
  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    // Gather client-side data
    const data = {
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
      },
      location: {
        href: window.location.href,
        origin: window.location.origin,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
      },
      firebase: {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      },
      cookies: document.cookie ? 'Present' : 'None',
      localStorage: {
        hasAuthData: !!localStorage.getItem('firebase:authUser'),
      },
    };
    setClientData(data);
    
    // Load initial debug data
    loadDebugData();
  }, []);

  const loadDebugData = async () => {
    try {
      const response = await fetch('/api/debug/firebase-auth');
      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      console.error('Failed to load debug data:', error);
    }
  };

  const runFirebaseTest = async () => {
    setLoading(true);
    setTestResults(null);
    
    try {
      const response = await fetch('/api/debug/firebase-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setTestResults(data);
    } catch (error: any) {
      setTestResults({
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatJson = (obj: any) => JSON.stringify(obj, null, 2);

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Firebase Auth Debug Tool</h1>
        
        {/* Quick Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="font-semibold mb-2">Domain Status</h3>
            <div className="text-sm space-y-1">
              <div>Current: {clientData?.location?.hostname}</div>
              <div>Protocol: {clientData?.location?.protocol}</div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="font-semibold mb-2">Firebase Config</h3>
            <div className="text-sm space-y-1">
              <div>Project: {clientData?.firebase?.projectId}</div>
              <div>Auth Domain: {clientData?.firebase?.authDomain}</div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="font-semibold mb-2">API Key</h3>
            <div className="text-sm">
              <code className="text-xs break-all">
                {clientData?.firebase?.apiKey?.substring(0, 20)}...
              </code>
            </div>
          </div>
        </div>

        {/* Test Firebase Auth */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Test Firebase Auth API</h2>
            <button
              onClick={runFirebaseTest}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Run Test
            </button>
          </div>
          
          {testResults && (
            <div className="space-y-4">
              {/* Diagnosis */}
              {testResults.diagnosis && (
                <div className={`p-4 rounded-lg ${
                  testResults.diagnosis.status === 'blocked' ? 'bg-red-900/20 border border-red-800' :
                  testResults.diagnosis.status === 'working' ? 'bg-green-900/20 border border-green-800' :
                  'bg-yellow-900/20 border border-yellow-800'
                }`}>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    {testResults.diagnosis.status === 'blocked' ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : testResults.diagnosis.status === 'working' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                    Status: {testResults.diagnosis.status}
                  </h4>
                  
                  {testResults.diagnosis.issues.length > 0 && (
                    <div className="mb-3">
                      <h5 className="font-medium mb-1">Issues:</h5>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {testResults.diagnosis.issues.map((issue: string, i: number) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {testResults.diagnosis.solutions.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-1">Solutions:</h5>
                      <ol className="list-decimal list-inside text-sm space-y-1">
                        {testResults.diagnosis.solutions.map((solution: string, i: number) => (
                          <li key={i}>{solution}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
              
              {/* Raw Response */}
              <details className="bg-black/50 rounded-lg p-4">
                <summary className="cursor-pointer font-medium">Raw Test Response</summary>
                <pre className="mt-4 text-xs overflow-auto">
                  {formatJson(testResults)}
                </pre>
              </details>
            </div>
          )}
        </div>

        {/* Detailed Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client-Side Data */}
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Client-Side Data</h3>
              <button
                onClick={() => copyToClipboard(formatJson(clientData))}
                className="p-2 hover:bg-gray-800 rounded"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <pre className="text-xs overflow-auto bg-black/50 rounded p-3">
              {formatJson(clientData)}
            </pre>
          </div>
          
          {/* Server-Side Data */}
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Server-Side Data</h3>
              <button
                onClick={() => copyToClipboard(formatJson(debugData))}
                className="p-2 hover:bg-gray-800 rounded"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <pre className="text-xs overflow-auto bg-black/50 rounded p-3">
              {formatJson(debugData)}
            </pre>
          </div>
        </div>

        {/* Action Items */}
        <div className="mt-8 bg-blue-900/20 border border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Troubleshooting Steps</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              <strong>Google Cloud Console:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">API Credentials</a></li>
                <li>Find your Firebase API key</li>
                <li>Click on it and check "Website restrictions"</li>
                <li>Add: https://www.fabletech.studio/* and https://fabletech.studio/*</li>
              </ul>
            </li>
            <li>
              <strong>Firebase Console:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Go to Authentication → Settings → Authorized domains</li>
                <li>Ensure both www.fabletech.studio and fabletech.studio are listed</li>
                <li>Try removing and re-adding them</li>
              </ul>
            </li>
            <li>
              <strong>Clear Browser Data:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Clear all cookies for fabletech.studio</li>
                <li>Clear localStorage</li>
                <li>Try incognito/private mode</li>
              </ul>
            </li>
            <li>
              <strong>Wait for Propagation:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Firebase domain changes can take 5-10 minutes</li>
                <li>API key restrictions can take up to 5 minutes</li>
              </ul>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}