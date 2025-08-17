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
    const forceDelete = searchParams.get('force') === 'true';
    
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
    
    if (!submissions.empty && !forceDelete) {
      // Archive the contest instead of deleting
      await adminDb.collection('contests').doc(contestId).update({
        status: 'archived',
        archivedAt: new Date(),
        updatedAt: new Date()
      });
      
      return NextResponse.json({
        success: true,
        message: 'Contest archived successfully due to existing submissions',
        archived: true
      });
    }
    
    // If force delete or no submissions, delete the contest and all related data
    if (forceDelete && !submissions.empty) {
      // Delete all submissions for this contest
      const allSubmissions = await adminDb.collection('submissions')
        .where('contestId', '==', contestId)
        .get();
      
      const batch = adminDb.batch();
      allSubmissions.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
    
    // Delete the contest
    await adminDb.collection('contests').doc(contestId).delete();
    
    return NextResponse.json({
      success: true,
      message: forceDelete ? 'Contest and all submissions deleted successfully' : 'Contest deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Error deleting contest:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete contest' },
      { status: 500 }
    );
  }
}