import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Contest, getContestStatus } from '@/lib/types/contest';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    
    let query = adminDb.collection('contests')
      .where('status', '!=', 'draft'); // Don't show draft contests publicly
    
    // Apply filters
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }
    
    if (category) {
      query = query.where('category', '==', category);
    }
    
    if (featured === 'true') {
      query = query.where('featured', '==', true);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    const contests: Contest[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const contest: Contest = {
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to Date objects
        dates: {
          announced: data.dates.announced?.toDate(),
          submissionStart: data.dates.submissionStart?.toDate(),
          submissionEnd: data.dates.submissionEnd?.toDate(),
          votingStart: data.dates.votingStart?.toDate(),
          votingEnd: data.dates.votingEnd?.toDate(),
          winnersAnnounced: data.dates.winnersAnnounced?.toDate(),
        },
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Contest;
      
      // Update status based on dates
      contest.status = getContestStatus(contest);
      contests.push(contest);
    });
    
    return NextResponse.json({
      success: true,
      contests,
      total: contests.length
    });
    
  } catch (error: any) {
    console.error('Error fetching contests:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch contests' },
      { status: 500 }
    );
  }
}

// Get a single contest by ID or slug
export async function POST(request: NextRequest) {
  try {
    const { id, slug } = await request.json();
    
    if (!id && !slug) {
      return NextResponse.json(
        { success: false, error: 'Contest ID or slug required' },
        { status: 400 }
      );
    }
    
    let contestDoc;
    
    if (id) {
      contestDoc = await adminDb.collection('contests').doc(id).get();
    } else {
      const snapshot = await adminDb.collection('contests')
        .where('slug', '==', slug)
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        contestDoc = snapshot.docs[0];
      }
    }
    
    if (!contestDoc || !contestDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Contest not found' },
        { status: 404 }
      );
    }
    
    const data = contestDoc.data()!;
    const contest: Contest = {
      id: contestDoc.id,
      ...data,
      dates: {
        announced: data.dates.announced?.toDate(),
        submissionStart: data.dates.submissionStart?.toDate(),
        submissionEnd: data.dates.submissionEnd?.toDate(),
        votingStart: data.dates.votingStart?.toDate(),
        votingEnd: data.dates.votingEnd?.toDate(),
        winnersAnnounced: data.dates.winnersAnnounced?.toDate(),
      },
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Contest;
    
    // Update status based on dates
    contest.status = getContestStatus(contest);
    
    return NextResponse.json({
      success: true,
      contest
    });
    
  } catch (error: any) {
    console.error('Error fetching contest:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch contest' },
      { status: 500 }
    );
  }
}