import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    let submissions: any[] = [];
    
    // Use Admin SDK only (server-side)
    // Simplified query to avoid compound index requirement
    const submissionsSnapshot = await adminDb.collection('submissions')
      .where('authorId', '==', userId)
      .get();
    
    // Get contest titles for each submission
    const contestIds = new Set<string>();
    submissionsSnapshot.forEach(doc => {
      contestIds.add(doc.data().contestId);
    });
    
    const contestMap = new Map<string, string>();
    for (const contestId of contestIds) {
      const contestDoc = await adminDb.collection('contests').doc(contestId).get();
      if (contestDoc.exists) {
        contestMap.set(contestId, contestDoc.data()?.title || 'Unknown Contest');
      }
    }
    
    submissions = submissionsSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          contestTitle: contestMap.get(data.contestId),
          submittedAt: data.submittedAt
        };
      })
      .sort((a, b) => {
        // Sort by submission date in memory (most recent first)
        const aTime = a.submittedAt?._seconds || a.submittedAt?.seconds || 0;
        const bTime = b.submittedAt?._seconds || b.submittedAt?.seconds || 0;
        return bTime - aTime;
      });
    
    return NextResponse.json({
      success: true,
      submissions
    });
    
  } catch (error: any) {
    console.error('Error fetching author submissions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}