import { NextRequest, NextResponse } from 'next/server';
import { extractUidFromToken } from '@/lib/utils/token-utils';

const ADMIN_UIDS = [
  'IIP8rWwMCeZ62Svix1lcZPyRkRj2', // Your Google OAuth UID
  'BAhEHbxh31MgdhAQJza3SVJ7cIh2', // Your original UID
];

export async function POST(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No auth token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Extract UID
    let adminUid: string;
    try {
      const extracted = extractUidFromToken(token);
      adminUid = extracted.uid;
    } catch (error: any) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check admin access
    if (!ADMIN_UIDS.includes(adminUid)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const customerUid = params.uid;
    const { credits } = await request.json();

    if (typeof credits !== 'number' || credits < 0) {
      return NextResponse.json({ error: 'Invalid credits value' }, { status: 400 });
    }

    // Update customer credits
    const { adminDb } = await import('@/lib/firebase/admin');
    
    if (!adminDb) {
      // Fallback to client SDK
      const { doc, updateDoc, getDoc } = await import('firebase/firestore');
      const { serverDb } = await import('@/lib/firebase/server-config');
      
      if (!serverDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }

      const customerRef = doc(serverDb, 'customers', customerUid);
      
      // Get current credits for logging
      const customerDoc = await getDoc(customerRef);
      if (!customerDoc.exists()) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
      
      const currentCredits = customerDoc.data().credits || 0;
      
      // Update credits
      await updateDoc(customerRef, {
        credits,
        updatedAt: new Date()
      });

      // Log the change
      const { addDoc, collection } = await import('firebase/firestore');
      await addDoc(collection(serverDb, 'credit-transactions'), {
        customerId: customerUid,
        type: 'admin_adjustment',
        amount: credits - currentCredits,
        balance: credits,
        description: `Admin adjustment by ${adminUid}`,
        metadata: {
          previousCredits: currentCredits,
          newCredits: credits,
          adminUid
        },
        createdAt: new Date()
      });

      return NextResponse.json({
        success: true,
        previousCredits: currentCredits,
        newCredits: credits
      });
    }

    // Use Admin SDK
    const customerRef = adminDb.collection('customers').doc(customerUid);
    const customerDoc = await customerRef.get();
    
    if (!customerDoc.exists) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    const currentCredits = customerDoc.data()?.credits || 0;
    
    // Update credits
    await customerRef.update({
      credits,
      updatedAt: new Date()
    });

    // Log the change
    await adminDb.collection('credit-transactions').add({
      customerId: customerUid,
      type: 'admin_adjustment',
      amount: credits - currentCredits,
      balance: credits,
      description: `Admin adjustment by ${adminUid}`,
      metadata: {
        previousCredits: currentCredits,
        newCredits: credits,
        adminUid
      },
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      previousCredits: currentCredits,
      newCredits: credits
    });

  } catch (error: any) {
    console.error('Update customer credits error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update credits' },
      { status: 500 }
    );
  }
}