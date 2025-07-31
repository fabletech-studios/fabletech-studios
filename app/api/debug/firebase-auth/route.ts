import { NextResponse } from 'next/server';

export async function GET() {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
    },
    firebase: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
    app: {
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL,
    },
    headers: {
      host: null,
      origin: null,
      referer: null,
    }
  };

  return NextResponse.json(debugInfo, {
    headers: {
      'Cache-Control': 'no-store',
    }
  });
}

export async function POST(request: Request) {
  const headers = request.headers;
  
  // Test Firebase Auth API directly
  const firebaseTestUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`;
  
  try {
    const testResponse = await fetch(firebaseTestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': headers.get('referer') || 'https://www.fabletech.studio',
        'Origin': headers.get('origin') || 'https://www.fabletech.studio',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword',
        returnSecureToken: true,
      }),
    });

    const responseText = await testResponse.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      request: {
        headers: {
          origin: headers.get('origin'),
          referer: headers.get('referer'),
          host: headers.get('host'),
          'user-agent': headers.get('user-agent'),
        },
      },
      firebaseTest: {
        status: testResponse.status,
        statusText: testResponse.statusText,
        headers: Object.fromEntries(testResponse.headers.entries()),
        response: responseData,
      },
      diagnosis: analyzeResponse(testResponse.status, responseData),
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

function analyzeResponse(status: number, data: any): any {
  const diagnosis = {
    status: 'unknown',
    issues: [],
    solutions: [],
  };

  if (status === 403) {
    diagnosis.status = 'blocked';
    
    if (data?.error?.message?.includes('requests-from-referer')) {
      diagnosis.issues.push('Firebase is blocking requests from this domain');
      diagnosis.solutions.push(
        'Check Google Cloud Console API key restrictions',
        'Verify Firebase authorized domains are saved',
        'Wait 5-10 minutes for propagation',
        'Clear browser cache and cookies'
      );
    } else if (data?.error?.message?.includes('API key not valid')) {
      diagnosis.issues.push('API key is invalid or restricted');
      diagnosis.solutions.push(
        'Check API key in Google Cloud Console',
        'Remove website restrictions temporarily',
        'Regenerate API key if needed'
      );
    }
  } else if (status === 400) {
    diagnosis.status = 'invalid_request';
    if (data?.error?.message === 'INVALID_EMAIL') {
      diagnosis.status = 'test_expected';
      diagnosis.issues.push('Test request received expected error');
    }
  } else if (status === 200) {
    diagnosis.status = 'working';
    diagnosis.issues.push('Firebase Auth is accessible');
  }

  return diagnosis;
}