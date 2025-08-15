import { adminDb } from './admin';
import admin from 'firebase-admin';
import { BADGES, Badge } from '@/lib/badges/badge-definitions';
import { addUserActivityAdmin } from './admin-activity-service';

export interface UserBadge {
  badgeId: string;
  earnedAt: any;
  notified: boolean;
}

/**
 * Check if user has earned a specific badge using Admin SDK
 */
export async function hasUserEarnedBadgeAdmin(userId: string, badgeId: string): Promise<boolean> {
  try {
    if (!adminDb) {
      console.error('[Badge] Admin DB not initialized');
      return false;
    }
    
    const userDoc = await adminDb.collection('customers').doc(userId).get();
    if (!userDoc.exists) return false;
    
    const userData = userDoc.data();
    const earnedBadges = userData?.earnedBadges || [];
    
    return earnedBadges.some((badge: UserBadge) => badge.badgeId === badgeId);
  } catch (error) {
    console.error('[Badge] Error checking badge:', error);
    return false;
  }
}

/**
 * Award badge to user using Admin SDK (bypasses Firestore rules)
 */
export async function awardBadgeAdmin(userId: string, badgeId: string): Promise<boolean> {
  try {
    if (!adminDb) {
      console.error('[Badge] Admin DB not initialized');
      return false;
    }
    
    // Check if already earned
    const alreadyEarned = await hasUserEarnedBadgeAdmin(userId, badgeId);
    if (alreadyEarned) {
      console.log(`[Badge] User ${userId} already has badge ${badgeId}`);
      return false;
    }
    
    const badge = BADGES.find(b => b.id === badgeId);
    if (!badge) {
      console.error(`[Badge] Badge ${badgeId} not found in definitions`);
      return false;
    }
    
    console.log(`[Badge] Awarding badge ${badgeId} to user ${userId}`);
    
    // Get current user doc to append badge
    const userDoc = await adminDb.collection('customers').doc(userId).get();
    const userData = userDoc.data() || {};
    const currentBadges = userData.earnedBadges || [];
    
    // Add new badge with timestamp
    const newBadge = {
      badgeId,
      earnedAt: admin.firestore.FieldValue.serverTimestamp(),
      notified: false
    };
    
    // Update user doc with new badge
    await adminDb.collection('customers').doc(userId).update({
      earnedBadges: [...currentBadges, newBadge],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`[Badge] Successfully awarded badge ${badgeId} to user ${userId}`);
    
    // Track activity
    await addUserActivityAdmin({
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
    console.error('[Badge] Error awarding badge:', error);
    return false;
  }
}

/**
 * Check and award badges based on user stats using Admin SDK
 */
export async function checkAndAwardBadgesAdmin(userId: string, userStats: any): Promise<string[]> {
  const awardedBadges: string[] = [];
  
  try {
    console.log(`[Badge] Checking badges for user ${userId} with stats:`, userStats);
    
    for (const badge of BADGES) {
      const alreadyEarned = await hasUserEarnedBadgeAdmin(userId, badge.id);
      if (alreadyEarned) {
        continue;
      }
      
      let shouldAward = false;
      
      switch (badge.criteria.type) {
        case 'episodes_unlocked':
          shouldAward = userStats.episodesUnlocked >= badge.criteria.value;
          console.log(`[Badge] ${badge.id}: episodes_unlocked ${userStats.episodesUnlocked} >= ${badge.criteria.value} = ${shouldAward}`);
          break;
          
        case 'credits_purchased':
          shouldAward = userStats.totalCreditsPurchased >= badge.criteria.value;
          console.log(`[Badge] ${badge.id}: credits_purchased ${userStats.totalCreditsPurchased} >= ${badge.criteria.value} = ${shouldAward}`);
          break;
          
        case 'series_completed':
          shouldAward = userStats.seriesCompleted >= badge.criteria.value;
          console.log(`[Badge] ${badge.id}: series_completed ${userStats.seriesCompleted} >= ${badge.criteria.value} = ${shouldAward}`);
          break;
          
        case 'account_age':
          // Special check for early adopter (beta period)
          if (badge.id === 'early_adopter') {
            const betaEndDate = new Date('2025-12-31'); // Adjust this date
            const accountCreatedDate = userStats.createdAt ? 
              (userStats.createdAt.toDate ? userStats.createdAt.toDate() : new Date(userStats.createdAt)) :
              new Date();
            shouldAward = accountCreatedDate < betaEndDate;
            console.log(`[Badge] ${badge.id}: account created ${accountCreatedDate} < ${betaEndDate} = ${shouldAward}`);
          }
          break;
          
        case 'episodes_in_row':
          // Check recent activity for binge watching
          if (badge.criteria.timeframe) {
            shouldAward = await checkBingeActivityAdmin(userId, badge.criteria.value, badge.criteria.timeframe);
            console.log(`[Badge] ${badge.id}: binge activity = ${shouldAward}`);
          }
          break;
      }
      
      if (shouldAward) {
        console.log(`[Badge] User ${userId} qualifies for badge ${badge.id}`);
        const awarded = await awardBadgeAdmin(userId, badge.id);
        if (awarded) {
          awardedBadges.push(badge.id);
          console.log(`[Badge] Successfully awarded ${badge.id} to ${userId}`);
        }
      }
    }
    
    if (awardedBadges.length > 0) {
      console.log(`[Badge] Total badges awarded to ${userId}:`, awardedBadges);
    } else {
      console.log(`[Badge] No new badges awarded to ${userId}`);
    }
  } catch (error) {
    console.error('[Badge] Error checking badges:', error);
  }
  
  return awardedBadges;
}

/**
 * Check for binge watching activity using Admin SDK
 */
async function checkBingeActivityAdmin(userId: string, episodeCount: number, days: number): Promise<boolean> {
  try {
    if (!adminDb) {
      console.error('[Badge] Admin DB not initialized');
      return false;
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get user activities
    const snapshot = await adminDb.collection('userActivities')
      .where('userId', '==', userId)
      .where('type', '==', 'episode_unlocked')
      .limit(100)
      .get();
    
    // Filter for activities within timeframe
    const recentEpisodes = snapshot.docs.filter(doc => {
      const data = doc.data();
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
    
    const qualifies = Object.values(episodesByDay).some(count => count >= episodeCount);
    console.log(`[Badge] Binge check for ${userId}: ${qualifies} (episodes by day:`, episodesByDay, ')');
    
    return qualifies;
  } catch (error) {
    console.error('[Badge] Error checking binge activity:', error);
    return false;
  }
}

/**
 * Get user's earned badges using Admin SDK
 */
export async function getUserBadgesAdmin(userId: string): Promise<(Badge & UserBadge)[]> {
  try {
    if (!adminDb) {
      console.error('[Badge] Admin DB not initialized');
      return [];
    }
    
    const userDoc = await adminDb.collection('customers').doc(userId).get();
    if (!userDoc.exists) return [];
    
    const userData = userDoc.data();
    const earnedBadges = userData?.earnedBadges || [];
    
    return earnedBadges.map((userBadge: UserBadge) => {
      const badge = BADGES.find(b => b.id === userBadge.badgeId);
      if (!badge) return null;
      
      return {
        ...badge,
        ...userBadge
      };
    }).filter(Boolean);
  } catch (error) {
    console.error('[Badge] Error getting user badges:', error);
    return [];
  }
}