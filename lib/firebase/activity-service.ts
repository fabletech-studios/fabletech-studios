import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { serverDb } from './server-config';

// Helper to get the appropriate database instance
const getDb = () => {
  if (typeof window === 'undefined') {
    return serverDb;
  } else {
    return db;
  }
};

export interface UserActivity {
  id?: string;
  userId: string;
  type: 'episode_unlocked' | 'episode_watched' | 'credits_purchased' | 'credits_spent' | 'badge_earned';
  description: string;
  metadata?: {
    seriesId?: string;
    seriesTitle?: string;
    episodeNumber?: number;
    episodeTitle?: string;
    creditsAmount?: number;
    creditsPurchased?: number;
    badgeId?: string;
    badgeName?: string;
    badgeRarity?: string;
  };
  createdAt: any;
}

// Add activity record
export async function addUserActivity(activity: Omit<UserActivity, 'id' | 'createdAt'>): Promise<boolean> {
  try {
    const database = getDb();
    if (!database) return false;
    
    await addDoc(collection(database, 'userActivities'), {
      ...activity,
      createdAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error adding user activity:', error);
    return false;
  }
}

// Get user activities
export async function getUserActivities(userId: string, limitCount: number = 10): Promise<UserActivity[]> {
  try {
    const database = getDb();
    if (!database) return [];
    
    // Simplified query to avoid index requirement
    // Just get by userId and sort client-side
    const q = query(
      collection(database, 'userActivities'),
      where('userId', '==', userId),
      limit(50) // Get more and sort client-side
    );
    
    const snapshot = await getDocs(q);
    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as UserActivity));
    
    // Sort by createdAt client-side
    activities.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
    
    // Return only the requested limit
    return activities.slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return [];
  }
}

// Helper to format activity timestamp
export function formatActivityTime(timestamp: any): string {
  if (!timestamp) return '';
  
  let date: Date;
  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate();
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}