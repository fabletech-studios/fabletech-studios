import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const contestData = await request.json();

    // Validate required fields
    if (!contestData.title || !contestData.description || !contestData.dates) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert date strings to Date objects
    const dates = {
      announced: new Date(),
      submissionStart: new Date(contestData.dates.submissionStart),
      submissionEnd: new Date(contestData.dates.submissionEnd),
      votingStart: new Date(contestData.dates.votingStart),
      votingEnd: new Date(contestData.dates.votingEnd),
      winnersAnnounced: new Date(contestData.dates.winnersAnnounced)
    };

    // Validate date sequence
    if (dates.submissionEnd <= dates.submissionStart) {
      return NextResponse.json(
        { success: false, error: 'Submission end date must be after start date' },
        { status: 400 }
      );
    }

    if (dates.votingStart < dates.submissionEnd) {
      return NextResponse.json(
        { success: false, error: 'Voting cannot start before submission ends' },
        { status: 400 }
      );
    }

    if (dates.votingEnd <= dates.votingStart) {
      return NextResponse.json(
        { success: false, error: 'Voting end date must be after start date' },
        { status: 400 }
      );
    }

    if (dates.winnersAnnounced < dates.votingEnd) {
      return NextResponse.json(
        { success: false, error: 'Winners announcement must be after voting ends' },
        { status: 400 }
      );
    }

    // Create the contest document
    const contest = {
      ...contestData,
      dates,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: session.user.email,
      stats: {
        totalSubmissions: 0,
        totalVotes: 0,
        totalParticipants: 0,
        totalViews: 0
      }
    };

    const docRef = await adminDb.collection('contests').add(contest);

    return NextResponse.json({
      success: true,
      contestId: docRef.id,
      message: 'Contest created successfully'
    });

  } catch (error: any) {
    console.error('Error creating contest:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create contest' },
      { status: 500 }
    );
  }
}