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

    const { contestId, submissionId, voteType } = await request.json();
    
    if (!contestId || !submissionId || !voteType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Vote weights and costs
    const voteConfig: Record<string, { weight: number; cost: number }> = {
      free: { weight: 1, cost: 0 },
      premium: { weight: 3, cost: 5 },
      super: { weight: 10, cost: 20 }
    };

    const config = voteConfig[voteType];
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Invalid vote type' },
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
    
    // Run transaction to ensure atomic updates
    const result = await adminDb.runTransaction(async (transaction) => {
      // Check if user already voted for this submission
      const votesQuery = await adminDb
        .collection('votes')
        .where('userId', '==', userId)
        .where('submissionId', '==', submissionId)
        .get();
      
      if (!votesQuery.empty) {
        throw new Error('Already voted for this submission');
      }
      
      // Check user's voting allowance
      const activityId = `${userId}_${contestId}`;
      const activityRef = adminDb.collection('userContestActivity').doc(activityId);
      const activityDoc = await transaction.get(activityRef);
      
      let activity = activityDoc.exists ? activityDoc.data() : {
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
      if (!activity?.votesRemaining || activity.votesRemaining[voteType] <= 0) {
        throw new Error(`No ${voteType} votes remaining`);
      }
      
      // Create vote record
      const voteRef = adminDb.collection('votes').doc();
      transaction.set(voteRef, {
        contestId,
        submissionId,
        userId,
        voteType,
        voteWeight: config.weight,
        creditCost: config.cost,
        votedAt: FieldValue.serverTimestamp()
      });
      
      // Update submission vote counts
      const submissionRef = adminDb.collection('submissions').doc(submissionId);
      transaction.update(submissionRef, {
        [`votes.${voteType}`]: FieldValue.increment(1),
        'votes.total': FieldValue.increment(config.weight),
        updatedAt: FieldValue.serverTimestamp()
      });
      
      // Update user activity
      transaction.set(activityRef, {
        ...activity,
        votesUsed: {
          ...activity.votesUsed,
          [voteType]: (activity?.votesUsed?.[voteType] || 0) + 1
        },
        votesRemaining: {
          ...activity.votesRemaining,
          [voteType]: (activity?.votesRemaining?.[voteType] || 0) - 1
        },
        lastVoteAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      
      return { success: true };
    });
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Error casting vote:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cast vote' },
      { status: 500 }
    );
  }
}