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
    
    let customers: any[] = [];
    
    if (!adminDb) {
      // Fallback to client SDK
      const { collection, getDocs } = await import('firebase/firestore');
      const { serverDb } = await import('@/lib/firebase/server-config');
      
      if (!serverDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }

      const customersSnapshot = await getDocs(collection(serverDb, 'customers'));
      
      customersSnapshot.forEach((doc) => {
        const data = doc.data();
        customers.push({
          uid: doc.id,
          email: data.email,
          name: data.name || '',
          credits: data.credits || 0,
          unlockedEpisodes: data.unlockedEpisodes?.length || 0,
          createdAt: data.createdAt,
          authProvider: data.authProvider || '',
          totalSpent: data.stats?.totalCreditsPurchased || 0
        });
      });
    } else {
      // Use Admin SDK
      const customersSnapshot = await adminDb.collection('customers').get();
      
      // Get all purchases for revenue calculation
      const purchasesSnapshot = await adminDb.collection('purchases').get();
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
          name: data.name || '',
          credits: data.credits || 0,
          unlockedEpisodes: data.unlockedEpisodes?.length || 0,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          authProvider: data.authProvider || '',
          totalSpent: purchasesByCustomer[doc.id] || 0
        });
      });
    }

    // Sort by credits descending
    customers.sort((a, b) => b.credits - a.credits);

    // Generate CSV
    const csvHeader = 'UID,Email,Name,Credits,Unlocked Episodes,Total Spent ($),Auth Provider,Created At\n';
    const csvRows = customers.map(c => {
      const createdAt = c.createdAt ? new Date(c.createdAt).toISOString() : '';
      const totalSpentDollars = (c.totalSpent / 100).toFixed(2);
      return `"${c.uid}","${c.email}","${c.name}",${c.credits},${c.unlockedEpisodes},${totalSpentDollars},"${c.authProvider}","${createdAt}"`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    // Return as CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="customers-${new Date().toISOString()}.csv"`
      }
    });

  } catch (error: any) {
    console.error('Export customers error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export customers' },
      { status: 500 }
    );
  }
}