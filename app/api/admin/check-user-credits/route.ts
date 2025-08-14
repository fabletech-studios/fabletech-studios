import { NextRequest, NextResponse } from 'next/server';
import { extractUidFromToken } from '@/lib/utils/token-utils';

const ADMIN_UIDS = [
  'IIP8rWwMCeZ62Svix1lcZPyRkRj2', // Your Google OAuth UID
  'BAhEHbxh31MgdhAQJza3SVJ7cIh2', // Your original UID
];

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Extract UID and verify admin
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

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Use Admin SDK
    const admin = await import('firebase-admin');
    
    // Initialize if not already done
    if (!admin.apps.length) {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
      });
    }
    
    const db = admin.firestore();
    
    // Find customer by email
    const customersSnapshot = await db.collection('customers')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (customersSnapshot.empty) {
      return NextResponse.json({ 
        error: 'Customer not found' 
      }, { status: 404 });
    }

    const customerDoc = customersSnapshot.docs[0];
    const customerId = customerDoc.id;
    const customerData = customerDoc.data();

    // Get all credit transactions for this user
    const transactionsSnapshot = await db.collection('credit-transactions')
      .where('customerId', '==', customerId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const transactions = transactionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        credits: data.credits,
        previousBalance: data.previousBalance,
        newBalance: data.newBalance,
        amount: data.amount,
        reason: data.reason || data.description,
        grantedBy: data.grantedBy,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        stripeSessionId: data.stripeSessionId
      };
    });

    // Calculate what the balance should be based on transactions
    let calculatedBalance = 100; // Starting balance for new users
    let creditHistory = [];
    
    // Get all purchase and grant transactions
    for (const tx of transactions.reverse()) { // Process in chronological order
      if (tx.type === 'purchase' || tx.type === 'admin_grant') {
        creditHistory.push({
          type: tx.type,
          credits: tx.credits,
          newBalance: tx.newBalance,
          date: tx.createdAt
        });
        
        if (tx.type === 'purchase') {
          calculatedBalance += tx.credits || 0;
        } else if (tx.type === 'admin_grant') {
          calculatedBalance += tx.credits || 0;
        }
      } else if (tx.type === 'spend') {
        calculatedBalance += tx.amount || 0; // amount is negative for spends
      }
    }

    return NextResponse.json({
      customer: {
        uid: customerId,
        email: customerData.email,
        currentCredits: customerData.credits,
        createdAt: customerData.createdAt?.toDate?.() || customerData.createdAt
      },
      analysis: {
        currentBalance: customerData.credits,
        calculatedBalance,
        discrepancy: customerData.credits - calculatedBalance,
        transactionCount: transactions.length
      },
      recentTransactions: transactions.slice(0, 10),
      creditHistory
    });

  } catch (error: any) {
    console.error('[Check User Credits] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to check credits'
    }, { status: 500 });
  }
}