import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  onAuthStateChanged,
  getIdToken
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from './config';
import { sendWelcomeEmail } from '@/lib/email/email-service';

export interface CustomerData {
  uid: string;
  email: string;
  name: string;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
  subscription?: {
    status: 'active' | 'inactive' | 'cancelled';
    tier: 'free' | 'basic' | 'premium';
    expiresAt?: Date;
  };
}

// Create a new customer account
export async function createCustomer(email: string, password: string, name: string) {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, { displayName: name });

    // Create customer document in Firestore
    const customerData: CustomerData = {
      uid: user.uid,
      email: user.email!,
      name,
      credits: 100, // Starting credits
      createdAt: new Date(),
      updatedAt: new Date(),
      subscription: {
        status: 'active',
        tier: 'free'
      }
    };

    await setDoc(doc(db, COLLECTIONS.CUSTOMERS, user.uid), customerData);

    // Send welcome email (don't block the signup process)
    sendWelcomeEmail(user.email!, name, false).catch(error => {
      console.error('Failed to send welcome email:', error);
    });

    // Get ID token for API calls
    const token = await getIdToken(user);

    return {
      success: true,
      user,
      token,
      customerData
    };
  } catch (error: any) {
    console.error('Error creating customer:', error);
    
    // Provide more detailed error messages
    let errorMessage = error.message || 'Failed to create account';
    
    if (error.code) {
      switch (error.code) {
        case 'auth/network-request-failed':
          errorMessage = 'Network error: Unable to connect to Firebase. Please check your internet connection and Firebase configuration.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/Password authentication is not enabled in Firebase. Please enable it in the Firebase Console.';
          break;
        case 'auth/configuration-not-found':
          errorMessage = 'Firebase configuration not found. Please check your Firebase project settings.';
          break;
        case 'auth/invalid-api-key':
          errorMessage = 'Invalid Firebase API key. Please check your configuration.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please use at least 6 characters.';
          break;
        default:
          errorMessage = `Firebase Auth Error (${error.code}): ${error.message}`;
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

// Sign in customer
export async function signInCustomer(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get customer data from Firestore
    const customerDoc = await getDoc(doc(db, COLLECTIONS.CUSTOMERS, user.uid));
    const customerData = customerDoc.data() as CustomerData;

    // Get ID token for API calls
    const token = await getIdToken(user);

    return {
      success: true,
      user,
      token,
      customerData
    };
  } catch (error: any) {
    console.error('Error signing in:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign in'
    };
  }
}

// Sign out customer
export async function signOutCustomer() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error('Error signing out:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign out'
    };
  }
}

// Send password reset email
export async function sendPasswordReset(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending password reset:', error);
    return {
      success: false,
      error: error.message || 'Failed to send password reset email'
    };
  }
}

// Get current user data
export async function getCurrentCustomer(user: User): Promise<CustomerData | null> {
  try {
    const customerDoc = await getDoc(doc(db, COLLECTIONS.CUSTOMERS, user.uid));
    if (customerDoc.exists()) {
      return customerDoc.data() as CustomerData;
    }
    return null;
  } catch (error) {
    console.error('Error getting customer data:', error);
    return null;
  }
}

// Update customer credits
export async function updateCustomerCredits(uid: string, credits: number) {
  try {
    await updateDoc(doc(db, COLLECTIONS.CUSTOMERS, uid), {
      credits,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating credits:', error);
    return {
      success: false,
      error: error.message || 'Failed to update credits'
    };
  }
}

// Auth state observer
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}