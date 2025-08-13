import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  addDoc,
  serverTimestamp,
  increment,
  runTransaction
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithCustomToken,
  User
} from 'firebase/auth';
import { auth, db } from './config';
import { serverDb, serverAuth } from './server-config';

// Helper to get the appropriate auth instance
const getAuth = () => {
  if (typeof window === 'undefined') {
    return serverAuth;
  }
  return auth;
};

// Helper to get the appropriate database instance
const getDb = () => {
  if (typeof window === 'undefined') {
    return serverDb;
  }
  return db;
};

export interface FirebaseCustomer {
  uid: string;
  email: string;
  name: string;
  credits: number;
  createdAt: any;
  emailVerified: boolean;
  unlockedEpisodes?: Array<{
    seriesId: string;
    episodeNumber: number;
    unlockedAt: any;
  }>;
  stats?: {
    episodesUnlocked: number;
    creditsSpent: number;
  };
}

export interface CreditTransaction {
  customerId: string;
  type: 'purchase' | 'spend' | 'bonus';
  amount: number;
  balance: number;
  description: string;
  createdAt: any;
  metadata?: any;
}

// Create new customer with Firebase Auth and Firestore
export async function createFirebaseCustomer(
  email: string, 
  password: string, 
  name: string
): Promise<{ success: boolean; error?: string; user?: User; customer?: FirebaseCustomer }> {
  try {
    // Create Firebase Auth user
    const authInstance = getAuth();
    const dbInstance = getDb();
    
    if (!authInstance || !dbInstance) {
      return { success: false, error: 'Firebase not initialized' };
    }
    
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    const user = userCredential.user;

    // Create Firestore customer document
    const customerData: FirebaseCustomer = {
      uid: user.uid,
      email: user.email!,
      name,
      credits: 100, // Starting credits
      createdAt: serverTimestamp(),
      emailVerified: false,
      unlockedEpisodes: [],
      stats: {
        episodesUnlocked: 0,
        creditsSpent: 0
      }
    };

    await setDoc(doc(dbInstance, 'customers', user.uid), customerData);

    // Create initial credit transaction
    await addDoc(collection(dbInstance, 'credit-transactions'), {
      customerId: user.uid,
      type: 'bonus',
      amount: 100,
      balance: 100,
      description: 'Welcome bonus',
      createdAt: serverTimestamp()
    });

    // Send email verification
    await sendEmailVerification(user);

    return { success: true, user, customer: customerData };
  } catch (error: any) {
    console.error('Create customer error:', error);
    return { success: false, error: error.message };
  }
}

// Sign in customer
export async function signInFirebaseCustomer(
  email: string, 
  password: string
): Promise<{ success: boolean; error?: string; user?: User; customer?: FirebaseCustomer }> {
  try {
    const authInstance = getAuth();
    const dbInstance = getDb();
    
    if (!authInstance || !dbInstance) {
      return { success: false, error: 'Firebase not initialized' };
    }
    
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    const user = userCredential.user;

    // Get customer data from Firestore
    const customerDoc = await getDoc(doc(dbInstance, 'customers', user.uid));
    if (!customerDoc.exists()) {
      throw new Error('Customer data not found');
    }

    const customer = customerDoc.data() as FirebaseCustomer;
    return { success: true, user, customer };
  } catch (error: any) {
    console.error('Sign in error:', error);
    return { success: false, error: error.message };
  }
}

// Get customer by UID
export async function getFirebaseCustomer(uid: string): Promise<FirebaseCustomer | null> {
  try {
    const dbInstance = getDb();
    if (!dbInstance) return null;
    
    // Map Google OAuth UIDs to original customer UIDs
    const uidMapping: Record<string, string> = {
      'IIP8rWwMCeZ62Svix1lcZPyRkRj2': 'BAhEHbxh31MgdhAQJza3SVJ7cIh2', // oryshchynskyy@gmail.com
    };
    
    const mappedUid = uidMapping[uid] || uid;
    if (uid !== mappedUid) {
      console.log(`UID Mapping in getFirebaseCustomer: ${uid} -> ${mappedUid}`);
    }
    
    const customerRef = doc(dbInstance, 'customers', mappedUid);
    const customerDoc = await getDoc(customerRef);
    if (!customerDoc.exists()) {
      return null;
    }
    
    const data = customerDoc.data() as FirebaseCustomer;
    
    // Fix missing fields for existing users (especially Google OAuth users)
    const updates: any = {};
    
    // Only add unlockedEpisodes if it's undefined, not if it's an empty array
    if (data.unlockedEpisodes === undefined) {
      updates.unlockedEpisodes = [];
      data.unlockedEpisodes = [];
    }
    
    if (!data.stats) {
      updates.stats = {
        episodesUnlocked: 0,
        creditsSpent: 0,
        totalCreditsPurchased: 0,
        seriesCompleted: 0
      };
      data.stats = updates.stats;
    }
    
    // Apply updates if needed
    if (Object.keys(updates).length > 0) {
      console.log('Auto-fixing customer fields for:', uid, 'Updates:', updates);
      // Don't await this to avoid blocking the request
      updateDoc(customerRef, updates).catch(err => 
        console.error('Failed to auto-fix customer fields:', err)
      );
    }
    
    return data;
  } catch (error) {
    console.error('Get customer error:', error);
    return null;
  }
}

