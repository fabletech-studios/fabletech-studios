import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin
let adminApp;

// Check if admin credentials are available
const hasAdminCredentials = process.env.FIREBASE_PROJECT_ID && 
                          process.env.FIREBASE_CLIENT_EMAIL && 
                          process.env.FIREBASE_PRIVATE_KEY;

console.log('Firebase Admin SDK initialization check:', {
  hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
  projectId: process.env.FIREBASE_PROJECT_ID?.substring(0, 10) + '...',
  hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.substring(0, 20) + '...',
  hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
  privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
  hasStorageBucket: !!process.env.FIREBASE_STORAGE_BUCKET,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

if (!getApps().length && hasAdminCredentials) {
  try {
    // In production, you'll use a service account JSON file
    // For now, we'll use environment variables
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (!privateKey || privateKey.length < 100) {
      throw new Error('Invalid private key format or length');
    }
    
    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: privateKey,
    };

    // Handle both storage bucket formats
    let storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '';
    
    // Ensure storage bucket has proper format
    if (!storageBucket) {
      throw new Error('Firebase storage bucket not configured');
    }
    
    // Remove gs:// prefix if present
    storageBucket = storageBucket.replace('gs://', '');
    
    // Convert .firebasestorage.app to .appspot.com if needed
    if (storageBucket.includes('.firebasestorage.app')) {
      storageBucket = storageBucket.replace('.firebasestorage.app', '.appspot.com');
    }
    
    console.log('Initializing Firebase Admin with storage bucket:', storageBucket);
    
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: storageBucket,
    });
    
    console.log('Firebase Admin SDK initialized successfully');
    console.log('Testing storage access...');
    
    // Test storage access
    const storage = getStorage(adminApp);
    const bucket = storage.bucket();
    console.log('Storage bucket name:', bucket.name);
    
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization failed:', error.message);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    console.warn('Some server-side features will be limited.');
  }
} else if (getApps().length) {
  adminApp = getApps()[0];
  console.log('Using existing Firebase Admin app');
}

// Initialize services only if admin app is available
export const adminAuth = adminApp ? getAuth(adminApp) : null;
export const adminDb = adminApp ? getFirestore(adminApp) : null;
export const adminStorage = adminApp ? getStorage(adminApp) : null;

// Helper functions
export async function verifyIdToken(token: string) {
  if (!adminAuth) {
    console.warn('Admin Auth not initialized');
    return null;
  }
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export async function createCustomToken(uid: string, claims?: object) {
  if (!adminAuth) {
    console.warn('Admin Auth not initialized');
    return null;
  }
  try {
    const token = await adminAuth.createCustomToken(uid, claims);
    return token;
  } catch (error) {
    console.error('Error creating custom token:', error);
    return null;
  }
}

export async function setCustomUserClaims(uid: string, claims: object) {
  if (!adminAuth) {
    console.warn('Admin Auth not initialized');
    return false;
  }
  try {
    await adminAuth.setCustomUserClaims(uid, claims);
    return true;
  } catch (error) {
    console.error('Error setting custom claims:', error);
    return false;
  }
}