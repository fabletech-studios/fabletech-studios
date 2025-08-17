import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuthenticatedUserEmail } from '../auth-helper';

export async function POST(request: NextRequest) {
  try {
    const userEmail = await getAuthenticatedUserEmail(request);
    
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - please sign in' },
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

    // Get user ID - check both customers and admins collections
    let userId: string;
    
    const customersSnap = await adminDb
      .collection('customers')
      .where('email', '==', userEmail)
      .limit(1)
      .get();

    if (!customersSnap.empty) {
      userId = customersSnap.docs[0].id;
    } else {
      // Check if user is an admin
      const adminsSnap = await adminDb
        .collection('admins')
        .where('email', '==', userEmail)
        .limit(1)
        .get();
      
      if (!adminsSnap.empty) {
        userId = adminsSnap.docs[0].id;
      } else {
        // Create a customer record for this user
        const newCustomerRef = adminDb.collection('customers').doc();
        await newCustomerRef.set({
          email: userEmail,
          name: userEmail.split('@')[0] || 'Contest User',
          credits: 100, // Give some initial credits
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
        userId = newCustomerRef.id;
      }
    }
    
    // Check if user already voted for this submission (outside transaction)
    const votesQuery = await adminDb
      .collection('votes')
      .where('userId', '==', userId)
      .where('submissionId', '==', submissionId)
      .get();
    
    if (!votesQuery.empty) {
      return NextResponse.json(
        { success: false, error: 'Already voted for this submission' },
        { status: 400 }
      );
    }
    
    // Run transaction to ensure atomic updates
    const result = await adminDb.runTransaction(async (transaction) => {
      // READS FIRST - Check user's voting allowance
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