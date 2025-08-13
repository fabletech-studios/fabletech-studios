import { NextRequest, NextResponse } from 'next/server';
import { extractUidFromToken } from '@/lib/utils/token-utils';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No auth token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Extract UID using standardized function
    let uid: string;
    try {
      const extracted = extractUidFromToken(token);
      uid = extracted.uid;
    } catch (error: any) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only allow your UID for security
    if (uid !== 'IIP8rWwMCeZ62Svix1lcZPyRkRj2') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Try Admin SDK first
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
          credits: data.credits,
          unlockedEpisodes: data.unlockedEpisodes?.length || 0,
          unlockedEpisodeDetails: data.unlockedEpisodes || [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          authProvider: data.authProvider,
          stats: data.stats
        });
      });

      // Sort by credits descending
      customers.sort((a, b) => b.credits - a.credits);

      return NextResponse.json({
        success: true,
        totalCustomers: customers.length,
        customersWithPurchases: customers.filter(c => c.credits > 100).length,
        yourAccounts: customers.filter(c => c.email === 'oryshchynskyy@gmail.com'),
        allCustomers: customers
      });
    }

    // Use Admin SDK
    const customersSnapshot = await adminDb.collection('customers').get();
    const customers: any[] = [];
    
    customersSnapshot.forEach((doc: any) => {
      const data = doc.data();
      customers.push({
        uid: doc.id,
        email: data.email,
        name: data.name,
        credits: data.credits,
        unlockedEpisodes: data.unlockedEpisodes?.length || 0,
        unlockedEpisodeDetails: data.unlockedEpisodes || [],
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        authProvider: data.authProvider,
        stats: data.stats
      });
    });

    // Sort by credits descending
    customers.sort((a, b) => b.credits - a.credits);

    // Also check purchases collection
    const purchasesSnapshot = await adminDb.collection('purchases').get();
    const purchases: any[] = [];
    
    purchasesSnapshot.forEach((doc: any) => {
      const data = doc.data();
      purchases.push({
        id: doc.id,
        customerId: data.customerId,
        amount: data.amount,
        credits: data.credits,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      });
    });

    return NextResponse.json({
      success: true,
      totalCustomers: customers.length,
      customersWithPurchases: customers.filter(c => c.credits > 100).length,
      yourAccounts: customers.filter(c => c.email === 'oryshchynskyy@gmail.com'),
      allCustomers: customers,
      recentPurchases: purchases.slice(0, 10)
    });

  } catch (error: any) {
    console.error('List customers error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list customers' },
      { status: 500 }
    );
  }
}