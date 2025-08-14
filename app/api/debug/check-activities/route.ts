import { NextRequest, NextResponse } from 'next/server';
import { extractUidFromToken } from '@/lib/utils/token-utils';

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

    console.log('Checking activities and purchases for uid:', uid);

    // Check activities
    let activities: any[] = [];
    let transactions: any[] = [];
    
    try {
      const { adminDb } = await import('@/lib/firebase/admin');
      
      if (adminDb) {
        // Check userActivities collection
        const activitiesSnapshot = await adminDb.collection('userActivities')
          .where('userId', '==', uid)
          .limit(50)
          .get();
        
        activities = activitiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
        }));
        
        // Check credit-transactions collection
        const transactionsSnapshot = await adminDb.collection('credit-transactions')
          .where('customerId', '==', uid)
          .limit(50)
          .get();
        
        transactions = transactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
        }));
        
        // Also try with userId field
        if (transactions.length === 0) {
          const transactionsSnapshot2 = await adminDb.collection('credit-transactions')
            .where('userId', '==', uid)
            .limit(50)
            .get();
          
          transactions = transactionsSnapshot2.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
          }));
        }
      }
    } catch (error) {
      console.log('Admin SDK failed, trying client SDK');
    }

    // Fallback to client SDK if needed
    if (activities.length === 0 && transactions.length === 0) {
      const { serverDb } = await import('@/lib/firebase/server-config');
      const { collection, query, where, limit, getDocs } = await import('firebase/firestore');
      
      if (serverDb) {
        // Get activities
        const activitiesQuery = query(
          collection(serverDb, 'userActivities'),
          where('userId', '==', uid),
          limit(50)
        );
        const activitiesSnapshot = await getDocs(activitiesQuery);
        activities = activitiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Get transactions
        const transactionsQuery = query(
          collection(serverDb, 'credit-transactions'),
          where('customerId', '==', uid),
          limit(50)
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        transactions = transactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
    }

    return NextResponse.json({
      uid,
      activities: {
        count: activities.length,
        data: activities
      },
      transactions: {
        count: transactions.length,
        data: transactions
      },
      summary: {
        hasActivities: activities.length > 0,
        hasTransactions: transactions.length > 0,
        totalCreditsSpent: transactions
          .filter(t => t.type === 'spend')
          .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0),
        totalCreditsPurchased: transactions
          .filter(t => t.type === 'purchase')
          .reduce((sum, t) => sum + (t.credits || 0), 0)
      }
    });

  } catch (error: any) {
    console.error('Debug check activities error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}