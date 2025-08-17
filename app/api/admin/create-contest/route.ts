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

    const body = await request.json();
    
    // Add server timestamp
    const contestData = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Create contest using Admin SDK (bypasses Firestore rules)
    const docRef = await adminDb.collection('contests').add(contestData);
    
    return NextResponse.json({
      success: true,
      contestId: docRef.id
    });
    
  } catch (error: any) {
    console.error('Error creating contest:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create contest' },
      { status: 500 }
    );
  }
}