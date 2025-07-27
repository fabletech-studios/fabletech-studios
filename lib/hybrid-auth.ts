// Hybrid Authentication System
// Uses local authentication but stores data in Firebase Firestore/Storage

import { db, storage } from './firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { 
  createCustomer as createLocalCustomer,
  verifyCustomer as verifyLocalCustomer,
  generateToken,
  getCustomerById as getLocalCustomerById,
  updateCustomer as updateLocalCustomer,
  generateResetToken as generateLocalResetToken,
  resetPasswordWithToken as resetLocalPasswordWithToken
} from './customer-auth-server';

// Customer interface that combines local auth with Firebase data
export interface HybridCustomer {
  id: string;
  email: string;
  name: string;
  credits: number;
  createdAt: string;
  // Firebase specific fields
  firebaseDocId?: string;
  syncedToFirebase?: boolean;
}

// Create customer with local auth and Firebase data
export async function createCustomerHybrid(
  email: string, 
  password: string, 
  name: string
): Promise<{ success: boolean; error?: string; customer?: HybridCustomer; token?: string }> {
  try {
    // Step 1: Create local customer
    const localResult = await createLocalCustomer(email, password, name);
    
    if (!localResult.success || !localResult.customer) {
      return { success: false, error: localResult.error };
    }
    
    const localCustomer = localResult.customer;
    
    // Step 2: Try to sync to Firestore (non-blocking)
    let firebaseDocId: string | undefined;
    let syncedToFirebase = false;
    
    if (db) {
      try {
        const customerData = {
          id: localCustomer.id,
          email: localCustomer.email,
          name: localCustomer.name,
          credits: localCustomer.credits,
          createdAt: localCustomer.createdAt,
          source: 'hybrid-local'
        };
        
        // Use email as document ID for easy lookups
        const docRef = doc(db, 'customers', localCustomer.id);
        await setDoc(docRef, customerData);
        
        firebaseDocId = docRef.id;
        syncedToFirebase = true;
        // Customer synced to Firestore
      } catch (firebaseError) {
        console.warn('Failed to sync to Firestore (will work locally):', firebaseError);
        // Continue without Firebase - local auth still works
      }
    } else {
      // Firestore not available, using local storage only
    }
    
    const hybridCustomer: HybridCustomer = {
      ...localCustomer,
      firebaseDocId,
      syncedToFirebase
    };
    
    // Generate token
    const token = generateToken(localCustomer);
    
    return {
      success: true,
      customer: hybridCustomer,
      token
    };
  } catch (error: any) {
    console.error('Error creating hybrid customer:', error);
    return {
      success: false,
      error: error.message || 'Failed to create account'
    };
  }
}

// Sign in with hybrid approach
export async function signInCustomerHybrid(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; customer?: HybridCustomer; token?: string }> {
  try {
    // Step 1: Verify with local auth
    const localResult = await verifyLocalCustomer(email, password);
    
    if (!localResult.success || !localResult.customer) {
      return { success: false, error: localResult.error };
    }
    
    const localCustomer = localResult.customer;
    
    // Step 2: Try to get latest data from Firestore
    let firebaseData: any = null;
    let syncedToFirebase = false;
    
    if (db) {
      try {
        const docRef = doc(db, 'customers', localCustomer.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          firebaseData = docSnap.data();
          syncedToFirebase = true;
          
          // Update local data with Firebase data (Firebase is source of truth for credits)
          if (firebaseData.credits !== undefined) {
            await updateLocalCustomer(localCustomer.id, { credits: firebaseData.credits });
          }
        }
      } catch (firebaseError) {
        console.warn('Failed to get Firestore data (using local):', firebaseError);
      }
    }
    
    const hybridCustomer: HybridCustomer = {
      ...localCustomer,
      credits: firebaseData?.credits || localCustomer.credits,
      firebaseDocId: localCustomer.id,
      syncedToFirebase
    };
    
    // Generate token
    const token = generateToken(localCustomer);
    
    return {
      success: true,
      customer: hybridCustomer,
      token
    };
  } catch (error: any) {
    console.error('Error signing in hybrid customer:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign in'
    };
  }
}

// Update customer credits (syncs to both local and Firebase)
export async function updateCustomerCreditsHybrid(
  customerId: string,
  credits: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update local first
    const localSuccess = await updateLocalCustomer(customerId, { credits });
    
    if (!localSuccess) {
      return { success: false, error: 'Failed to update local data' };
    }
    
    // Try to update Firebase
    if (db) {
      try {
        const docRef = doc(db, 'customers', customerId);
        await updateDoc(docRef, { 
          credits,
          lastUpdated: new Date().toISOString()
        });
        // Credits synced to Firestore
      } catch (firebaseError) {
        console.warn('Failed to sync credits to Firestore:', firebaseError);
        // Local update succeeded, so we return success
      }
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating credits:', error);
    return {
      success: false,
      error: error.message || 'Failed to update credits'
    };
  }
}

// Get customer by ID (tries Firebase first, falls back to local)
export async function getCustomerByIdHybrid(
  customerId: string
): Promise<HybridCustomer | null> {
  try {
    // Try Firebase first
    if (db) {
      try {
        const docRef = doc(db, 'customers', customerId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const firebaseData = docSnap.data();
          return {
            id: customerId,
            email: firebaseData.email,
            name: firebaseData.name,
            credits: firebaseData.credits,
            createdAt: firebaseData.createdAt,
            firebaseDocId: docRef.id,
            syncedToFirebase: true
          };
        }
      } catch (firebaseError) {
        console.warn('Failed to get from Firestore, trying local:', firebaseError);
      }
    }
    
    // Fall back to local
    const localCustomer = await getLocalCustomerById(customerId);
    
    if (localCustomer) {
      return {
        ...localCustomer,
        syncedToFirebase: false
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting customer:', error);
    return null;
  }
}

// Password reset functions (local only since it involves password)
export async function sendPasswordResetHybrid(email: string) {
  return await generateLocalResetToken(email);
}

export async function resetPasswordHybrid(token: string, newPassword: string) {
  return await resetLocalPasswordWithToken(token, newPassword);
}

// Check if we can connect to Firestore
export async function checkFirestoreConnection(): Promise<boolean> {
  if (!db) {
    console.warn('Firestore not initialized');
    return false;
  }
  
  try {
    // Try a simple read operation
    const testCollection = collection(db, 'test-connection');
    const q = query(testCollection, where('test', '==', true));
    await getDocs(q);
    return true;
  } catch (error) {
    console.warn('Firestore connection test failed:', error);
    return false;
  }
}

// Check if we can connect to Storage
export async function checkStorageConnection(): Promise<boolean> {
  try {
    // Storage check will be implemented when we test uploads
    return !!storage;
  } catch (error) {
    console.warn('Storage connection test failed:', error);
    return false;
  }
}