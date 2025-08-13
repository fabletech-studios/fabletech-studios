import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    checks: {
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL,
        hasFirebaseConfig: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        hasAdminCredentials: !!(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY),
        hasServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      },
      firebase: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT_SET',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT_SET',
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT_SET'
      },
      databases: {
        serverDb: false,
        adminDb: false,
        clientDb: false
      },
      testOperations: {
        canReadSeries: false,
        canInitializeAdmin: false,
        canInitializeClient: false
      }
    }
  };

  // Test server DB
  try {
    const { serverDb } = await import('@/lib/firebase/server-config');
    results.checks.databases.serverDb = !!serverDb;
    
    if (serverDb) {
      const { collection, getDocs, limit, query } = await import('firebase/firestore');
      const seriesQuery = query(collection(serverDb, 'series'), limit(1));
      const snapshot = await getDocs(seriesQuery);
      results.checks.testOperations.canReadSeries = !snapshot.empty || snapshot.size === 0;
    }
  } catch (error: any) {
    console.error('Server DB test failed:', error.message);
  }

  // Test admin DB
  try {
    const { adminDb } = await import('@/lib/firebase/admin');
    results.checks.databases.adminDb = !!adminDb;
    results.checks.testOperations.canInitializeAdmin = !!adminDb;
  } catch (error: any) {
    console.error('Admin DB test failed:', error.message);
  }

  // Test client DB initialization
  try {
    const { db } = await import('@/lib/firebase/config');
    results.checks.databases.clientDb = !!db;
    results.checks.testOperations.canInitializeClient = !!db;
  } catch (error: any) {
    console.error('Client DB test failed:', error.message);
  }

  // Calculate health status
  const hasWorkingDb = results.checks.databases.serverDb || 
                       results.checks.databases.adminDb || 
                       results.checks.databases.clientDb;
  
  const canRead = results.checks.testOperations.canReadSeries;
  
  const status = hasWorkingDb && canRead ? 'HEALTHY' : 
                 hasWorkingDb ? 'PARTIAL' : 'CRITICAL';

  return NextResponse.json({
    status,
    ...results,
    recommendations: getRecommendations(results)
  });
}

function getRecommendations(results: any): string[] {
  const recommendations = [];
  
  if (!results.checks.environment.hasAdminCredentials) {
    recommendations.push('Add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to Vercel environment variables');
  }
  
  if (!results.checks.databases.adminDb) {
    recommendations.push('Admin SDK is not working - check credentials');
  }
  
  if (!results.checks.testOperations.canReadSeries) {
    recommendations.push('Cannot read from Firestore - check rules and initialization');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('System appears to be functioning normally');
  }
  
  return recommendations;
}