import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export async function POST(request: NextRequest) {
  try {
    const testEmail = `test${Date.now()}@firebasetest.com`;
    const testPassword = 'testpass123';

    // Test 1: Check if auth is initialized
    const authStatus = {
      initialized: !!auth,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Not set'
    };

    if (!auth) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Auth not initialized',
        authStatus
      });
    }

    // Test 2: Try to create a user
    let userResult = null;
    let createError = null;
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      userResult = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        created: true
      };
    } catch (error: any) {
      createError = {
        code: error.code,
        message: error.message,
        fullError: error.toString()
      };
    }

    // Test 3: Network connectivity test
    const networkTests = await testNetworkConnectivity();

    return NextResponse.json({
      success: !!userResult,
      authStatus,
      userResult,
      createError,
      networkTests,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

async function testNetworkConnectivity() {
  const domains = [
    'https://identitytoolkit.googleapis.com',
    'https://securetoken.googleapis.com',
    'https://www.googleapis.com/identitytoolkit/v3/relyingparty',
    'https://firebaseapp.com'
  ];

  const results: any = {};
  
  for (const domain of domains) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(domain, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      results[domain] = { 
        status: 'reachable', 
        code: response.status,
        headers: {
          'content-type': response.headers.get('content-type'),
          'server': response.headers.get('server')
        }
      };
    } catch (error: any) {
      results[domain] = { 
        status: 'failed', 
        error: error.name === 'AbortError' ? 'Timeout' : error.message 
      };
    }
  }
  
  return results;
}