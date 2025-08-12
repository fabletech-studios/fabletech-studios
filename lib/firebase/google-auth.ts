import { 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from './config';

const googleProvider = new GoogleAuthProvider();

export interface GoogleAuthResult {
  success: boolean;
  user?: any;
  token?: string;
  error?: string;
  isNewUser?: boolean;
}

/**
 * Sign in with Google using popup (preferred for desktop)
 */
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  try {
    // Use popup for desktop
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, COLLECTIONS.CUSTOMERS, user.uid));
    
    let customerData;
    let isNewUser = false;
    
    if (!userDoc.exists()) {
      // New user - create customer document
      isNewUser = true;
      customerData = {
        uid: user.uid,
        email: user.email!,
        name: user.displayName || 'Google User',
        credits: 100, // Welcome bonus
        createdAt: new Date(),
        updatedAt: new Date(),
        authProvider: 'google',
        photoURL: user.photoURL || '',
        subscription: {
          status: 'active',
          tier: 'free'
        }
      };
      
      await setDoc(doc(db, COLLECTIONS.CUSTOMERS, user.uid), customerData);
      
      // Trigger welcome email via API (server-side only)
      fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName || 'Google User',
          isGoogleAuth: true
        })
      }).catch(error => {
        console.error('Failed to trigger welcome email:', error);
      });
    } else {
      // Existing user
      customerData = userDoc.data();
    }
    
    // Get ID token for API calls
    const token = await user.getIdToken();
    
    return {
      success: true,
      user,
      token,
      isNewUser,
      customerData
    };
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    
    let errorMessage = 'Failed to sign in with Google';
    
    if (error.code) {
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in cancelled';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup blocked. Please allow popups for this site.';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'An account already exists with this email.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Sign in with Google using redirect (better for mobile)
 */
export async function signInWithGoogleRedirect() {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error: any) {
    console.error('Google redirect error:', error);
    throw error;
  }
}

/**
 * Handle redirect result after Google sign-in
 */
export async function handleGoogleRedirect(): Promise<GoogleAuthResult | null> {
  try {
    const result = await getRedirectResult(auth);
    
    if (!result) {
      return null; // No redirect result
    }
    
    const user = result.user;
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, COLLECTIONS.CUSTOMERS, user.uid));
    
    let customerData;
    let isNewUser = false;
    
    if (!userDoc.exists()) {
      // New user - create customer document
      isNewUser = true;
      customerData = {
        uid: user.uid,
        email: user.email!,
        name: user.displayName || 'Google User',
        credits: 100, // Welcome bonus
        createdAt: new Date(),
        updatedAt: new Date(),
        authProvider: 'google',
        photoURL: user.photoURL || '',
        subscription: {
          status: 'active',
          tier: 'free'
        }
      };
      
      await setDoc(doc(db, COLLECTIONS.CUSTOMERS, user.uid), customerData);
      
      // Trigger welcome email via API (server-side only)
      fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName || 'Google User',
          isGoogleAuth: true
        })
      }).catch(error => {
        console.error('Failed to trigger welcome email:', error);
      });
    } else {
      // Existing user
      customerData = userDoc.data();
    }
    
    // Get ID token for API calls
    const token = await user.getIdToken();
    
    return {
      success: true,
      user,
      token,
      isNewUser,
      customerData
    };
  } catch (error: any) {
    console.error('Handle redirect error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}