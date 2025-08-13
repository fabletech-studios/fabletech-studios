import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * Fix missing fields for existing customers (especially Google OAuth users)
 */
export async function fixCustomerFields(uid: string) {
  try {
    const customerRef = doc(db, 'customers', uid);
    const customerDoc = await getDoc(customerRef);
    
    if (!customerDoc.exists()) {
      console.error('Customer not found:', uid);
      return false;
    }
    
    const data = customerDoc.data();
    const updates: any = {};
    
    // Add missing fields
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
    
    if (data.emailVerified === undefined) {
      // Google users have verified emails by default
      updates.emailVerified = data.authProvider === 'google' ? true : false;
    }
    
    // Only update if there are missing fields
    if (Object.keys(updates).length > 0) {
      console.log('Fixing customer fields for:', uid, updates);
      await updateDoc(customerRef, updates);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error fixing customer fields:', error);
    return false;
  }
}