// Update customer data
export async function updateFirebaseCustomer(
  uid: string, 
  updates: Partial<FirebaseCustomer>
): Promise<boolean> {
  try {
    const dbInstance = getDb();
    if (!dbInstance) return false;
    
    // Map Google OAuth UIDs to original customer UIDs
    const uidMapping: Record<string, string> = {
      'IIP8rWwMCeZ62Svix1lcZPyRkRj2': 'BAhEHbxh31MgdhAQJza3SVJ7cIh2', // oryshchynskyy@gmail.com
    };
    
    const mappedUid = uidMapping[uid] || uid;
    if (uid !== mappedUid) {
      console.log(`UID Mapping in updateFirebaseCustomer: ${uid} -> ${mappedUid}`);
    }
    
    await updateDoc(doc(dbInstance, 'customers', mappedUid), updates);
    return true;
  } catch (error) {
    console.error('Update customer error:', error);
    return false;
  }
}

// Unlock episode with credit deduction
export async function unlockEpisodeFirebase(
  uid: string,
  seriesId: string,
  episodeNumber: number,
  creditCost: number
): Promise<{ success: boolean; error?: string; remainingCredits?: number }> {
  try {
    const dbInstance = getDb();
    if (!dbInstance) {
      return { success: false, error: 'Firebase not initialized' };
    }
    
    // Map Google OAuth UIDs to original customer UIDs
    const uidMapping: Record<string, string> = {
      'IIP8rWwMCeZ62Svix1lcZPyRkRj2': 'BAhEHbxh31MgdhAQJza3SVJ7cIh2', // oryshchynskyy@gmail.com
    };
    
    const mappedUid = uidMapping[uid] || uid;
    if (uid !== mappedUid) {
      console.log(`UID Mapping in unlockEpisodeFirebase: ${uid} -> ${mappedUid}`);
    }
    
    const result = await runTransaction(dbInstance, async (transaction) => {
      const customerRef = doc(dbInstance, 'customers', mappedUid);
      const customerDoc = await transaction.get(customerRef);

      if (!customerDoc.exists()) {
        throw new Error('Customer not found');
      }

      const customer = customerDoc.data() as FirebaseCustomer;

      // Check if already unlocked
      const alreadyUnlocked = customer.unlockedEpisodes?.some(
        ep => ep.seriesId === seriesId && ep.episodeNumber === episodeNumber
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
      const unlockedEpisodes = [
        ...(customer.unlockedEpisodes || []),
        {
          seriesId,
          episodeNumber,
          unlockedAt: new Date()
        }
      ];

      transaction.update(customerRef, {
        credits: newCredits,
        unlockedEpisodes,
        'stats.episodesUnlocked': increment(1),
        'stats.creditsSpent': increment(creditCost)
      });

      // Create transaction record
      const transactionRef = doc(collection(dbInstance, 'credit-transactions'));
      transaction.set(transactionRef, {
        customerId: mappedUid,
        type: 'spend',
        amount: -creditCost,
        balance: newCredits,
        description: `Unlocked episode ${episodeNumber}`,
        metadata: { seriesId, episodeNumber },
        createdAt: new Date()
      });

      return { success: true, credits: newCredits };
    });

    return { 
      success: true, 
      remainingCredits: result.credits 
    };
  } catch (error: any) {
    console.error('Unlock episode error:', error);
    return { success: false, error: error.message };
  }
}

// Add credits to customer
export async function addCreditsFirebase(
  uid: string,
  credits: number,
  description: string,
  type: 'purchase' | 'bonus' = 'purchase'
): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  try {
    const result = await runTransaction(db, async (transaction) => {
      const customerRef = doc(db, 'customers', uid);
      const customerDoc = await transaction.get(customerRef);

      if (!customerDoc.exists()) {
        throw new Error('Customer not found');
      }

      const customer = customerDoc.data() as FirebaseCustomer;
      const newBalance = customer.credits + credits;

      // Update customer credits
      transaction.update(customerRef, {
        credits: newBalance
      });

      // Create transaction record
      const transactionRef = doc(collection(db, 'credit-transactions'));
      transaction.set(transactionRef, {
        customerId: uid,
        type,
        amount: credits,
        balance: newBalance,
        description,
        createdAt: serverTimestamp()
      });

      return { newBalance };
    });

    return { success: true, newBalance: result.newBalance };
  } catch (error: any) {
    console.error('Add credits error:', error);
    return { success: false, error: error.message };
  }
}

// Send password reset email
export async function sendPasswordResetFirebase(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const authInstance = getAuth();
    if (!authInstance) {
      return { success: false, error: 'Firebase not initialized' };
    }
    
    await sendPasswordResetEmail(authInstance, email);
    return { success: true };
  } catch (error: any) {
    console.error('Password reset error:', error);
    return { success: false, error: error.message };
  }
}

// Get customer's unlocked episodes
export async function getUnlockedEpisodes(uid: string): Promise<Array<{ seriesId: string; episodeNumber: number }>> {
  try {
    const customer = await getFirebaseCustomer(uid);
    return customer?.unlockedEpisodes || [];
  } catch (error) {
    console.error('Get unlocked episodes error:', error);
    return [];
  }
}

// Get credit transactions
export async function getCreditTransactions(uid: string, limit: number = 50): Promise<CreditTransaction[]> {
  try {
    const q = query(
      collection(db, 'credit-transactions'),
      where('customerId', '==', uid),
      // orderBy('createdAt', 'desc'),
      // limit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as CreditTransaction & { id: string }));
  } catch (error) {
    console.error('Get transactions error:', error);
    return [];
  }
}