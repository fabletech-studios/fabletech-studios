import { NextResponse } from 'next/server';
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase/admin';

export async function GET() {
  const status = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    firebase: {
      adminAuth: !!adminAuth,
      adminDb: !!adminDb,
      adminStorage: !!adminStorage,
    },
    envVars: {
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      projectId: process.env.FIREBASE_PROJECT_ID || 'not-set',
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.substring(0, 10) + '...' || 'not-set',
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
      hasStorageBucket: !!process.env.FIREBASE_STORAGE_BUCKET,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'not-set',
      hasPublicStorageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      publicStorageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'not-set',
    }
  };

  // Test storage bucket if available
  if (adminStorage) {
    try {
      const bucket = adminStorage.bucket();
      status.firebase.bucketName = bucket.name;
      status.firebase.storageWorking = true;
    } catch (error: any) {
      status.firebase.storageError = error.message;
      status.firebase.storageWorking = false;
    }
  }

  return NextResponse.json(status);
}