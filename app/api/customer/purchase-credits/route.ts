import { NextRequest, NextResponse } from 'next/server';
import { updateFirebaseCustomer, getFirebaseCustomer } from '@/lib/firebase/customer-service';
import { serverDb } from '@/lib/firebase/server-config';
import { doc, updateDoc, addDoc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { addUserActivity } from '@/lib/firebase/activity-service';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify Firebase ID token
    let uid: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      uid = payload.user_id || payload.sub;
      if (!uid) throw new Error('Invalid token');
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { packageId, credits, amount } = await request.json();

    if (!packageId || !credits || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current customer data
    const customer = await getFirebaseCustomer(uid);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Update customer credits
    const newCredits = customer.credits + credits;
    await updateFirebaseCustomer(uid, {
      credits: newCredits
    });

    // Create transaction record
    if (serverDb) {
      await addDoc(collection(serverDb, 'credit-transactions'), {
        customerId: uid,
        type: 'purchase',
        packageId: packageId,
        amount: amount,
        credits: credits,
        balance: newCredits,
        description: `Credit package purchase: ${packageId}`,
        createdAt: serverTimestamp()
      });
    }

    // Track activity
    await addUserActivity({
      userId: uid,
      type: 'credits_purchased',
      description: `Purchased ${credits} credits for $${amount}`,
      metadata: {
        creditsPurchased: credits,
        creditsAmount: amount
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Credits purchased successfully',
      newBalance: newCredits,
      creditsAdded: credits
    });

  } catch (error: any) {
    console.error('Purchase credits error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}