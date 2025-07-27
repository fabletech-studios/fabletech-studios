import { 
  collection, 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './config';
import { serverDb } from './server-config';
import { BADGES, Badge } from '@/lib/badges/badge-definitions';
import { addUserActivity } from './activity-service';

// Helper to get the appropriate database instance
const getDb = () => {
  if (typeof window === 'undefined') {
    return serverDb;
  } else {
    return db;
  }
};

export interface UserBadge {
  badgeId: string;
  earnedAt: any;
  notified: boolean;
}

export interface BadgeProgress {
  badgeId: string;
  currentValue: number;
  targetValue: number;
  percentage: number;
}

// Check if user has earned a specific badge
export async function hasUserEarnedBadge(userId: string, badgeId: string): Promise<boolean> {
  try {
    const database = getDb();
    if (!database) return false;
    
    const userDoc = await getDoc(doc(database, 'customers', userId));
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    const earnedBadges = userData.earnedBadges || [];
    
    return earnedBadges.some((badge: UserBadge) => badge.badgeId === badgeId);
  } catch (error) {
    console.error('Error checking badge:', error);
    return false;
  }
}

// Award badge to user
export async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
  try {
    const database = getDb();
    if (!database) return false;
    
    // Check if already earned
    const alreadyEarned = await hasUserEarnedBadge(userId, badgeId);
    if (alreadyEarned) return false;
    
    const badge = BADGES.find(b => b.id === badgeId);
    if (!badge) return false;
    
    // Get current user doc to append badge
    const userDoc = await getDoc(doc(database, 'customers', userId));
    const userData = userDoc.data() || {};
    const currentBadges = userData.earnedBadges || [];
    
    // Add new badge with timestamp
    const newBadge = {
      badgeId,
      earnedAt: new Date().toISOString(),
      notified: false
    };
    
    // Update user doc with new badge
    await updateDoc(doc(database, 'customers', userId), {
      earnedBadges: [...currentBadges, newBadge],
      updatedAt: serverTimestamp()
    });
    
    // Track activity
    await addUserActivity({
      userId,
      type: 'badge_earned' as any,
      description: `Earned "${badge.name}" badge`,
      metadata: {
        badgeId,
        badgeName: badge.name,
        badgeRarity: badge.rarity
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error awarding badge:', error);
    return false;
  }
}

// Check and award badges based on user stats
export async function checkAndAwardBadges(userId: string, userStats: any): Promise<string[]> {
  const awardedBadges: string[] = [];
  
  try {
    // Checking badges for user stats
    
    for (const badge of BADGES) {
      const alreadyEarned = await hasUserEarnedBadge(userId, badge.id);
      if (alreadyEarned) {
        // Badge already earned
        continue;
      }
      
      let shouldAward = false;
      
      switch (badge.criteria.type) {
        case 'episodes_unlocked':
          shouldAward = userStats.episodesUnlocked >= badge.criteria.value;
          // Checking episodes_unlocked criteria
          break;
          
        case 'credits_purchased':
          shouldAward = userStats.totalCreditsPurchased >= badge.criteria.value;
          break;
          
        case 'series_completed':
          shouldAward = userStats.seriesCompleted >= badge.criteria.value;
          break;
          
        case 'account_age':
          // Special check for early adopter (beta period)
          if (badge.id === 'early_adopter') {
            const betaEndDate = new Date('2025-12-31'); // Adjust this date
            const accountCreatedDate = new Date(userStats.createdAt);
            shouldAward = accountCreatedDate < betaEndDate;
          }
          break;
          
        case 'episodes_in_row':
          // Check recent activity for binge watching
          if (badge.criteria.timeframe) {
            shouldAward = await checkBingeActivity(userId, badge.criteria.value, badge.criteria.timeframe);
          }
          break;
      }
      
      if (shouldAward) {
        const awarded = await awardBadge(userId, badge.id);
        if (awarded) {
          awardedBadges.push(badge.id);
        }
      }
    }
  } catch (error) {
    console.error('Error checking badges:', error);
  }
  
  return awardedBadges;
}

// Check for binge watching activity
async function checkBingeActivity(userId: string, episodeCount: number, days: number): Promise<boolean> {
  try {
    const database = getDb();
    if (!database) return false;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Simplified query - just get user activities and filter client-side
    const q = query(
      collection(database, 'userActivities'),
      where('userId', '==', userId),
      limit(100)
    );
    
    const snapshot = await getDocs(q);
    
    // Filter for episode_unlocked activities within timeframe
    const recentEpisodes = snapshot.docs.filter(doc => {
      const data = doc.data();
      if (data.type !== 'episode_unlocked') return false;
      
      const activityDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      return activityDate >= startDate;
    });
    
    // Group by day and check if any day has enough episodes
    const episodesByDay: { [key: string]: number } = {};
    
    recentEpisodes.forEach(doc => {
      const data = doc.data();
      const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      const dayKey = date.toISOString().split('T')[0];
      episodesByDay[dayKey] = (episodesByDay[dayKey] || 0) + 1;
    });
    
    return Object.values(episodesByDay).some(count => count >= episodeCount);
  } catch (error) {
    console.error('Error checking binge activity:', error);
    return false;
  }
}

// Get user's earned badges
export async function getUserBadges(userId: string): Promise<(Badge & UserBadge)[]> {
  try {
    const database = getDb();
    if (!database) return [];
    
    const userDoc = await getDoc(doc(database, 'customers', userId));
    if (!userDoc.exists()) return [];
    
    const userData = userDoc.data();
    const earnedBadges = userData.earnedBadges || [];
    
    return earnedBadges.map((userBadge: UserBadge) => {
      const badge = BADGES.find(b => b.id === userBadge.badgeId);
      if (!badge) return null;
      
      return {
        ...badge,
        ...userBadge
      };
    }).filter(Boolean);
  } catch (error) {
    console.error('Error getting user badges:', error);
    return [];
  }
}

// Get badge progress for user
export async function getUserBadgeProgress(userId: string, userStats: any): Promise<BadgeProgress[]> {
  const progress: BadgeProgress[] = [];
  
  try {
    for (const badge of BADGES) {
      const alreadyEarned = await hasUserEarnedBadge(userId, badge.id);
      if (alreadyEarned) continue;
      
      let currentValue = 0;
      let targetValue = badge.criteria.value;
      
      switch (badge.criteria.type) {
        case 'episodes_unlocked':
          currentValue = userStats.episodesUnlocked || 0;
          break;
          
        case 'credits_purchased':
          currentValue = userStats.totalCreditsPurchased || 0;
          break;
          
        case 'series_completed':
          currentValue = userStats.seriesCompleted || 0;
          break;
          
        case 'episodes_in_row':
          // For binge badges, show as 0 or 100%
          const hasBinged = await checkBingeActivity(userId, badge.criteria.value, badge.criteria.timeframe || 1);
          currentValue = hasBinged ? targetValue : 0;
          break;
      }
      
      // Don't show progress for special badges like early adopter
      if (badge.id === 'early_adopter') continue;
      
      const percentage = Math.min(100, Math.round((currentValue / targetValue) * 100));
      
      progress.push({
        badgeId: badge.id,
        currentValue,
        targetValue,
        percentage
      });
    }
  } catch (error) {
    console.error('Error calculating badge progress:', error);
  }
  
  return progress.sort((a, b) => b.percentage - a.percentage);
}

// Mark badges as notified
export async function markBadgesAsNotified(userId: string, badgeIds: string[]): Promise<void> {
  try {
    const database = getDb();
    if (!database) return;
    
    const userDoc = await getDoc(doc(database, 'customers', userId));
    if (!userDoc.exists()) return;
    
    const userData = userDoc.data();
    const earnedBadges = userData.earnedBadges || [];
    
    const updatedBadges = earnedBadges.map((badge: UserBadge) => {
      if (badgeIds.includes(badge.badgeId)) {
        return { ...badge, notified: true };
      }
      return badge;
    });
    
    await updateDoc(doc(database, 'customers', userId), {
      earnedBadges: updatedBadges
    });
  } catch (error) {
    console.error('Error marking badges as notified:', error);
  }
}