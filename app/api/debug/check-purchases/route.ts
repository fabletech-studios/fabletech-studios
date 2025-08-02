import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/firebase/server-config';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // First find the user
    const customersQuery = query(
      collection(serverDb!, 'customers'),
      where('email', '==', email)
    );
    const customerSnapshot = await getDocs(customersQuery);
    
    if (customerSnapshot.empty) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customer = customerSnapshot.docs[0];
    const customerId = customer.id;
    const customerData = customer.data();

    // Check purchases collection
    const purchasesQuery = query(
      collection(serverDb!, 'purchases'),
      where('userId', '==', customerId)
    );
    const purchasesSnapshot = await getDocs(purchasesQuery);

    // Check credit-transactions collection
    const transactionsQuery = query(
      collection(serverDb!, 'credit-transactions'),
      where('customerId', '==', customerId)
    );
    const transactionsSnapshot = await getDocs(transactionsQuery);

    // Also check with userId field
    const transactionsQuery2 = query(
      collection(serverDb!, 'credit-transactions'),
      where('userId', '==', customerId)
    );
    const transactionsSnapshot2 = await getDocs(transactionsQuery2);

    const result = {
      customer: {
        id: customerId,
        email: customerData.email,
        credits: customerData.credits,
        displayName: customerData.displayName
      },
      purchasesCollection: purchasesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),
      creditTransactions: transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),
      creditTransactionsWithUserId: transactionsSnapshot2.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking purchases:', error);
    return NextResponse.json(
      { error: 'Failed to check purchases' },
      { status: 500 }
    );
  }
}

// POST to migrate a purchase
export async function POST(request: NextRequest) {
  try {
    const { purchaseId } = await request.json();
    
    if (!purchaseId) {
      return NextResponse.json({ error: 'Purchase ID required' }, { status: 400 });
    }

    // Get the purchase from purchases collection
    const purchasesSnapshot = await getDocs(
      query(collection(serverDb!, 'purchases'))
    );
    
    const purchaseDoc = purchasesSnapshot.docs.find(doc => doc.id === purchaseId);
    if (!purchaseDoc) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    const purchaseData = purchaseDoc.data();

    // Create in credit-transactions
    await addDoc(collection(serverDb!, 'credit-transactions'), {
      customerId: purchaseData.userId,
      type: 'purchase',
      packageId: purchaseData.packageId,
      credits: purchaseData.credits,
      amount: purchaseData.amount,
      currency: purchaseData.currency,
      stripeSessionId: purchaseData.stripeSessionId,
      stripePaymentIntentId: purchaseData.stripePaymentIntentId,
      status: purchaseData.status || 'completed',
      createdAt: purchaseData.createdAt || serverTimestamp(),
      metadata: purchaseData.metadata
    });

    return NextResponse.json({ success: true, message: 'Purchase migrated' });
  } catch (error) {
    console.error('Error migrating purchase:', error);
    return NextResponse.json(
      { error: 'Failed to migrate purchase' },
      { status: 500 }
    );
  }
}