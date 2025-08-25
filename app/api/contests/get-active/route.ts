import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Admin SDK not initialized' },
        { status: 500 }
      );
    }
    
    // Get all active contests (submission, voting, judging, announced, or completed status)
    const snapshot = await adminDb.collection('contests')
      .where('status', 'in', ['submission', 'voting', 'judging', 'announced', 'completed'])
      .get();
    
    const contests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // If no active contests, also check for upcoming ones
    if (contests.length === 0) {
      const upcomingSnapshot = await adminDb.collection('contests')
        .where('status', '==', 'upcoming')
        .limit(1)
        .get();
      
      if (!upcomingSnapshot.empty) {
        const upcomingContest = {
          id: upcomingSnapshot.docs[0].id,
          ...upcomingSnapshot.docs[0].data()
        };
        contests.push(upcomingContest);
      }
    }
    
    return NextResponse.json({
      success: true,
      contests
    });
    
  } catch (error: any) {
    console.error('Error loading active contests:', error);
    
    // Fallback to getting all contests if query fails
    try {
      const snapshot = await adminDb.collection('contests').get();
      const contests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return NextResponse.json({
        success: true,
        contests
      });
    } catch (fallbackError: any) {
      return NextResponse.json(
        { success: false, error: fallbackError.message },
        { status: 500 }
      );
    }
  }
}