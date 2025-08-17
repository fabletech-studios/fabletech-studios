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

    const { contestId, status } = await request.json();
    
    if (!contestId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing contestId or status' },
        { status: 400 }
      );
    }
    
    // Update contest status using Admin SDK
    await adminDb.collection('contests').doc(contestId).update({
      status: status,
      updatedAt: new Date()
    });
    
    return NextResponse.json({
      success: true,
      message: `Contest status updated to ${status}`
    });
    
  } catch (error: any) {
    console.error('Error updating contest status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update contest status' },
      { status: 500 }
    );
  }
}