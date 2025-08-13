import { NextRequest, NextResponse } from 'next/server';
import { extractUidFromToken } from '@/lib/utils/token-utils';

const ADMIN_UIDS = [
  'IIP8rWwMCeZ62Svix1lcZPyRkRj2', // Your Google OAuth UID
  'BAhEHbxh31MgdhAQJza3SVJ7cIh2', // Your original UID
];

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No auth token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Extract UID
    let uid: string;
    try {
      const extracted = extractUidFromToken(token);
      uid = extracted.uid;
    } catch (error: any) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check admin access
    if (!ADMIN_UIDS.includes(uid)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all customers
    const { adminDb } = await import('@/lib/firebase/admin');
    
    if (!adminDb) {
      // Fallback to client SDK
      const { collection, getDocs } = await import('firebase/firestore');
      const { serverDb } = await import('@/lib/firebase/server-config');
      
      if (!serverDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }

      const customersSnapshot = await getDocs(collection(serverDb, 'customers'));
      const customers: any[] = [];
      
      customersSnapshot.forEach((doc) => {
        const data = doc.data();
        customers.push({
          uid: doc.id,
          email: data.email,
          name: data.name,
          credits: data.credits || 0,
          unlockedEpisodes: data.unlockedEpisodes?.length || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          authProvider: data.authProvider,
          totalSpent: data.stats?.totalCreditsPurchased || 0
        });
      });

      // Sort by credits descending
      customers.sort((a, b) => b.credits - a.credits);

      return NextResponse.json({
        success: true,
        customers,
        summary: {
          total: customers.length,
          withPurchases: customers.filter(c => c.credits > 100).length,
          totalCredits: customers.reduce((sum, c) => sum + c.credits, 0),
          totalRevenue: customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0)
        }
      });
    }

    // Use Admin SDK
    const customersSnapshot = await adminDb.collection('customers').get();
    const customers: any[] = [];
    
    // Get purchases for revenue calculation
    const purchasesSnapshot = await adminDb.collection('purchases')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    
    const purchasesByCustomer: Record<string, number> = {};
    purchasesSnapshot.forEach((doc: any) => {
      const data = doc.data();
      if (data.customerId && data.amount) {
        purchasesByCustomer[data.customerId] = (purchasesByCustomer[data.customerId] || 0) + data.amount;
      }
    });
    
    customersSnapshot.forEach((doc: any) => {
      const data = doc.data();
      customers.push({
        uid: doc.id,
        email: data.email,
        name: data.name,
        credits: data.credits || 0,
        unlockedEpisodes: data.unlockedEpisodes?.length || 0,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        authProvider: data.authProvider,
        totalSpent: purchasesByCustomer[doc.id] || 0
      });
    });

    // Sort by credits descending
    customers.sort((a, b) => b.credits - a.credits);

    return NextResponse.json({
      success: true,
      customers,
      summary: {
        total: customers.length,
        withPurchases: customers.filter(c => c.credits > 100).length,
        totalCredits: customers.reduce((sum, c) => sum + c.credits, 0),
        totalRevenue: Object.values(purchasesByCustomer).reduce((sum, amount) => sum + amount, 0)
      }
    });

  } catch (error: any) {
    console.error('List customers error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list customers' },
      { status: 500 }
    );
  }
}