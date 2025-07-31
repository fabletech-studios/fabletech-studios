import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase/admin';

export async function GET() {
  try {
    let dbStatus = 'unknown';
    let storageStatus = 'unknown';

    // Test Firestore connection
    if (adminDb) {
      try {
        await adminDb.collection('health').doc('check').set({
          timestamp: new Date().toISOString()
        });
        dbStatus = 'connected';
      } catch {
        dbStatus = 'error';
      }
    }

    // Test Storage connection
    if (adminStorage) {
      try {
        const bucket = adminStorage.bucket();
        await bucket.exists();
        storageStatus = 'connected';
      } catch {
        storageStatus = 'error';
      }
    }

    const isHealthy = dbStatus === 'connected' && storageStatus === 'connected';

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'degraded',
      firestore: dbStatus,
      storage: storageStatus,
      timestamp: new Date().toISOString()
    }, { status: isHealthy ? 200 : 500 });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}