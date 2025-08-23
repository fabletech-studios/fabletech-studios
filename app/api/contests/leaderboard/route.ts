import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Check if Firebase Admin is initialized
    if (!adminDb) {
      // Return mock data for local development
      return NextResponse.json({
        success: true,
        submissions: [
          {
            id: 'sub-1',
            title: 'The Midnight Garden',
            authorName: 'Sarah Johnson',
            authorEmail: 'sarah@example.com',
            votes: 156,
            weightedVotes: 234,
            views: 1203
          },
          {
            id: 'sub-2',
            title: 'Echoes of Tomorrow',
            authorName: 'Michael Chen',
            authorEmail: 'michael@example.com',
            votes: 142,
            weightedVotes: 198,
            views: 987
          },
          {
            id: 'sub-3',
            title: 'The Last Lighthouse',
            authorName: 'Emma Wilson',
            authorEmail: 'emma@example.com',
            votes: 128,
            weightedVotes: 176,
            views: 845
          },
          {
            id: 'sub-4',
            title: 'Whispers in the Wind',
            authorName: 'David Brown',
            authorEmail: 'david@example.com',
            votes: 95,
            weightedVotes: 142,
            views: 623
          },
          {
            id: 'sub-5',
            title: 'Digital Dreams',
            authorName: 'Lisa Anderson',
            authorEmail: 'lisa@example.com',
            votes: 87,
            weightedVotes: 125,
            views: 534
          }
        ]
      });
    }

    // Get all submissions sorted by weighted votes
    const snapshot = await adminDb
      .collection('submissions')
      .where('status', '==', 'approved')
      .orderBy('votes.weightedTotal', 'desc')
      .limit(50)
      .get();

    const submissions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        authorName: data.authorName,
        authorEmail: data.authorEmail,
        votes: data.votes?.total || 0,
        weightedVotes: data.votes?.weightedTotal || 0,
        views: data.views || 0
      };
    });

    return NextResponse.json({
      success: true,
      submissions
    });

  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    
    // Return mock data on error
    return NextResponse.json({
      success: true,
      submissions: [
        {
          id: 'sub-1',
          title: 'Sample Story 1',
          authorName: 'Author 1',
          authorEmail: 'author1@example.com',
          votes: 100,
          weightedVotes: 150,
          views: 500
        },
        {
          id: 'sub-2',
          title: 'Sample Story 2',
          authorName: 'Author 2',
          authorEmail: 'author2@example.com',
          votes: 80,
          weightedVotes: 120,
          views: 400
        }
      ]
    });
  }
}