import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuthenticatedUserEmail } from '../auth-helper';

export async function POST(request: NextRequest) {
  try {
    const userEmail = await getAuthenticatedUserEmail(request);
    
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - please sign in' },
        { status: 401 }
      );
    }

    const { contestId, packageType } = await request.json();
    
    if (!contestId || !packageType) {
      return NextResponse.json(
        { success: false, error: 'Contest ID and package type required' },
        { status: 400 }
      );
    }

    const packages: Record<string, { premium?: number; super?: number; cost: number }> = {
      basic: { premium: 3, cost: 5 },
      pro: { premium: 10, super: 1, cost: 25 },
      super: { premium: 20, super: 5, cost: 100 }
    };

    const selectedPackage = packages[packageType];
    if (!selectedPackage) {
      return NextResponse.json(
        { success: false, error: 'Invalid package type' },
        { status: 400 }
      );
    }

    // Get user ID - check both customers and admins collections
    let userId: string;
    let customerRef: any;
    
    const customersSnap = await adminDb
      .collection('customers')
      .where('email', '==', userEmail)
      .limit(1)
      .get();

    if (!customersSnap.empty) {
      userId = customersSnap.docs[0].id;
      customerRef = adminDb.collection('customers').doc(userId);
    } else {
      // Check if user is an admin
      const adminsSnap = await adminDb
        .collection('admins')
        .where('email', '==', userEmail)
        .limit(1)
        .get();
      
      if (!adminsSnap.empty) {
        // Create a customer record for the admin
        const newCustomerRef = adminDb.collection('customers').doc();
        userId = newCustomerRef.id;
        customerRef = newCustomerRef;
        
        await newCustomerRef.set({
          email: userEmail,
          name: userEmail.split('@')[0] || 'Admin User',
          credits: 1000, // Give admin users more initial credits
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
    }
    // customerRef is already set above
    
    // Run transaction to check credits and update votes
    const result = await adminDb.runTransaction(async (transaction) => {
      // READS FIRST - Firestore requirement
      const customerDoc = await transaction.get(customerRef);
      const customerData = customerDoc.data();
      
      const activityId = `${userId}_${contestId}`;
      const activityRef = adminDb.collection('userContestActivity').doc(activityId);
      const activityDoc = await transaction.get(activityRef);
      
      // Check credits after reads
      const currentCredits = customerData?.credits || 0;
      if (currentCredits < selectedPackage.cost) {
        throw new Error(`Insufficient credits. Need ${selectedPackage.cost}, have ${currentCredits}`);
      }
      
      const currentActivity = activityDoc.exists ? activityDoc.data() : {
        userId,
        contestId,
        votesUsed: { free: 0, premium: 0, super: 0 },
        votesRemaining: { free: 1, premium: 0, super: 0 }
      };
      
      // WRITES SECOND - All writes together after all reads
      // Deduct credits
      transaction.update(customerRef, {
        credits: FieldValue.increment(-selectedPackage.cost),
        updatedAt: FieldValue.serverTimestamp()
      });
      
      // Add transaction record
      const transactionRef = adminDb.collection('credit-transactions').doc();
      transaction.set(transactionRef, {
        customerId: userId,
        type: 'purchase',
        amount: -selectedPackage.cost,
        description: `Purchased ${packageType} vote package for contest`,
        balanceBefore: currentCredits,
        balanceAfter: currentCredits - selectedPackage.cost,
        createdAt: FieldValue.serverTimestamp()
      });
      
      // Update user contest activity
      transaction.set(activityRef, {
        ...currentActivity,
        votesRemaining: {
          free: currentActivity?.votesRemaining?.free || 0,
          premium: (currentActivity?.votesRemaining?.premium || 0) + (selectedPackage.premium || 0),
          super: (currentActivity?.votesRemaining?.super || 0) + (selectedPackage.super || 0)
        },
        lastPurchase: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      
      return {
        success: true,
        creditsSpent: selectedPackage.cost,
        votesAdded: {
          premium: selectedPackage.premium || 0,
          super: selectedPackage.super || 0
        }
      };
    });
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Error purchasing votes:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to purchase votes' },
      { status: 500 }
    );
  }
}