import { getAdminAuth, getAdminDb } from './admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface AdminCustomerData {
  uid: string;
  email: string;
  name: string;
  credits: number;
  createdAt: FieldValue;
  emailVerified: boolean;
  unlockedEpisodes: Array<{
    seriesId: string;
    episodeNumber: number;
    unlockedAt: string;
  }>;
  stats: {
    episodesUnlocked: number;
    creditsSpent: number;
  };
}

export async function createCustomerWithAdmin(
  email: string,
  password: string,
  name: string
): Promise<{ success: boolean; error?: string; uid?: string; token?: string }> {
  try {
    const auth = getAdminAuth();
    const db = getAdminDb();

    if (!auth || !db) {
      console.error('Firebase Admin not initialized');
      return { success: false, error: 'Firebase Admin not initialized' };
    }

    // Create user in Firebase Auth
    console.log('Creating Firebase Auth user...');
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: false
    });

    console.log('Firebase Auth user created:', userRecord.uid);

    // Create customer document in Firestore
    const customerData = {
      uid: userRecord.uid,
      email: userRecord.email!,
      name,
      credits: 100, // Starting credits
      createdAt: FieldValue.serverTimestamp(),
      emailVerified: false,
      unlockedEpisodes: [],
      stats: {
        episodesUnlocked: 0,
        creditsSpent: 0
      }
    };

    console.log('Creating Firestore customer document...');
    await db.collection('customers').doc(userRecord.uid).set(customerData);
    console.log('Customer document created');

    // Create custom token for immediate sign-in
    const customToken = await auth.createCustomToken(userRecord.uid);

    return { 
      success: true, 
      uid: userRecord.uid,
      token: customToken
    };
  } catch (error: any) {
    console.error('Admin create customer error:', error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      return { success: false, error: 'Email already in use' };
    } else if (error.code === 'auth/invalid-email') {
      return { success: false, error: 'Invalid email address' };
    } else if (error.code === 'auth/weak-password') {
      return { success: false, error: 'Password is too weak' };
    }
    
    return { success: false, error: error.message || 'Failed to create account' };
  }
}

export async function getCustomerByUid(uid: string): Promise<AdminCustomerData | null> {
  try {
    const db = getAdminDb();
    if (!db) return null;

    const doc = await db.collection('customers').doc(uid).get();
    if (!doc.exists) return null;

    return doc.data() as AdminCustomerData;
  } catch (error) {
    console.error('Error getting customer:', error);
    return null;
  }
}