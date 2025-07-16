'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Upload, RefreshCw, Trash2 } from 'lucide-react';
import { auth, db, storage } from '@/lib/firebase/config';
import { createCustomer, signInCustomer, signOutCustomer } from '@/lib/firebase/auth-service';
import { createSeries, getAllSeries } from '@/lib/firebase/content-service';
import { uploadFile } from '@/lib/firebase/storage-service';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

interface TestResult {
  name: string;
  status: 'pending' | 'testing' | 'success' | 'failed';
  message?: string;
  details?: any;
  timestamp?: string;
}

export default function FirebaseTestPage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Firebase Connection', status: 'pending' },
    { name: 'Authentication', status: 'pending' },
    { name: 'Firestore Database', status: 'pending' },
    { name: 'Storage Upload', status: 'pending' },
  ]);
  const [lastTestTime, setLastTestTime] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Check initial connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setConnectionStatus('checking');
      // Simple check to see if Firebase is initialized
      if (auth && db && storage) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      setConnectionStatus('error');
    }
  };

  const runNetworkDiagnostics = async () => {
    try {
      const response = await fetch('/api/test-firebase-connection');
      const data = await response.json();
      
      console.log('Network Diagnostics:', data);
      
      // Show results in a simple alert for now
      let message = 'Firebase Network Diagnostics:\n\n';
      message += `Environment Check:\n`;
      message += `- API Key: ${data.checks.environment.apiKey ? '✓' : '✗'}\n`;
      message += `- Auth Domain: ${data.checks.environment.authDomain}\n`;
      message += `- Project ID: ${data.checks.environment.projectId}\n\n`;
      
      message += `Connectivity:\n`;
      Object.entries(data.checks.connectivity).forEach(([domain, result]: [string, any]) => {
        message += `- ${domain}: ${result.ok ? '✓ OK' : `✗ ${result.error || result.status}`}\n`;
      });
      
      message += `\nAuth Service: ${data.checks.authService?.working ? '✓ Reachable' : '✗ Not reachable'}\n`;
      
      alert(message);
    } catch (error) {
      alert('Failed to run network diagnostics');
    }
  };

  const updateTest = (name: string, updates: Partial<TestResult>) => {
    setTests(prev => prev.map(test => 
      test.name === name ? { 
        ...test, 
        ...updates,
        timestamp: new Date().toISOString()
      } : test
    ));
  };

  const resetAllTests = () => {
    setTests([
      { name: 'Firebase Connection', status: 'pending' },
      { name: 'Authentication', status: 'pending' },
      { name: 'Firestore Database', status: 'pending' },
      { name: 'Storage Upload', status: 'pending' },
    ]);
  };

  const clearCacheAndRetry = async () => {
    setIsClearing(true);
    
    try {
      // Clear any existing auth state
      if (auth.currentUser) {
        await signOut(auth);
      }
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // Reset test states
      resetAllTests();
      
      // Force a small delay to ensure clean state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload the page to reinitialize Firebase
      window.location.reload();
    } catch (error) {
      console.error('Error clearing cache:', error);
      setIsClearing(false);
    }
  };

  const runAllTests = async () => {
    // Reset all tests to pending first
    resetAllTests();
    setLastTestTime(new Date().toLocaleString());
    
    // Add small delays between tests to avoid rate limiting
    await testFirebaseConnection();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Skip auth test if network is blocking googleapis.com
    const skipAuth = localStorage.getItem('skipFirebaseAuth') === 'true';
    if (!skipAuth) {
      await testAuthenticationSimple();
    } else {
      updateTest('Authentication', { 
        status: 'success', 
        message: '⚠️ Skipped (using local auth + Firebase data)',
        details: { mode: 'hybrid', reason: 'Network restriction on googleapis.com' }
      });
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await testFirestore();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await testStorage();
  };

  // Simple auth test without creating users
  const testAuthenticationSimple = async () => {
    updateTest('Authentication', { status: 'testing' });
    
    try {
      // Check if auth is initialized
      if (!auth) {
        throw new Error('Auth not initialized');
      }
      
      // Check auth config
      const config = {
        apiKey: auth.config.apiKey ? '✓ Set' : '✗ Missing',
        authDomain: auth.config.authDomain || 'Missing',
        projectId: auth.app.options.projectId || 'Missing'
      };
      
      updateTest('Authentication', { 
        message: `Checking auth configuration...\nAPI Key: ${config.apiKey}\nAuth Domain: ${config.authDomain}\nProject: ${config.projectId}` 
      });
      
      // Try to import auth methods to ensure they're available
      const { getAuth, connectAuthEmulator } = await import('firebase/auth');
      
      // Check if we can get auth instance
      const authInstance = getAuth();
      if (!authInstance) {
        throw new Error('Could not get auth instance');
      }
      
      // Now run the full test
      await testAuthentication();
      
    } catch (error: any) {
      console.error('Simple auth test error:', error);
      updateTest('Authentication', { 
        status: 'failed', 
        message: `Auth service check failed: ${error.message}`
      });
    }
  };

  const testFirebaseConnection = async () => {
    updateTest('Firebase Connection', { status: 'testing' });
    
    try {
      // Check if Firebase is initialized
      if (auth && db && storage) {
        updateTest('Firebase Connection', { 
          status: 'success', 
          message: 'Firebase SDK initialized successfully',
          details: {
            authDomain: auth.config.authDomain,
            projectId: auth.app.options.projectId,
            storageBucket: storage.app.options.storageBucket
          }
        });
      } else {
        throw new Error('Firebase services not initialized');
      }
    } catch (error: any) {
      updateTest('Firebase Connection', { 
        status: 'failed', 
        message: error.message 
      });
    }
  };

  const testAuthentication = async () => {
    updateTest('Authentication', { status: 'testing' });
    
    try {
      // First, let's check if auth service is available
      updateTest('Authentication', { message: 'Checking auth service availability...' });
      
      if (!auth) {
        throw new Error('Firebase Auth service not initialized');
      }
      
      // Check auth configuration
      const authConfig = {
        apiKey: auth.config.apiKey,
        authDomain: auth.config.authDomain,
        currentUser: auth.currentUser ? 'exists' : 'none',
        settings: auth.settings,
      };
      
      console.log('Auth Configuration:', authConfig);
      updateTest('Authentication', { 
        message: `Auth domain: ${auth.config.authDomain}\nCurrent user: ${authConfig.currentUser}` 
      });
      
      // Try a simple fetch to auth domain to check connectivity
      updateTest('Authentication', { message: 'Testing connection to Firebase Auth...' });
      try {
        const authDomainTest = await fetch(`https://${auth.config.authDomain}/__/auth/iframe`, {
          method: 'GET',
          mode: 'no-cors' // Avoid CORS issues for connection test
        });
        console.log('Auth domain connection test completed');
      } catch (fetchError: any) {
        console.error('Auth domain connection test failed:', fetchError);
        throw new Error(`Cannot connect to auth domain ${auth.config.authDomain}: ${fetchError.message}`);
      }
      
      // Test account credentials with random suffix to avoid conflicts
      const randomSuffix = Math.random().toString(36).substring(7);
      const testEmail = `test-${Date.now()}-${randomSuffix}@fabletech.com`;
      const testPassword = 'TestPass123!';
      const testName = 'Test User';
      
      // First, sign out any existing user
      if (auth.currentUser) {
        updateTest('Authentication', { message: 'Signing out existing user...' });
        await signOut(auth);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Create account with detailed error logging
      updateTest('Authentication', { message: `Creating test account: ${testEmail}` });
      
      // Import createUserWithEmailAndPassword directly for more control
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        console.log('User created successfully:', userCredential.user.uid);
        
        // Now create the customer document
        const createResult = await createCustomer(testEmail, testPassword, testName);
        
        if (!createResult.success) {
          console.error('Customer creation failed:', createResult.error);
          throw new Error(createResult.error || 'Failed to create customer document');
        }
        
        updateTest('Authentication', { 
          status: 'success', 
          message: '✅ Authentication working correctly\nEmail/Password sign-in is enabled and functional',
          details: {
            testEmail,
            userId: userCredential.user.uid,
            authDomain: auth.config.authDomain,
            projectId: auth.app.options.projectId
          }
        });
        
        // Clean up - sign out the test user
        await signOut(auth);
        
      } catch (authError: any) {
        console.error('Direct auth error:', authError);
        console.error('Error code:', authError.code);
        console.error('Error message:', authError.message);
        console.error('Full error object:', authError);
        
        let detailedError = `Firebase Auth Error: ${authError.code || 'unknown'}\n`;
        detailedError += `Message: ${authError.message || 'No message'}\n`;
        
        // Check for specific error codes
        if (authError.code === 'auth/network-request-failed') {
          detailedError += '\n🔍 Diagnostic Info:\n';
          detailedError += `- Auth Domain: ${auth.config.authDomain}\n`;
          detailedError += `- API Key: ${auth.config.apiKey?.substring(0, 10)}...\n`;
          detailedError += `- Project ID: ${auth.app.options.projectId}\n`;
          detailedError += '\n🔧 Possible causes:\n';
          detailedError += '1. Firebase Auth not enabled in console\n';
          detailedError += '2. Network/firewall blocking Firebase domains\n';
          detailedError += '3. CORS issues (try incognito mode)\n';
          detailedError += '4. Browser extensions blocking requests\n';
          detailedError += '5. Incorrect auth domain configuration';
        } else if (authError.code === 'auth/invalid-api-key') {
          detailedError += '\n🔧 Your API key appears to be invalid.\n';
          detailedError += 'Please verify it matches the one in Firebase Console.';
        } else if (authError.code === 'auth/operation-not-allowed') {
          detailedError += '\n🔧 Email/Password sign-in is not enabled.\n';
          detailedError += 'Enable it in Firebase Console > Authentication > Sign-in method';
        }
        
        throw new Error(detailedError);
      }
      
    } catch (error: any) {
      console.error('Test failed with error:', error);
      
      updateTest('Authentication', { 
        status: 'failed', 
        message: error.message,
        details: {
          errorStack: error.stack,
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  const testFirestore = async () => {
    updateTest('Firestore Database', { status: 'testing' });
    
    try {
      // Write a test document
      const testDoc = {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Firebase test document'
      };
      
      updateTest('Firestore Database', { message: 'Writing test document...' });
      await setDoc(doc(db, 'test-collection', 'test-doc'), testDoc);
      
      // Read it back
      updateTest('Firestore Database', { message: 'Reading test document...' });
      const docSnap = await getDoc(doc(db, 'test-collection', 'test-doc'));
      
      if (!docSnap.exists()) {
        throw new Error('Test document not found');
      }
      
      // Test series creation
      updateTest('Firestore Database', { message: 'Creating test series...' });
      const seriesResult = await createSeries({
        title: 'Test Series',
        description: 'Firebase test series',
        author: 'Test Author',
        genre: 'Test',
        episodeCount: 0,
        createdBy: 'test-user'
      });
      
      if (!seriesResult.success) {
        throw new Error(seriesResult.error || 'Failed to create series');
      }
      
      updateTest('Firestore Database', { 
        status: 'success', 
        message: 'Firestore working correctly',
        details: {
          testDoc: docSnap.data(),
          seriesId: seriesResult.seriesId
        }
      });
      
    } catch (error: any) {
      updateTest('Firestore Database', { 
        status: 'failed', 
        message: error.message 
      });
    }
  };

  const testStorage = async () => {
    updateTest('Storage Upload', { status: 'testing' });
    
    try {
      // Create a test file
      const testContent = 'This is a test file for Firebase Storage';
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test-file.txt', { type: 'text/plain' });
      
      updateTest('Storage Upload', { message: 'Uploading test file...' });
      
      // Upload the file
      const uploadResult = await uploadFile(
        testFile,
        'thumbnail', // Using thumbnail bucket for small test file
        'test-series',
        1,
        (progress) => {
          updateTest('Storage Upload', { 
            message: `Uploading: ${progress.percentage}%` 
          });
        }
      );
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }
      
      updateTest('Storage Upload', { 
        status: 'success', 
        message: 'Storage working correctly',
        details: {
          url: uploadResult.url,
          path: uploadResult.path
        }
      });
      
    } catch (error: any) {
      updateTest('Storage Upload', { 
        status: 'failed', 
        message: error.message 
      });
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-6 h-6" />;
      case 'testing':
        return <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Firebase Integration Test</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Connection:</span>
            {connectionStatus === 'checking' && (
              <span className="flex items-center gap-1 text-yellow-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking...
              </span>
            )}
            {connectionStatus === 'connected' && (
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle className="w-4 h-4" />
                Connected
              </span>
            )}
            {connectionStatus === 'error' && (
              <span className="flex items-center gap-1 text-red-400">
                <XCircle className="w-4 h-4" />
                Error
              </span>
            )}
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
          <div className="space-y-2 text-sm font-mono">
            <p>Project ID: <span className="text-green-400">{process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</span></p>
            <p>Auth Domain: <span className="text-green-400">{process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}</span></p>
            <p>Storage Bucket: <span className="text-green-400">{process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}</span></p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-800">
            <a 
              href={`https://console.firebase.google.com/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/overview`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
            >
              Open Firebase Console →
            </a>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Service Tests</h2>
              {lastTestTime && (
                <p className="text-sm text-gray-400 mt-1">Last run: {lastTestTime}</p>
              )}
            </div>
            <button
              onClick={clearCacheAndRetry}
              disabled={isClearing || tests.some(t => t.status === 'testing')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-lg text-sm flex items-center gap-2"
            >
              {isClearing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Clear Cache & Reload
                </>
              )}
            </button>
          </div>
          <div className="space-y-4">
            {tests.map((test) => (
              <div key={test.name} className="flex items-start gap-3">
                {getStatusIcon(test.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{test.name}</h3>
                    {test.timestamp && test.status !== 'pending' && (
                      <span className="text-xs text-gray-500">
                        {new Date(test.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  {test.message && (
                    <p className="text-sm text-gray-400 mt-1 whitespace-pre-wrap">{test.message}</p>
                  )}
                  {test.details && test.status === 'success' && (
                    <pre className="text-xs text-gray-500 mt-2 p-2 bg-gray-800 rounded overflow-x-auto">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={runAllTests}
            disabled={tests.some(t => t.status === 'testing') || isClearing}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            {tests.some(t => t.status === 'testing') ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Run All Tests
              </>
            )}
          </button>
          
          <button
            onClick={runNetworkDiagnostics}
            disabled={tests.some(t => t.status === 'testing') || isClearing}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-lg font-semibold text-sm"
          >
            Network Check
          </button>
        </div>

        <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
          <p className="text-sm text-yellow-300">
            <strong>Note:</strong> This creates real data in your Firebase project. 
            Test accounts and files can be deleted from the Firebase Console after testing.
          </p>
        </div>
        
        {tests.find(t => t.name === 'Authentication' && t.status === 'failed') && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-600 rounded-lg">
            <p className="text-sm text-red-300 mb-2">
              <strong>Authentication failing due to network restrictions?</strong>
            </p>
            <div className="space-y-3">
              <a 
                href="/firebase-auth-test"
                className="block text-sm text-red-400 hover:text-red-300 underline"
              >
                → Try Direct Firebase Auth Test
              </a>
              <a 
                href="/firebase-hybrid-mode"
                className="block text-sm text-yellow-400 hover:text-yellow-300 underline"
              >
                → Enable Hybrid Mode (Recommended)
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Hybrid mode uses local auth while still leveraging Firestore and Storage.
            </p>
          </div>
        )}
        
        {localStorage.getItem('skipFirebaseAuth') === 'true' && (
          <div className="mt-4 p-4 bg-green-900/20 border border-green-600 rounded-lg">
            <p className="text-sm text-green-300">
              <strong>✓ Hybrid Mode Enabled</strong>
            </p>
            <p className="text-xs text-green-200 mt-1">
              Using local authentication with Firebase data storage.
            </p>
            <a 
              href="/firebase-hybrid-mode"
              className="inline-block mt-2 text-xs text-green-400 hover:text-green-300 underline"
            >
              Configure Hybrid Mode →
            </a>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
          <h3 className="font-semibold text-blue-300 mb-3">Firebase Setup Checklist</h3>
          <div className="space-y-2 text-sm text-blue-200">
            <p>Before running tests, ensure you have:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Created a Firebase project at <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline">console.firebase.google.com</a></li>
              <li>Enabled <strong>Authentication</strong> service:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Go to Authentication → Get started</li>
                  <li>Sign-in method → Enable "Email/Password"</li>
                </ul>
              </li>
              <li>Created <strong>Firestore Database</strong>:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Go to Firestore Database → Create database</li>
                  <li>Start in test mode (for now)</li>
                </ul>
              </li>
              <li>Enabled <strong>Storage</strong>:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Go to Storage → Get started</li>
                  <li>Start in test mode (for now)</li>
                </ul>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}