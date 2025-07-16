'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function FirebaseAuthDirectTest() {
  const [email, setEmail] = useState('test@firebase.com');
  const [password, setPassword] = useState('testpass123');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [networkTest, setNetworkTest] = useState<any>(null);

  useEffect(() => {
    // Listen for auth state changes
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        addTestResult('Auth State Changed', user ? `User: ${user.email}` : 'No user', 'info');
      });
      return () => unsubscribe();
    } else {
      addTestResult('Firebase Auth', 'Auth not initialized', 'error');
    }
  }, []);

  useEffect(() => {
    // Test network connectivity to Firebase domains
    testNetworkConnectivity();
  }, []);

  const addTestResult = (test: string, result: string, status: 'success' | 'error' | 'info' | 'warning') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { test, result, status, timestamp }]);
  };

  const testNetworkConnectivity = async () => {
    const domains = [
      'https://identitytoolkit.googleapis.com',
      'https://securetoken.googleapis.com',
      'https://www.googleapis.com',
      'https://firebaseapp.com'
    ];

    const results: any = {};
    
    for (const domain of domains) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(domain, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        results[domain] = { status: 'reachable', code: response.status || 'OK' };
      } catch (error: any) {
        results[domain] = { 
          status: 'failed', 
          error: error.name === 'AbortError' ? 'Timeout' : error.message 
        };
      }
    }
    
    setNetworkTest(results);
  };

  const testCreateUser = async () => {
    if (!auth) {
      addTestResult('Create User', 'Firebase Auth not initialized', 'error');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      addTestResult('Create User', `Success! UID: ${userCredential.user.uid}`, 'success');
      addTestResult('User Email', userCredential.user.email || 'No email', 'info');
    } catch (error: any) {
      addTestResult('Create User', `Error: ${error.code} - ${error.message}`, 'error');
      console.error('Full error:', error);
    }
    setLoading(false);
  };

  const testSignIn = async () => {
    if (!auth) {
      addTestResult('Sign In', 'Firebase Auth not initialized', 'error');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      addTestResult('Sign In', `Success! UID: ${userCredential.user.uid}`, 'success');
    } catch (error: any) {
      addTestResult('Sign In', `Error: ${error.code} - ${error.message}`, 'error');
      console.error('Full error:', error);
    }
    setLoading(false);
  };

  const testSignOut = async () => {
    if (!auth) {
      addTestResult('Sign Out', 'Firebase Auth not initialized', 'error');
      return;
    }

    setLoading(true);
    try {
      await signOut(auth);
      addTestResult('Sign Out', 'Success!', 'success');
    } catch (error: any) {
      addTestResult('Sign Out', `Error: ${error.code} - ${error.message}`, 'error');
    }
    setLoading(false);
  };

  const compareWithLocalAuth = () => {
    const comparison = {
      'Firebase Auth': {
        'Setup Complexity': 'Medium - Requires Firebase project',
        'Network Dependency': 'Yes - Requires internet',
        'User Management': 'Built-in UI & admin SDK',
        'Security': 'Enterprise-grade',
        'Scalability': 'Unlimited users',
        'Cost': 'Free up to 50k MAU',
        'Features': 'Email verification, OAuth, MFA',
        'Current Status': auth ? 'Initialized' : 'Not initialized'
      },
      'Local Auth': {
        'Setup Complexity': 'Low - JSON file based',
        'Network Dependency': 'No - Works offline',
        'User Management': 'Custom implementation',
        'Security': 'Basic JWT + bcrypt',
        'Scalability': 'Limited by server',
        'Cost': 'Free',
        'Features': 'Basic auth only',
        'Current Status': 'Working'
      }
    };
    
    return comparison;
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="hover:text-gray-300">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold">Firebase Auth Direct Test</h1>
        </div>

        {/* Network Connectivity Test */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Network Connectivity Test</h2>
          {networkTest ? (
            <div className="space-y-2">
              {Object.entries(networkTest).map(([domain, result]: [string, any]) => (
                <div key={domain} className="flex justify-between items-center">
                  <span className="text-sm font-mono">{domain}</span>
                  <span className={`text-sm ${result.status === 'reachable' ? 'text-green-500' : 'text-red-500'}`}>
                    {result.status === 'reachable' ? '✓ Reachable' : `✗ ${result.error}`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Testing network connectivity...</p>
          )}
        </div>

        {/* Firebase Config Status */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Firebase Configuration</h2>
          <div className="space-y-2 text-sm">
            <div>API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✓ Set' : '✗ Not set'}</div>
            <div>Auth Domain: {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✓ Set' : '✗ Not set'}</div>
            <div>Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Not set'}</div>
            <div>Auth Instance: {auth ? '✓ Initialized' : '✗ Not initialized'}</div>
            <div>Current User: {currentUser ? currentUser.email : 'None'}</div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Firebase Auth</h2>
          
          <div className="space-y-4 mb-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-2 bg-gray-800 rounded-lg"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 bg-gray-800 rounded-lg"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={testCreateUser}
              disabled={loading || !auth}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg"
            >
              Create User
            </button>
            <button
              onClick={testSignIn}
              disabled={loading || !auth}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 rounded-lg"
            >
              Sign In
            </button>
            <button
              onClick={testSignOut}
              disabled={loading || !auth || !currentUser}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-lg"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {testResults.length > 0 ? (
              testResults.map((result, index) => (
                <div key={index} className={`p-2 rounded ${
                  result.status === 'success' ? 'bg-green-900/20 text-green-400' :
                  result.status === 'error' ? 'bg-red-900/20 text-red-400' :
                  result.status === 'warning' ? 'bg-yellow-900/20 text-yellow-400' :
                  'bg-gray-800 text-gray-400'
                }`}>
                  <span className="text-xs text-gray-500">[{result.timestamp}]</span> 
                  <strong> {result.test}:</strong> {result.result}
                </div>
              ))
            ) : (
              <p className="text-gray-400">No test results yet</p>
            )}
          </div>
        </div>

        {/* Comparison */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Firebase Auth vs Local Auth Comparison</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(compareWithLocalAuth()).map(([system, features]) => (
              <div key={system} className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-red-500">{system}</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(features).map(([feature, value]) => (
                    <div key={feature} className="flex justify-between">
                      <span className="text-gray-400">{feature}:</span>
                      <span className={value.includes('Working') || value.includes('Initialized') ? 'text-green-400' : ''}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}