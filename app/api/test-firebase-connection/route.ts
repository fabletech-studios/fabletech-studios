import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    checks: {} as any
  };

  // Check environment variables
  results.checks.environment = {
    apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'missing',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'missing',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'missing'
  };

  // Test connectivity to Firebase domains
  const firebaseDomains = [
    'firebaseapp.com',
    'googleapis.com',
    'firebase.googleapis.com',
    results.checks.environment.authDomain
  ];

  results.checks.connectivity = {};

  for (const domain of firebaseDomains) {
    try {
      const response = await fetch(`https://${domain}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      results.checks.connectivity[domain] = {
        status: response.status,
        ok: response.ok
      };
    } catch (error: any) {
      results.checks.connectivity[domain] = {
        status: 'error',
        error: error.message
      };
    }
  }

  // Check if Firebase services are reachable
  try {
    const authCheck = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'test' }),
        signal: AbortSignal.timeout(5000)
      }
    );
    
    results.checks.authService = {
      reachable: true,
      status: authCheck.status,
      // 400 is expected for invalid token, but shows service is reachable
      working: authCheck.status === 400 || authCheck.status === 401
    };
  } catch (error: any) {
    results.checks.authService = {
      reachable: false,
      error: error.message
    };
  }

  return NextResponse.json(results);
}