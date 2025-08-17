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
    
    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('contestId');
    const status = searchParams.get('status');
    
    if (!contestId) {
      return NextResponse.json(
        { success: false, error: 'contestId is required' },
        { status: 400 }
      );
    }
    
    // Build query
    let query = adminDb.collection('submissions')
      .where('contestId', '==', contestId);
    
    // Add status filter if provided
    if (status === 'approved') {
      query = query.where('isApproved', '==', true);
    }
    
    const snapshot = await query.get();
    
    const submissions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort by total votes descending
    submissions.sort((a: any, b: any) => {
      const aTotal = a.votes?.total || 0;
      const bTotal = b.votes?.total || 0;
      return bTotal - aTotal;
    });
    
    return NextResponse.json({
      success: true,
      submissions
    });
    
  } catch (error: any) {
    console.error('Error loading submissions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load submissions' },
      { status: 500 }
    );
  }
}