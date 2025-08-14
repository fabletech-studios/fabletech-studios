import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { serverDb } from '@/lib/firebase/server-config';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp, increment, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, credits, reason } = await request.json();

    // Validate input
    if (!email || !credits || credits <= 0) {
      return NextResponse.json({ 
        error: 'Invalid input. Email and positive credit amount required.' 
      }, { status: 400 });
    }

    // Check if database is initialized
    if (!serverDb) {
      return NextResponse.json({ 
        error: 'Database not initialized. Please check Firebase configuration.' 
      }, { status: 500 });
    }

    // Find customer by email
    const customersRef = collection(serverDb, 'customers');
    const q = query(customersRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ 
        error: 'Customer not found with this email address.' 
      }, { status: 404 });
    }

    const customerDoc = querySnapshot.docs[0];
    const customerId = customerDoc.id;
    const currentCredits = customerDoc.data().credits || 0;

    // Update customer credits atomically using increment
    await updateDoc(doc(serverDb, 'customers', customerId), {
      credits: increment(credits),
      lastCreditUpdate: serverTimestamp()
    });
    
    // Get the new balance after increment
    const updatedDoc = await getDoc(doc(serverDb, 'customers', customerId));
    const newCreditBalance = updatedDoc.data()?.credits || (currentCredits + credits);

    // Create transaction record
    await addDoc(collection(serverDb, 'credit-transactions'), {
      customerId,
      customerEmail: email.toLowerCase(),
      type: 'admin_grant',
      credits,
      previousBalance: currentCredits,
      newBalance: newCreditBalance,
      reason: reason || 'Credits granted by admin',
      grantedBy: session.user.email,
      createdAt: serverTimestamp()
    });

    return NextResponse.json({ 
      success: true,
      message: `Successfully granted ${credits} credits to ${email}`,
      newBalance: newCreditBalance
    });

  } catch (error: any) {
    console.error('Grant credits error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to grant credits' 
    }, { status: 500 });
  }
}