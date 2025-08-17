import { 
  collection, 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  increment,
  runTransaction,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { 
  Contest, 
  ContestSubmission, 
  ContestVote, 
  AuthorProfile,
  UserContestActivity 
} from '@/lib/types/contest.types';

// ============= CONTEST MANAGEMENT =============

export async function getActiveContest(): Promise<Contest | null> {
  try {
    const q = query(
      collection(db, 'contests'),
      where('status', 'in', ['submission', 'voting']),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as Contest;
  } catch (error) {
    console.error('Error getting active contest:', error);
    return null;
  }
}

export async function getContest(contestId: string): Promise<Contest | null> {
  try {
    const docRef = doc(db, 'contests', contestId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Contest;
  } catch (error) {
    console.error('Error getting contest:', error);
    return null;
  }
}

// ============= SUBMISSIONS =============

export async function submitStory(
  contestId: string,
  submission: Omit<ContestSubmission, 'id' | 'votes' | 'status' | 'submittedAt' | 'updatedAt' | 'views' | 'shares' | 'comments' | 'isApproved'>
): Promise<string | null> {
  try {
    const newSubmission = {
      ...submission,
      contestId,
      votes: {
        free: 0,
        premium: 0,
        super: 0,
        total: 0
      },
      status: 'submitted',
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      views: 0,
      shares: 0,
      comments: 0,
      isApproved: false, // Requires moderation
      isFeatured: false
    };
    
    const docRef = await addDoc(collection(db, 'submissions'), newSubmission);
    
    // Update author profile stats
    await updateAuthorStats(submission.authorId, 'submission');
    
    return docRef.id;
  } catch (error) {
    console.error('Error submitting story:', error);
    return null;
  }
}

export async function getContestSubmissions(
  contestId: string,
  filterStatus?: 'approved' | 'all'
): Promise<ContestSubmission[]> {
  try {
    let q = query(
      collection(db, 'submissions'),
      where('contestId', '==', contestId)
    );
    
    if (filterStatus === 'approved') {
      q = query(
        collection(db, 'submissions'),
        where('contestId', '==', contestId),
        where('isApproved', '==', true),
        orderBy('votes.total', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ContestSubmission));
  } catch (error) {
    console.error('Error getting submissions:', error);
    return [];
  }
}

export async function getSubmission(submissionId: string): Promise<ContestSubmission | null> {
  try {
    const docRef = doc(db, 'submissions', submissionId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    // Increment view count
    await updateDoc(docRef, {
      views: increment(1)
    });
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as ContestSubmission;
  } catch (error) {
    console.error('Error getting submission:', error);
    return null;
  }
}

// ============= VOTING SYSTEM =============

export async function castVote(
  userId: string,
  contestId: string,
  submissionId: string,
  voteType: 'free' | 'premium' | 'super'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Vote weights and costs
    const voteConfig = {
      free: { weight: 1, cost: 0 },
      premium: { weight: 3, cost: 5 },
      super: { weight: 10, cost: 20 }
    };
    
    const config = voteConfig[voteType];
    
    // Use transaction to ensure atomic updates
    const result = await runTransaction(db, async (transaction) => {
      // Allow multiple votes per submission - users can distribute votes as they want
      
      // Check user's voting allowance
      const activityRef = doc(db, 'userContestActivity', `${userId}_${contestId}`);
      const activityDoc = await transaction.get(activityRef);
      
      let activity = activityDoc.exists() ? activityDoc.data() : {
        userId,
        contestId,
        votesUsed: { free: 0, premium: 0, super: 0 },
        votesRemaining: { free: 1, premium: 0, super: 0 }, // 1 free vote by default
        dailyVotesClaimed: false,
        streakDays: 0,
        submissionsViewed: [],
        submissionsShared: [],
        commentsLeft: 0
      };
      
      // Check if user has votes remaining
      if (activity.votesRemaining[voteType] <= 0) {
        throw new Error(`No ${voteType} votes remaining`);
      }
      
      // Deduct credits if needed (check happens on the frontend)
      
      // Create vote record
      const voteData: Omit<ContestVote, 'id'> = {
        contestId,
        submissionId,
        userId,
        voteType,
        voteWeight: config.weight,
        creditCost: config.cost,
        votedAt: new Date()
      };
      
      const voteRef = doc(collection(db, 'votes'));
      transaction.set(voteRef, voteData);
      
      // Update submission vote counts
      const submissionRef = doc(db, 'submissions', submissionId);
      transaction.update(submissionRef, {
        [`votes.${voteType}`]: increment(1),
        'votes.total': increment(config.weight)
      });
      
      // Update user activity
      transaction.set(activityRef, {
        ...activity,
        votesUsed: {
          ...activity.votesUsed,
          [voteType]: activity.votesUsed[voteType] + 1
        },
        votesRemaining: {
          ...activity.votesRemaining,
          [voteType]: activity.votesRemaining[voteType] - 1
        },
        lastVoteAt: serverTimestamp()
      });
      
      return { success: true };
    });
    
    return result;
  } catch (error: any) {
    console.error('Error casting vote:', error);
    return { success: false, error: error.message };
  }
}

export async function getUserVotesRemaining(
  userId: string,
  contestId: string
): Promise<{ free: number; premium: number; super: number }> {
  try {
    const activityRef = doc(db, 'userContestActivity', `${userId}_${contestId}`);
    const activityDoc = await getDoc(activityRef);
    
    if (!activityDoc.exists()) {
      // Default allowance for new users
      return { free: 1, premium: 0, super: 0 };
    }
    
    return activityDoc.data().votesRemaining;
  } catch (error) {
    console.error('Error getting votes remaining:', error);
    return { free: 0, premium: 0, super: 0 };
  }
}

export async function purchaseVotes(
  userId: string,
  contestId: string,
  packageType: 'basic' | 'pro' | 'super'
): Promise<boolean> {
  try {
    const packages = {
      basic: { premium: 5, cost: 10 },
      pro: { premium: 15, super: 2, cost: 25 },
      super: { premium: 25, super: 10, cost: 50 }
    };
    
    const selectedPackage = packages[packageType];
    
    // Transaction to deduct credits and add votes
    await runTransaction(db, async (transaction) => {
      // This would integrate with your existing credit system
      // For now, we'll just update the activity
      
      const activityRef = doc(db, 'userContestActivity', `${userId}_${contestId}`);
      const activityDoc = await transaction.get(activityRef);
      
      const currentActivity = activityDoc.exists() ? activityDoc.data() : {
        userId,
        contestId,
        votesUsed: { free: 0, premium: 0, super: 0 },
        votesRemaining: { free: 1, premium: 0, super: 0 }
      };
      
      transaction.set(activityRef, {
        ...currentActivity,
        votesRemaining: {
          free: currentActivity.votesRemaining.free,
          premium: currentActivity.votesRemaining.premium + (selectedPackage.premium || 0),
          super: currentActivity.votesRemaining.super + ((selectedPackage as any).super || 0)
        }
      });
    });
    
    return true;
  } catch (error) {
    console.error('Error purchasing votes:', error);
    return false;
  }
}

export async function claimDailyVote(
  userId: string,
  contestId: string
): Promise<{ success: boolean; error?: string; streakBonus?: number }> {
  try {
    const activityRef = doc(db, 'userContestActivity', `${userId}_${contestId}`);
    const activityDoc = await getDoc(activityRef);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    if (activityDoc.exists()) {
      const data = activityDoc.data();
      const lastClaim = data.lastDailyClaim?.toDate?.() || data.lastDailyClaim;
      
      if (lastClaim) {
        const lastClaimDate = new Date(lastClaim);
        const lastClaimDay = new Date(lastClaimDate.getFullYear(), lastClaimDate.getMonth(), lastClaimDate.getDate()).getTime();
        
        if (lastClaimDay === today) {
          return { success: false, error: 'Already claimed today' };
        }
      }
    }
    
    // Give daily vote
    await runTransaction(db, async (transaction) => {
      const activityDoc = await transaction.get(activityRef);
      
      const currentActivity = activityDoc.exists() ? activityDoc.data() : {
        userId,
        contestId,
        votesUsed: { free: 0, premium: 0, super: 0 },
        votesRemaining: { free: 0, premium: 0, super: 0 },
        dailyStreak: 0
      };
      
      // Check for streak
      let streak = currentActivity.dailyStreak || 0;
      let bonusVotes = 0;
      
      if (currentActivity.lastDailyClaim) {
        const lastClaim = new Date(currentActivity.lastDailyClaim.toDate());
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastClaim.toDateString() === yesterday.toDateString()) {
          streak++;
          // Bonus every 3 days
          if (streak % 3 === 0) {
            bonusVotes = 1;
          }
        } else {
          streak = 1;
        }
      } else {
        streak = 1;
      }
      
      transaction.set(activityRef, {
        ...currentActivity,
        votesRemaining: {
          free: (currentActivity.votesRemaining?.free || 0) + 1 + bonusVotes,
          premium: currentActivity.votesRemaining?.premium || 0,
          super: currentActivity.votesRemaining?.super || 0
        },
        lastDailyClaim: now,
        dailyStreak: streak
      });
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error claiming daily vote:', error);
    return { success: false, error: error.message };
  }
}

// ============= AUTHOR PROFILES =============

export async function getOrCreateAuthorProfile(userId: string): Promise<AuthorProfile> {
  try {
    const profileRef = doc(db, 'authorProfiles', userId);
    const profileDoc = await getDoc(profileRef);
    
    if (profileDoc.exists()) {
      return {
        ...profileDoc.data(),
        userId
      } as AuthorProfile;
    }
    
    // Create new profile
    const newProfile: AuthorProfile = {
      userId,
      penName: 'Anonymous Author',
      bio: '',
      totalSubmissions: 0,
      contestWins: 0,
      totalVotesReceived: 0,
      totalCreditsEarned: 0,
      badges: [],
      level: 'novice',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(profileRef, newProfile);
    return newProfile;
  } catch (error) {
    console.error('Error getting/creating author profile:', error);
    throw error;
  }
}

export async function updateAuthorProfile(
  userId: string,
  updates: Partial<AuthorProfile>
): Promise<boolean> {
  try {
    const profileRef = doc(db, 'authorProfiles', userId);
    await updateDoc(profileRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating author profile:', error);
    return false;
  }
}

async function updateAuthorStats(
  userId: string,
  action: 'submission' | 'win' | 'vote'
): Promise<void> {
  try {
    const profileRef = doc(db, 'authorProfiles', userId);
    const updates: any = {};
    
    switch (action) {
      case 'submission':
        updates.totalSubmissions = increment(1);
        break;
      case 'win':
        updates.contestWins = increment(1);
        break;
      case 'vote':
        updates.totalVotesReceived = increment(1);
        break;
    }
    
    updates.updatedAt = serverTimestamp();
    await updateDoc(profileRef, updates);
  } catch (error) {
    console.error('Error updating author stats:', error);
  }
}

// ============= LEADERBOARD =============

export async function getContestLeaderboard(
  contestId: string,
  limitCount: number = 10
): Promise<ContestSubmission[]> {
  try {
    const q = query(
      collection(db, 'submissions'),
      where('contestId', '==', contestId),
      where('isApproved', '==', true),
      orderBy('votes.total', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ContestSubmission));
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}
