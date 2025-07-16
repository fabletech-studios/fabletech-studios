import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration - these will be replaced with your actual config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only if config is available
let app: FirebaseApp | null = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

// Only initialize on client side
if (typeof window !== 'undefined') {
  try {
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      if (!getApps().length) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApps()[0];
      }

      // Initialize services
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
    } else {
      console.warn('Firebase config not complete, Firebase features will be disabled');
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    console.warn('Firebase features will be disabled');
  }
}

export { app, auth, db, storage };

// Collection names
export const COLLECTIONS = {
  CUSTOMERS: 'customers',
  SERIES: 'series',
  EPISODES: 'episodes',
  TRANSACTIONS: 'transactions',
  WATCH_HISTORY: 'watchHistory'
} as const;

// Storage buckets
export const STORAGE_BUCKETS = {
  VIDEOS: 'videos',
  AUDIO: 'audio',
  THUMBNAILS: 'thumbnails'
} as const;

export default app;