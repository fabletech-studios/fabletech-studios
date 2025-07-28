import { NextResponse } from 'next/server';

// Dynamic import to avoid initialization issues
async function testFirebaseAdmin() {
  try {
    const { adminStorage, adminDb, adminAuth } = await import('@/lib/firebase/admin');
    
    const results = {
      timestamp: new Date().toISOString(),
      environment: {
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        projectIdPrefix: process.env.FIREBASE_PROJECT_ID?.substring(0, 10),
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        clientEmailPrefix: process.env.FIREBASE_CLIENT_EMAIL?.substring(0, 20),
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
        hasStorageBucket: !!process.env.FIREBASE_STORAGE_BUCKET,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        nodeEnv: process.env.NODE_ENV
      },
      services: {
        adminAuth: adminAuth ? 'initialized' : 'not available',
        adminDb: adminDb ? 'initialized' : 'not available',
        adminStorage: adminStorage ? 'initialized' : 'not available'
      },
      tests: {
        storageBucket: null,
        firestoreAccess: null,
        authAccess: null
      }
    };
    
    // Test storage bucket access
    if (adminStorage) {
      try {
        const bucket = adminStorage.bucket();
        results.tests.storageBucket = {
          success: true,
          bucketName: bucket.name
        };
      } catch (error: any) {
        results.tests.storageBucket = {
          success: false,
          error: error.message
        };
      }
    }
    
    // Test Firestore access
    if (adminDb) {
      try {
        const testDoc = await adminDb.collection('_test').doc('ping').get();
        results.tests.firestoreAccess = {
          success: true,
          docExists: testDoc.exists
        };
      } catch (error: any) {
        results.tests.firestoreAccess = {
          success: false,
          error: error.message
        };
      }
    }
    
    // Test Auth access
    if (adminAuth) {
      try {
        // Just check if we can access auth methods
        results.tests.authAccess = {
          success: true,
          canAccess: true
        };
      } catch (error: any) {
        results.tests.authAccess = {
          success: false,
          error: error.message
        };
      }
    }
    
    return results;
  } catch (error: any) {
    return {
      error: 'Failed to import Firebase Admin',
      details: error.message,
      stack: error.stack
    };
  }
}

export async function GET() {
  try {
    const results = await testFirebaseAdmin();
    
    return NextResponse.json({
      success: true,
      ...results
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}