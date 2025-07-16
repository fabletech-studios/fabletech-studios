// Client-safe Firebase connection check functions
// These can be used in both client and server contexts

import { db, storage } from './config';
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';

// Check if we can connect to Firestore
export async function checkFirestoreConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/test-firestore');
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.warn('Firestore connection test failed:', error);
    return false;
  }
}

// Check if we can connect to Storage
export async function checkStorageConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/test-storage');
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.warn('Storage connection test failed:', error);
    return false;
  }
}