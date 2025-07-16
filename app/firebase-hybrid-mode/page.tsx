'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, Database, Cloud, Users } from 'lucide-react';
import { checkFirestoreConnection, checkStorageConnection } from '@/lib/firebase/connection-check';

export default function HybridModePage() {
  const [hybridEnabled, setHybridEnabled] = useState(
    typeof window !== 'undefined' && localStorage.getItem('skipFirebaseAuth') === 'true'
  );
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testHybridSetup = async () => {
    setTesting(true);
    const testResults = {
      firestore: false,
      storage: false,
      timestamp: new Date().toISOString()
    };

    try {
      // Test Firestore
      testResults.firestore = await checkFirestoreConnection();
      
      // Test Storage
      testResults.storage = await checkStorageConnection();
      
      setResults(testResults);
    } catch (error) {
      console.error('Hybrid test error:', error);
    }
    
    setTesting(false);
  };

  const toggleHybridMode = () => {
    const newState = !hybridEnabled;
    setHybridEnabled(newState);
    
    if (newState) {
      localStorage.setItem('skipFirebaseAuth', 'true');
      localStorage.setItem('authMode', 'hybrid');
    } else {
      localStorage.removeItem('skipFirebaseAuth');
      localStorage.removeItem('authMode');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Firebase Hybrid Mode</h1>

        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">What is Hybrid Mode?</h2>
          <p className="text-gray-300 mb-4">
            Hybrid mode allows you to use local authentication (avoiding googleapis.com) 
            while still leveraging Firebase Firestore for data storage and Firebase Storage for media files.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <Users className="w-8 h-8 text-blue-400 mb-2" />
              <h3 className="font-semibold mb-1">Local Auth</h3>
              <p className="text-sm text-gray-400">
                User authentication handled locally, no googleapis.com needed
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <Database className="w-8 h-8 text-green-400 mb-2" />
              <h3 className="font-semibold mb-1">Firestore Data</h3>
              <p className="text-sm text-gray-400">
                Series, episodes, and user data stored in Firestore
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <Cloud className="w-8 h-8 text-purple-400 mb-2" />
              <h3 className="font-semibold mb-1">Firebase Storage</h3>
              <p className="text-sm text-gray-400">
                Media files hosted on Firebase Storage with CDN
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Hybrid Mode Status</h3>
              <p className="text-sm text-gray-400">
                {hybridEnabled ? 'Enabled - Using local auth + Firebase data' : 'Disabled - Using full Firebase'}
              </p>
            </div>
            
            <button
              onClick={toggleHybridMode}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                hybridEnabled 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {hybridEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <button
            onClick={testHybridSetup}
            disabled={testing}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-lg font-semibold"
          >
            {testing ? 'Testing Connections...' : 'Test Firestore & Storage Connection'}
          </button>
        </div>

        {results && (
          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Connection Test Results</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Firestore Database</span>
                {results.firestore ? (
                  <span className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-5 h-5" /> Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5" /> Not Connected
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span>Firebase Storage</span>
                {results.storage ? (
                  <span className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-5 h-5" /> Available
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5" /> Not Available
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-300 mb-2">✨ Benefits of Hybrid Mode</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-200">
            <li>Works around network restrictions blocking googleapis.com</li>
            <li>Still get Firebase's scalable database and CDN for media</li>
            <li>Can migrate to full Firebase later when network allows</li>
            <li>All business features remain functional</li>
          </ul>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-300 mb-2">⚠️ Limitations</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-200">
            <li>No Firebase Auth features (social login, email verification)</li>
            <li>Password resets handled locally (no email)</li>
            <li>Admin SDK features limited</li>
            <li>Some real-time features may be affected</li>
          </ul>
        </div>

        <div className="mt-8 text-center space-y-2">
          <a 
            href="/firebase-test"
            className="inline-block text-sm text-gray-400 hover:text-white"
          >
            ← Back to Firebase Test
          </a>
          <br />
          <a 
            href="/"
            className="inline-block text-sm text-gray-400 hover:text-white"
          >
            Go to Home
          </a>
        </div>
      </div>
    </div>
  );
}