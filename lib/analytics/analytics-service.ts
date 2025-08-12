import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  query, 
  where, 
  orderBy, 
  limit,
  increment,
  serverTimestamp,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Analytics event types
export interface PlaybackEvent {
  userId: string;
  seriesId: string;
  episodeId: string;
  episodeNumber: number;
  seriesTitle: string;
  episodeTitle: string;
  timestamp: Date;
  duration: number; // seconds watched/listened
  completed: boolean;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  country?: string;
}

export interface PurchaseEvent {
  userId: string;
  amount: number;
  credits: number;
  timestamp: Date;
  paymentMethod: string;
}

// Track episode play
export async function trackEpisodePlay(
  userId: string,
  seriesId: string,
  episodeId: string,
  episodeNumber: number,
  seriesTitle: string,
  episodeTitle: string
) {
  try {
    // Create unique play event
    const playId = `${userId}_${episodeId}_${Date.now()}`;
    const deviceType = getDeviceType();
    
    await setDoc(doc(db, 'analytics_plays', playId), {
      userId,
      seriesId,
      episodeId,
      episodeNumber,
      seriesTitle,
      episodeTitle,
      timestamp: serverTimestamp(),
      deviceType,
      date: new Date().toISOString().split('T')[0] // YYYY-MM-DD for grouping
    });
    
    // Update episode stats
    await runTransaction(db, async (transaction) => {
      const episodeStatsRef = doc(db, 'episode_stats', episodeId);
      const episodeStats = await transaction.get(episodeStatsRef);
      
      if (episodeStats.exists()) {
        transaction.update(episodeStatsRef, {
          totalPlays: increment(1),
          lastPlayed: serverTimestamp()
        });
      } else {
        transaction.set(episodeStatsRef, {
          seriesId,
          episodeId,
          episodeNumber,
          seriesTitle,
          episodeTitle,
          totalPlays: 1,
          uniqueListeners: 1,
          lastPlayed: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error tracking episode play:', error);
    return false;
  }
}

// Track playback progress
export async function trackPlaybackProgress(
  userId: string,
  episodeId: string,
  currentTime: number,
  duration: number
) {
  try {
    const progressId = `${userId}_${episodeId}`;
    const completed = (currentTime / duration) > 0.9; // 90% = completed
    
    await setDoc(doc(db, 'playback_progress', progressId), {
      userId,
      episodeId,
      currentTime,
      duration,
      percentage: (currentTime / duration) * 100,
      completed,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error tracking playback progress:', error);
    return false;
  }
}

// Get analytics summary
export async function getAnalyticsSummary() {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get plays for different periods
    const [todayPlays, weekPlays, monthPlays] = await Promise.all([
      getDocs(query(
        collection(db, 'analytics_plays'),
        where('date', '==', today)
      )),
      getDocs(query(
        collection(db, 'analytics_plays'),
        where('timestamp', '>=', weekAgo)
      )),
      getDocs(query(
        collection(db, 'analytics_plays'),
        where('timestamp', '>=', monthAgo)
      ))
    ]);
    
    // Get top episodes
    const topEpisodes = await getDocs(query(
      collection(db, 'episode_stats'),
      orderBy('totalPlays', 'desc'),
      limit(10)
    ));
    
    // Calculate unique users
    const uniqueUsersToday = new Set(todayPlays.docs.map(doc => doc.data().userId));
    const uniqueUsersWeek = new Set(weekPlays.docs.map(doc => doc.data().userId));
    const uniqueUsersMonth = new Set(monthPlays.docs.map(doc => doc.data().userId));
    
    return {
      today: {
        plays: todayPlays.size,
        uniqueUsers: uniqueUsersToday.size
      },
      week: {
        plays: weekPlays.size,
        uniqueUsers: uniqueUsersWeek.size
      },
      month: {
        plays: monthPlays.size,
        uniqueUsers: uniqueUsersMonth.size
      },
      topEpisodes: topEpisodes.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }))
    };
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    return null;
  }
}

// Get detailed episode analytics
export async function getEpisodeAnalytics(episodeId: string) {
  try {
    const [stats, recentPlays, progress] = await Promise.all([
      getDoc(doc(db, 'episode_stats', episodeId)),
      getDocs(query(
        collection(db, 'analytics_plays'),
        where('episodeId', '==', episodeId),
        orderBy('timestamp', 'desc'),
        limit(100)
      )),
      getDocs(query(
        collection(db, 'playback_progress'),
        where('episodeId', '==', episodeId)
      ))
    ]);
    
    // Calculate completion rate
    const completions = progress.docs.filter(doc => doc.data().completed).length;
    const completionRate = progress.size > 0 ? (completions / progress.size) * 100 : 0;
    
    // Calculate average watch time
    const watchTimes = progress.docs.map(doc => doc.data().percentage);
    const avgWatchTime = watchTimes.length > 0 
      ? watchTimes.reduce((a, b) => a + b, 0) / watchTimes.length 
      : 0;
    
    return {
      stats: stats.exists() ? stats.data() : null,
      recentPlays: recentPlays.docs.map(doc => doc.data()),
      completionRate,
      avgWatchTime,
      totalViews: recentPlays.size
    };
  } catch (error) {
    console.error('Error getting episode analytics:', error);
    return null;
  }
}

// Helper function to detect device type
function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isMobile = /mobile|android|iphone/.test(userAgent);
  const isTablet = /ipad|tablet/.test(userAgent);
  
  if (isTablet) return 'tablet';
  if (isMobile) return 'mobile';
  return 'desktop';
}