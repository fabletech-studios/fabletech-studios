import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { contestId } = await request.json();
    if (!contestId) {
      return NextResponse.json(
        { success: false, error: 'Contest ID required' },
        { status: 400 }
      );
    }

    // Get user ID from customers collection
    const customersSnap = await adminDb
      .collection('customers')
      .where('email', '==', session.user.email)
      .limit(1)
      .get();

    if (customersSnap.empty) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = customersSnap.docs[0].id;
    const activityId = `${userId}_${contestId}`;
    const activityRef = adminDb.collection('userContestActivity').doc(activityId);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Check if already claimed today
    const activityDoc = await activityRef.get();
    
    if (activityDoc.exists) {
      const data = activityDoc.data();
      const lastClaim = data?.lastDailyClaim?.toDate?.() || data?.lastDailyClaim;
      
      if (lastClaim) {
        const lastClaimDate = new Date(lastClaim);
        const lastClaimDay = new Date(
          lastClaimDate.getFullYear(), 
          lastClaimDate.getMonth(), 
          lastClaimDate.getDate()
        ).getTime();
        
        if (lastClaimDay === today) {
          return NextResponse.json(
            { success: false, error: 'Already claimed today' },
            { status: 400 }
          );
        }
      }
    }
    
    // Calculate streak and bonus
    const currentActivity = activityDoc.exists ? activityDoc.data() : {
      userId,
      contestId,
      votesUsed: { free: 0, premium: 0, super: 0 },
      votesRemaining: { free: 0, premium: 0, super: 0 },
      dailyStreak: 0
    };
    
    let streak = currentActivity?.dailyStreak || 0;
    let bonusVotes = 0;
    
    if (currentActivity?.lastDailyClaim) {
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
    
    // Update activity with new daily vote
    await activityRef.set({
      ...currentActivity,
      votesRemaining: {
        free: (currentActivity?.votesRemaining?.free || 0) + 1 + bonusVotes,
        premium: currentActivity?.votesRemaining?.premium || 0,
        super: currentActivity?.votesRemaining?.super || 0
      },
      lastDailyClaim: FieldValue.serverTimestamp(),
      dailyStreak: streak,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    
    return NextResponse.json({
      success: true,
      votesAdded: 1 + bonusVotes,
      streak,
      bonusVotes: bonusVotes > 0 ? bonusVotes : undefined
    });
    
  } catch (error: any) {
    console.error('Error claiming daily vote:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to claim daily vote' },
      { status: 500 }
    );
  }
}