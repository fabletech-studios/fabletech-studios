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

if (!getApps().length && hasAdminCredentials) {
  try {
    // In production, you'll use a service account JSON file
    // For now, we'll use environment variables
    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
    };

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.warn('Firebase Admin SDK initialization failed:', error);
    console.warn('Some server-side features will be limited.');
  }
} else if (getApps().length) {
  adminApp = getApps()[0];
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