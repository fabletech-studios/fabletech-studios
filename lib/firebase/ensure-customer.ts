import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';
import { User } from 'firebase/auth';

/**
 * Ensures a customer document exists for the given user.
 * This is particularly important for Google OAuth users.
 */
export async function ensureCustomerDocument(user: User) {
  if (!db) {
    console.error('Firebase database not initialized');
    return false;
  }
  
  try {
    const customerRef = doc(db, 'customers', user.uid);
    const customerDoc = await getDoc(customerRef);
    
    if (!customerDoc.exists()) {
      console.log('Creating customer document for user:', user.uid);
      
      const customerData = {
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || 'User',
        credits: 100, // Welcome bonus
        createdAt: new Date(),
        updatedAt: new Date(),
        authProvider: user.providerData[0]?.providerId === 'google.com' ? 'google' : 'email',
        photoURL: user.photoURL || '',
        emailVerified: user.emailVerified || false,
        unlockedEpisodes: [],
        stats: {
          episodesUnlocked: 0,
          creditsSpent: 0,
          totalCreditsPurchased: 0,
          seriesCompleted: 0
        },
        subscription: {
          status: 'active',
          tier: 'free'
        }
      };
      
      await setDoc(customerRef, customerData);
      console.log('Customer document created successfully');
      return true;
    } else {
      // Check for missing fields and update if needed
      const data = customerDoc.data();
      const updates: any = {};
      
      if (!data.unlockedEpisodes) {
        updates.unlockedEpisodes = [];
      }
      
      if (!data.stats) {
        updates.stats = {
          episodesUnlocked: 0,
          creditsSpent: 0,
          totalCreditsPurchased: 0,
          seriesCompleted: 0
        };
      }
      
      if (!data.subscription) {
        updates.subscription = {
          status: 'active',
          tier: 'free'
        };
      }
      
      if (Object.keys(updates).length > 0) {
        console.log('Updating customer document with missing fields:', updates);
        await setDoc(customerRef, updates, { merge: true });
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error ensuring customer document:', error);
    return false;
  }
}