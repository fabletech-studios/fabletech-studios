import { adminDb } from './admin';
import admin from 'firebase-admin';
import { UserActivity } from './activity-service';

/**
 * Add user activity using Admin SDK (bypasses Firestore rules)
 */
export async function addUserActivityAdmin(activity: Omit<UserActivity, 'id' | 'createdAt'>): Promise<boolean> {
  try {
    if (!adminDb) {
      console.error('[Activity] Admin DB not initialized');
      return false;
    }
    
    console.log('[Activity] Creating activity for user:', activity.userId, 'Type:', activity.type);
    
    await adminDb.collection('userActivities').add({
      ...activity,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('[Activity] Activity created successfully');
    return true;
  } catch (error) {
    console.error('[Activity] Error adding user activity:', error);
    return false;
  }
}

/**
 * Get user activities using Admin SDK
 */
export async function getUserActivitiesAdmin(userId: string, limitCount: number = 10): Promise<UserActivity[]> {
  try {
    if (!adminDb) {
      console.error('[Activity] Admin DB not initialized');
      return [];
    }
    
    // Get activities without ordering to avoid index requirement
    const snapshot = await adminDb.collection('userActivities')
      .where('userId', '==', userId)
      .limit(50)
      .get();
    
    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    } as UserActivity));
    
    // Sort by createdAt client-side
    activities.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
    
    // Return only the requested limit
    return activities.slice(0, limitCount);
  } catch (error) {
    console.error('[Activity] Error fetching user activities:', error);
    return [];
  }
}