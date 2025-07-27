import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/firebase/server-config';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let userId: string;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.user_id || payload.sub;
      if (!userId) throw new Error('Invalid token');
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    if (!serverDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Try to fetch purchase history from credit-transactions
    // First try with customerId
    let purchasesQuery = query(
      collection(serverDb, 'credit-transactions'),
      where('customerId', '==', userId),
      limit(100)
    );
    
    let snapshot = await getDocs(purchasesQuery);
    
    // If no results, try with userId (in case older records use different field name)
    if (snapshot.empty) {
      console.log('No transactions found with customerId, trying userId...');
      purchasesQuery = query(
        collection(serverDb, 'credit-transactions'),
        where('userId', '==', userId),
        limit(100)
      );
      snapshot = await getDocs(purchasesQuery);
    }

    console.log('Found transactions for user:', userId, 'Count:', snapshot.docs.length);
    
    const allTransactions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        packageId: data.packageId,
        packageName: data.packageId === 'starter' ? 'Starter Pack' : 
                     data.packageId === 'popular' ? 'Popular Pack' : 
                     data.packageId === 'premium' ? 'Premium Pack' : data.packageId,
        amount: data.amount,
        credits: data.credits,
        status: 'completed',
        stripeSessionId: data.stripeSessionId,
        createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
      };
    });

    // Filter for purchases and sort by date client-side
    const purchases = allTransactions
      .filter(transaction => transaction.type === 'purchase')
      .sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 50);

    return NextResponse.json({
      success: true,
      purchases,
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}