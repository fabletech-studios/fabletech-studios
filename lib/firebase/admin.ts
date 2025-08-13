import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // For production/Vercel environment
    if (process.env.VERCEL) {
      // On Vercel, use application default credentials
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Use service account credentials from environment variable
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });
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

// Helper function to verify ID token
export async function verifyIdToken(token: string) {
  try {
    if (!adminAuth) {
      // Fallback to simple token parsing if admin SDK not available
      console.warn('Using fallback token verification - not secure for production');
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      const uid = payload.user_id || payload.sub || payload.uid;
      if (!uid) {
        throw new Error('Invalid token - no uid');
      }
      return { success: true, uid, decodedToken: payload };
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