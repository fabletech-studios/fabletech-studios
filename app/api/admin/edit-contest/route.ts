import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Admin SDK not initialized' },
        { status: 500 }
      );
    }
    
    const { contestId, updates } = await request.json();
    
    if (!contestId) {
      return NextResponse.json(
        { success: false, error: 'contestId is required' },
        { status: 400 }
      );
    }
    
    // Update contest with new data
    await adminDb.collection('contests').doc(contestId).update({
      ...updates,
      updatedAt: new Date()
    });
    
    return NextResponse.json({
      success: true,
      message: 'Contest updated successfully'
    });
    
  } catch (error: any) {
    console.error('Error updating contest:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update contest' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Admin SDK not initialized' },
        { status: 500 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('contestId');
    
    if (!contestId) {
      return NextResponse.json(
        { success: false, error: 'contestId is required' },
        { status: 400 }
      );
    }
    
    // Check if contest has submissions
    const submissions = await adminDb.collection('submissions')
      .where('contestId', '==', contestId)
      .limit(1)
      .get();
    
    if (!submissions.empty) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete contest with submissions. Archive it instead.' },
        { status: 400 }
      );
    }
    
    // Delete the contest
    await adminDb.collection('contests').doc(contestId).delete();
    
    return NextResponse.json({
      success: true,
      message: 'Contest deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Error deleting contest:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete contest' },
      { status: 500 }
    );
  }
}