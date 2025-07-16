'use client';

import { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

// Direct Firebase config (no environment variables)
const firebaseConfig = {
  apiKey: "AIzaSyBIZQGc5Vu6ac5rud_lbqOqHTl-jXmE-xw",
  authDomain: "fabletech-studios.firebaseapp.com",
  projectId: "fabletech-studios",
  storageBucket: "fabletech-studios.firebasestorage.app",
  messagingSenderId: "921179545821",
  appId: "1:921179545821:web:6aed00ab9211b01c65bb34"
};

export default function FirebaseAuthTestPage() {
  const [result, setResult] = useState<string>('');
  const [testing, setTesting] = useState(false);
  const [success, setSuccess] = useState<boolean | null>(null);

  const runDirectAuthTest = async () => {
    setTesting(true);
    setResult('Starting direct Firebase Auth test...\n\n');
    
    try {
      // Initialize Firebase directly
      const app = initializeApp(firebaseConfig, 'auth-test-' + Date.now());
      const auth = getAuth(app);
      
      setResult(prev => prev + '✓ Firebase initialized\n');
      setResult(prev => prev + `✓ Auth domain: ${auth.config.authDomain}\n`);
      setResult(prev => prev + `✓ API Key: ${auth.config.apiKey?.substring(0, 10)}...\n\n`);
      
      // Create test credentials
      const testEmail = `direct-test-${Date.now()}@fabletech.com`;
      const testPassword = 'TestPass123!';
      
      setResult(prev => prev + `Creating test account: ${testEmail}\n`);
      
      try {
        // Try to create user
        const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        setResult(prev => prev + `✓ User created successfully!\n`);
        setResult(prev => prev + `✓ User ID: ${userCredential.user.uid}\n\n`);
        
        // Sign out
        await signOut(auth);
        setResult(prev => prev + `✓ Signed out successfully\n\n`);
        
        // Sign back in
        setResult(prev => prev + `Testing sign in...\n`);
        const signInResult = await signInWithEmailAndPassword(auth, testEmail, testPassword);
        setResult(prev => prev + `✓ Signed in successfully!\n`);
        setResult(prev => prev + `✓ Email verified: ${signInResult.user.emailVerified}\n\n`);
        
        setResult(prev => prev + '🎉 ALL TESTS PASSED!\n');
        setResult(prev => prev + 'Firebase Authentication is working correctly.\n');
        setSuccess(true);
        
        // Clean up
        await signOut(auth);
        
      } catch (authError: any) {
        setResult(prev => prev + `\n❌ Auth Error: ${authError.code}\n`);
        setResult(prev => prev + `Message: ${authError.message}\n\n`);
        
        if (authError.code === 'auth/network-request-failed') {
          setResult(prev => prev + '🔍 Network Request Failed - Possible causes:\n');
          setResult(prev => prev + '1. Check if Email/Password is enabled in Firebase Console\n');
          setResult(prev => prev + '2. Check internet connection\n');
          setResult(prev => prev + '3. Try in incognito mode (no extensions)\n');
          setResult(prev => prev + '4. Check for VPN/Proxy interference\n');
          setResult(prev => prev + '5. Verify Firebase project is active\n\n');
          
          setResult(prev => prev + 'Direct link to enable Email/Password:\n');
          setResult(prev => prev + 'https://console.firebase.google.com/project/fabletech-studios/authentication/providers\n');
        }
        
        setSuccess(false);
      }
      
    } catch (error: any) {
      setResult(prev => prev + `\n❌ Initialization Error: ${error.message}\n`);
      setSuccess(false);
    }
    
    setTesting(false);
  };

  const checkBrowserInfo = () => {
    const info = {
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      cookiesEnabled: navigator.cookieEnabled,
      language: navigator.language,
      platform: navigator.platform
    };
    
    setResult(JSON.stringify(info, null, 2));
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Direct Firebase Auth Test</h1>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <p className="text-sm text-gray-400 mb-4">
            This test bypasses all wrappers and tests Firebase Auth directly with hardcoded configuration.
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={runDirectAuthTest}
              disabled={testing}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-lg font-semibold flex items-center gap-2"
            >
              {testing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Testing...
                </>
              ) : (
                'Run Direct Auth Test'
              )}
            </button>
            
            <button
              onClick={checkBrowserInfo}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold"
            >
              Check Browser Info
            </button>
          </div>
        </div>
        
        {result && (
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Test Results</h2>
              {success !== null && (
                success ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )
              )}
            </div>
            <pre className="text-sm font-mono whitespace-pre-wrap text-gray-300">
              {result}
            </pre>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <a 
            href="/firebase-test"
            className="text-sm text-gray-400 hover:text-white"
          >
            ← Back to main Firebase test
          </a>
        </div>
      </div>
    </div>
  );
}