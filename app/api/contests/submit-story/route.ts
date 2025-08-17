import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    if (!adminDb || !adminAuth) {
      return NextResponse.json(
        { success: false, error: 'Admin SDK not initialized' },
        { status: 500 }
      );
    }
    
    // Get user from session cookie
    const cookieStore = cookies();
    const session = cookieStore.get('session');
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Verify session
    const decodedClaims = await adminAuth.verifySessionCookie(session.value, true);
    const userId = decodedClaims.uid;
    
    const submissionData = await request.json();
    
    // Create submission with server-side data
    const newSubmission = {
      ...submissionData,
      authorId: userId,
      votes: {
        free: 0,
        premium: 0,
        super: 0,
        total: 0
      },
      status: 'submitted',
      submittedAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      shares: 0,
      comments: 0,
      isApproved: false, // Requires moderation
      isFeatured: false
    };
    
    // Add submission to Firestore
    const docRef = await adminDb.collection('submissions').add(newSubmission);
    
    // Update author profile stats
    await adminDb.collection('authorProfiles').doc(userId).update({
      totalSubmissions: adminDb.FieldValue.increment(1),
      updatedAt: new Date()
    });
    
    return NextResponse.json({
      success: true,
      submissionId: docRef.id,
      message: 'Story submitted successfully!'
    });
    
  } catch (error: any) {
    console.error('Error submitting story:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit story' },
      { status: 500 }
    );
  }
}