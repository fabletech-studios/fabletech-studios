import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Check if we have individual credentials
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      // Use individual environment variables
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Replace escaped newlines
      };
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });
      console.log('Firebase Admin initialized with service account credentials');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Use full service account JSON from environment variable
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });
      console.log('Firebase Admin initialized with full service account JSON');
    } else {
      // Fallback - initialize without credentials (will only work for public operations)
      console.warn('Firebase Admin SDK initialized without credentials - some operations may fail');
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

export const adminAuth = admin.apps.length > 0 ? admin.auth() : null;
export const adminDb = admin.apps.length > 0 ? admin.firestore() : null;
export const adminStorage = admin.apps.length > 0 ? admin.storage() : null;

// Export getter functions for lazy initialization
export async function getAdminDb() {
  return adminDb;
}

export async function getAdminStorage() {
  return adminStorage;
}

// Helper function to verify ID token
export async function verifyIdToken(token: string) {
  try {
    if (!adminAuth) {
      // No fallback - Admin SDK is required for secure token verification
      throw new Error('Firebase Admin SDK not initialized - cannot verify tokens securely');
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    return { success: true, uid: decodedToken.uid, decodedToken };
  } catch (error: any) {
    console.error('Token verification failed:', error);
    return { success: false, error: error.message };
  }
}

// Server-side unlock episode function that bypasses security rules
export async function unlockEpisodeAdmin(
  uid: string,
  seriesId: string,
  episodeNumber: number,
  creditCost: number
) {
  try {
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }
    
    const result = await adminDb.runTransaction(async (transaction) => {
      const customerRef = adminDb.collection('customers').doc(uid);
      const customerDoc = await transaction.get(customerRef);
      
      if (!customerDoc.exists) {
        throw new Error('Customer not found');
      }
      
      const customer = customerDoc.data();
      if (!customer) {
        throw new Error('Customer data not found');
      }
      
      // Check if already unlocked
      const unlockedEpisodes = customer.unlockedEpisodes || [];
      const alreadyUnlocked = unlockedEpisodes.some(
        (ep: any) => ep.seriesId === seriesId && ep.episodeNumber === episodeNumber
      );
      
      if (alreadyUnlocked) {
        return { alreadyUnlocked: true, credits: customer.credits };
      }
      
      // Check credits
      if (customer.credits < creditCost) {
        throw new Error('Insufficient credits');
      }
      
      // Update customer
      const newCredits = customer.credits - creditCost;
      const updatedUnlockedEpisodes = [
        ...unlockedEpisodes,
        {
          seriesId,
          episodeNumber,
          unlockedAt: admin.firestore.Timestamp.now()
        }
      ];
      
      // Update customer document
      transaction.update(customerRef, {
        credits: newCredits,
        unlockedEpisodes: updatedUnlockedEpisodes,
        'stats.episodesUnlocked': admin.firestore.FieldValue.increment(1),
        'stats.creditsSpent': admin.firestore.FieldValue.increment(creditCost)
      });
      
      // Create transaction record
      const transactionRef = adminDb.collection('credit-transactions').doc();
      transaction.set(transactionRef, {
        customerId: uid,
        type: 'spend',
        amount: -creditCost,
        balance: newCredits,
        description: `Unlocked episode ${episodeNumber}`,
        metadata: { seriesId, episodeNumber },
        createdAt: admin.firestore.Timestamp.now()
      });
      
      return { success: true, credits: newCredits };
    });
    
    return { 
      success: true, 
      remainingCredits: result.credits,
      alreadyUnlocked: result.alreadyUnlocked || false
    };
  } catch (error: any) {
    console.error('Admin unlock episode error:', error);
    return { success: false, error: error.message };
  }
}

// Get customer data using admin SDK
export async function getCustomerAdmin(uid: string) {
  try {
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }
    
    const doc = await adminDb.collection('customers').doc(uid).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Get customer admin error:', error);
    return null;
  }
}