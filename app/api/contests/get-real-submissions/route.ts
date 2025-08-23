import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    // Use client-side Firestore to get real contest submissions
    const submissionsRef = collection(db, 'submissions');
    const q = query(
      submissionsRef,
      where('isApproved', '==', true),
      orderBy('votes.total', 'desc'),
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    
    const submissions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || 'Untitled',
        authorName: data.authorName || 'Anonymous',
        authorEmail: data.authorEmail || '',
        votes: data.votes?.total || data.totalVotes || 0,
        weightedVotes: data.votes?.weighted || data.weightedVotes || data.totalVotes || 0,
        views: data.views || 0
      };
    });

    // If no real submissions found, return some placeholder data
    if (submissions.length === 0) {
      return NextResponse.json({
        success: true,
        submissions: [
          {
            id: 'placeholder-1',
            title: 'No submissions yet',
            authorName: 'Submit your story',
            authorEmail: 'author@example.com',
            votes: 0,
            weightedVotes: 0,
            views: 0
          }
        ],
        message: 'No approved submissions found in the contest'
      });
    }

    return NextResponse.json({
      success: true,
      submissions,
      total: submissions.length
    });

  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    
    // Try alternative query without orderBy if it fails
    try {
      const submissionsRef = collection(db, 'submissions');
      const q = query(
        submissionsRef,
        where('isApproved', '==', true)
      );
      
      const snapshot = await getDocs(q);
      
      const submissions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || 'Untitled',
          authorName: data.authorName || 'Anonymous',
          authorEmail: data.authorEmail || '',
          votes: data.votes?.total || data.totalVotes || 0,
          weightedVotes: data.votes?.weighted || data.weightedVotes || data.totalVotes || 0,
          views: data.views || 0
        };
      }).sort((a, b) => b.weightedVotes - a.weightedVotes);

      return NextResponse.json({
        success: true,
        submissions,
        total: submissions.length
      });
      
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      
      // Return empty state instead of mock data
      return NextResponse.json({
        success: true,
        submissions: [],
        message: 'Unable to fetch submissions. Please check Firebase configuration.',
        error: error.message
      });
    }
  }
}