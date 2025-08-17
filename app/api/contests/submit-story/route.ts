import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { addDoc, collection, doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // If admin SDK is not available, use client SDK with appropriate error handling
    const useAdminDb = !!adminDb;
    
    const submissionData = await request.json();
    const userId = submissionData.authorId;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'authorId is required' },
        { status: 400 }
      );
    }
    
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
      submittedAt: useAdminDb ? new Date() : serverTimestamp(),
      updatedAt: useAdminDb ? new Date() : serverTimestamp(),
      views: 0,
      shares: 0,
      comments: 0,
      isApproved: false, // Requires moderation
      isFeatured: false
    };
    
    let submissionId: string;
    
    if (useAdminDb) {
      // Use Admin SDK if available
      const docRef = await adminDb.collection('submissions').add(newSubmission);
      submissionId = docRef.id;
      
      // Update author profile stats
      await adminDb.collection('authorProfiles').doc(userId).update({
        totalSubmissions: adminDb.FieldValue.increment(1),
        updatedAt: new Date()
      });
    } else {
      // Fallback to client SDK
      try {
        const docRef = await addDoc(collection(db, 'submissions'), newSubmission);
        submissionId = docRef.id;
        
        // Try to update author profile stats (may fail due to permissions)
        try {
          await updateDoc(doc(db, 'authorProfiles', userId), {
            totalSubmissions: increment(1),
            updatedAt: serverTimestamp()
          });
        } catch (profileError) {
          console.log('Could not update author profile stats:', profileError);
          // This is non-critical, continue
        }
      } catch (firestoreError: any) {
        console.error('Firestore submission error:', firestoreError);
        return NextResponse.json(
          { success: false, error: `Failed to submit story: ${firestoreError.message}` },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      submissionId: submissionId,
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