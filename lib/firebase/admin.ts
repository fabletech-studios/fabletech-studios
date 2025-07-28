import { initializeApp, getApps, cert, ServiceAccount, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Lazy initialization variables
let adminApp: App | null = null;
let initializationPromise: Promise<void> | null = null;

// Initialize Firebase Admin (lazy)
async function initializeAdmin() {
  // Return early if already initialized
  if (adminApp || getApps().length > 0) {
    if (!adminApp && getApps().length > 0) {
      adminApp = getApps()[0];
    }
    return;
  }

  // Check if admin credentials are available
  const hasAdminCredentials = process.env.FIREBASE_PROJECT_ID && 
                            process.env.FIREBASE_CLIENT_EMAIL && 
                            process.env.FIREBASE_PRIVATE_KEY;

  if (!hasAdminCredentials) {
    console.warn('Firebase Admin credentials not available');
    return;
  }

  try {
    console.log('Initializing Firebase Admin SDK...');
    
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (!privateKey || privateKey.length < 100) {
      throw new Error('Invalid private key format or length');
    }
    
    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: privateKey,
    };

    // Handle storage bucket configuration
    let storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '';
    
    if (!storageBucket) {
      throw new Error('Firebase storage bucket not configured');
    }
    
    // Remove any protocol prefix
    storageBucket = storageBucket.replace('gs://', '').replace('https://', '').replace('http://', '');
    
    // Firebase Admin SDK bucket format handling
    let bucketToUse = storageBucket;
    
    // Check different bucket formats and use the appropriate one
    if (storageBucket.includes('.firebasestorage.app')) {
      bucketToUse = storageBucket.replace('.firebasestorage.app', '.appspot.com');
    } else if (!storageBucket.includes('.')) {
      bucketToUse = `${storageBucket}.appspot.com`;
    }
    
    // Initialize with different configurations based on the error
    try {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: bucketToUse,
      });
      console.log('Firebase Admin SDK initialized with bucket:', bucketToUse);
    } catch (initError: any) {
      console.error('Failed with appspot format, trying without domain...');
      
      // Try with just the bucket name (no domain)
      const bucketNameOnly = storageBucket.split('.')[0];
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: bucketNameOnly,
      });
      console.log('Firebase Admin SDK initialized with bucket name only:', bucketNameOnly);
    }
    
    console.log('Firebase Admin SDK initialized successfully');
    
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization failed:', error.message);
    adminApp = null;
  }
}

// Ensure initialization happens only once
async function ensureInitialized() {
  if (!initializationPromise) {
    initializationPromise = initializeAdmin();
  }
  await initializationPromise;
}

// Export getters that ensure initialization
export const getAdminAuth = async () => {
  await ensureInitialized();
  return adminApp ? getAuth(adminApp) : null;
};

export const getAdminDb = async () => {
  await ensureInitialized();
  return adminApp ? getFirestore(adminApp) : null;
};

export const getAdminStorage = async () => {
  await ensureInitialized();
  return adminApp ? getStorage(adminApp) : null;
};

// For backward compatibility - these will be null until first access
export let adminAuth: ReturnType<typeof getAuth> | null = null;
export let adminDb: ReturnType<typeof getFirestore> | null = null;
export let adminStorage: ReturnType<typeof getStorage> | null = null;

// Initialize on first import (backward compatibility)
if (typeof window === 'undefined') {
  ensureInitialized().then(() => {
    if (adminApp) {
      adminAuth = getAuth(adminApp);
      adminDb = getFirestore(adminApp);
      adminStorage = getStorage(adminApp);
    }
  }).catch(console.error);
}

// Helper functions
export async function verifyIdToken(token: string) {
  const auth = await getAdminAuth();
  if (!auth) {
    console.warn('Admin Auth not initialized');
    return null;
  }
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export async function createCustomToken(uid: string, claims?: object) {
  const auth = await getAdminAuth();
  if (!auth) {
    console.warn('Admin Auth not initialized');
    return null;
  }
  try {
    const token = await auth.createCustomToken(uid, claims);
    return token;
  } catch (error) {
    console.error('Error creating custom token:', error);
    return null;
  }
}

export async function setCustomUserClaims(uid: string, claims: object) {
  const auth = await getAdminAuth();
  if (!auth) {
    console.warn('Admin Auth not initialized');
    return false;
  }
  try {
    await auth.setCustomUserClaims(uid, claims);
    return true;
  } catch (error) {
    console.error('Error setting custom claims:', error);
    return false;
  }
}