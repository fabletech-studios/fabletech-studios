import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('contestId');
    
    if (!contestId) {
      return NextResponse.json(
        { success: false, error: 'Contest ID required' },
        { status: 400 }
      );
    }

    // Get user ID - check both customers and admins collections
    let userId: string;
    
    const customersSnap = await adminDb
      .collection('customers')
      .where('email', '==', session.user.email)
      .limit(1)
      .get();

    if (!customersSnap.empty) {
      userId = customersSnap.docs[0].id;
    } else {
      // Check if user is an admin
      const adminsSnap = await adminDb
        .collection('admins')
        .where('email', '==', session.user.email)
        .limit(1)
        .get();
      
      if (!adminsSnap.empty) {
        userId = adminsSnap.docs[0].id;
      } else {
        // Create a customer record for this user
        const newCustomerRef = adminDb.collection('customers').doc();
        await newCustomerRef.set({
          email: session.user.email,
          name: session.user.name || 'Contest User',
          credits: 100, // Give some initial credits
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
        userId = newCustomerRef.id;
      }
    }
    const activityId = `${userId}_${contestId}`;
    const activityDoc = await adminDb.collection('userContestActivity').doc(activityId).get();
    
    if (!activityDoc.exists) {
      // Default allowance for new users
      return NextResponse.json({
        success: true,
        votesRemaining: { free: 1, premium: 0, super: 0 }
      });
    }
    
    const data = activityDoc.data();
    return NextResponse.json({
      success: true,
      votesRemaining: data?.votesRemaining || { free: 1, premium: 0, super: 0 }
    });
    
  } catch (error: any) {
    console.error('Error getting votes remaining:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get votes' },
      { status: 500 }
    );
  }
}