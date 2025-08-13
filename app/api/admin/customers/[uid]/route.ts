import { NextRequest, NextResponse } from 'next/server';
import { extractUidFromToken } from '@/lib/utils/token-utils';

const ADMIN_UIDS = [
  'IIP8rWwMCeZ62Svix1lcZPyRkRj2', // Your Google OAuth UID
  'BAhEHbxh31MgdhAQJza3SVJ7cIh2', // Your original UID
];

export async function GET(
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

    // Get customer details
    const { adminDb } = await import('@/lib/firebase/admin');
    
    if (!adminDb) {
      // Fallback to client SDK
      const { doc, getDoc, collection, query, where, getDocs, orderBy, limit } = await import('firebase/firestore');
      const { serverDb } = await import('@/lib/firebase/server-config');
      
      if (!serverDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }

      const customerDoc = await getDoc(doc(serverDb, 'customers', customerUid));
      if (!customerDoc.exists()) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      const customerData = customerDoc.data();
      
      // Get purchases
      const purchasesQuery = query(
        collection(serverDb, 'purchases'),
        where('customerId', '==', customerUid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const purchasesSnapshot = await getDocs(purchasesQuery);
      const purchases: any[] = [];
      purchasesSnapshot.forEach((doc) => {
        purchases.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Get credit transactions
      const transactionsQuery = query(
        collection(serverDb, 'credit-transactions'),
        where('customerId', '==', customerUid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactions: any[] = [];
      transactionsSnapshot.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return NextResponse.json({
        uid: customerUid,
        ...customerData,
        purchases,
        transactions
      });
    }

    // Use Admin SDK
    const customerDoc = await adminDb.collection('customers').doc(customerUid).get();
    if (!customerDoc.exists) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customerData = customerDoc.data();
    
    // Get purchases
    const purchasesSnapshot = await adminDb.collection('purchases')
      .where('customerId', '==', customerUid)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    const purchases: any[] = [];
    purchasesSnapshot.forEach((doc: any) => {
      purchases.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
      });
    });

    // Get credit transactions
    const transactionsSnapshot = await adminDb.collection('credit-transactions')
      .where('customerId', '==', customerUid)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    
    const transactions: any[] = [];
    transactionsSnapshot.forEach((doc: any) => {
      transactions.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
      });
    });

    return NextResponse.json({
      uid: customerUid,
      ...customerData,
      createdAt: customerData?.createdAt?.toDate?.() || customerData?.createdAt,
      updatedAt: customerData?.updatedAt?.toDate?.() || customerData?.updatedAt,
      purchases,
      transactions
    });

  } catch (error: any) {
    console.error('Get customer details error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get customer details' },
      { status: 500 }
    );
  }
}