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
    
    if (!contestId) {
      return NextResponse.json(
        { success: false, error: 'contestId is required' },
        { status: 400 }
      );
    }
    
    // Get all submissions for the contest
    const snapshot = await adminDb.collection('submissions')
      .where('contestId', '==', contestId)
      .get();
    
    const submissions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
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

export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Admin SDK not initialized' },
        { status: 500 }
      );
    }
    
    const { submissionId, action, data } = await request.json();
    
    if (!submissionId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    switch (action) {
      case 'approve':
        await adminDb.collection('submissions').doc(submissionId).update({
          isApproved: true,
          status: 'approved',
          moderationNotes: 'Approved by admin',
          updatedAt: new Date()
        });
        break;
        
      case 'reject':
        await adminDb.collection('submissions').doc(submissionId).update({
          isApproved: false,
          status: 'rejected',
          moderationNotes: data?.reason || 'Rejected by admin',
          updatedAt: new Date()
        });
        break;
        
      case 'declare-winner':
        await adminDb.collection('submissions').doc(submissionId).update({
          status: data?.place || 'winner',
          updatedAt: new Date()
        });
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      message: `Submission ${action} successfully`
    });
    
  } catch (error: any) {
    console.error('Error updating submission:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update submission' },
      { status: 500 }
    );
  }
}