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
    
    const { contestId } = await request.json();
    
    if (!contestId) {
      return NextResponse.json(
        { success: false, error: 'contestId is required' },
        { status: 400 }
      );
    }
    
    // Get the original contest
    const originalDoc = await adminDb.collection('contests').doc(contestId).get();
    
    if (!originalDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Contest not found' },
        { status: 404 }
      );
    }
    
    const originalData = originalDoc.data();
    
    // Create a duplicate with updated dates and title
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setMonth(futureDate.getMonth() + 1);
    
    const duplicateData = {
      ...originalData,
      title: `${originalData?.title} (Copy)`,
      status: 'upcoming',
      submissionStartDate: today,
      submissionEndDate: futureDate,
      votingStartDate: futureDate,
      votingEndDate: new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week after
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Create the duplicate contest
    const docRef = await adminDb.collection('contests').add(duplicateData);
    
    return NextResponse.json({
      success: true,
      contestId: docRef.id,
      message: 'Contest duplicated successfully'
    });
    
  } catch (error: any) {
    console.error('Error duplicating contest:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to duplicate contest' },
      { status: 500 }
    );
  }
}