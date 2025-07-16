import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase for server-side
let serverApp: FirebaseApp | null = null;
let serverAuth: any = null;
let serverDb: any = null;
let serverStorage: any = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    if (!getApps().length) {
      serverApp = initializeApp(firebaseConfig);
    } else {
      serverApp = getApps()[0];
    }

    // Initialize services
    serverAuth = getAuth(serverApp);
    serverDb = getFirestore(serverApp);
    serverStorage = getStorage(serverApp);
  }
} catch (error) {
  console.error('Error initializing server Firebase:', error);
}

export { serverApp, serverAuth, serverDb, serverStorage };

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