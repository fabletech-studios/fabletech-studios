import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
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
      
      if (!serviceAccount.clientEmail || !serviceAccount.privateKey) {
        return NextResponse.json({ 
          error: 'Admin SDK not configured' 
        }, { status: 500 });
      }
      
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
      .limit(100)
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
    let runningBalance = 100; // Starting balance
    let creditOperations = [];
    
    // Process transactions in chronological order
    const sortedTransactions = [...transactions].reverse();
    
    for (const tx of sortedTransactions) {
      let operation = {
        type: tx.type,
        credits: 0,
        change: 0,
        runningBalance: runningBalance,
        date: tx.createdAt,
        reason: tx.reason
      };
      
      if (tx.type === 'purchase') {
        operation.credits = tx.credits || 0;
        operation.change = tx.credits || 0;
        runningBalance += tx.credits || 0;
      } else if (tx.type === 'admin_grant') {
        operation.credits = tx.credits || 0;
        operation.change = tx.credits || 0;
        runningBalance += tx.credits || 0;
      } else if (tx.type === 'spend' || tx.type === 'unlock') {
        operation.credits = tx.amount || 0;
        operation.change = tx.amount || 0; // Should be negative
        runningBalance += tx.amount || 0;
      } else if (tx.type === 'bonus') {
        operation.credits = tx.credits || tx.amount || 0;
        operation.change = tx.credits || tx.amount || 0;
        runningBalance += tx.credits || tx.amount || 0;
      }
      
      operation.runningBalance = runningBalance;
      creditOperations.push(operation);
    }

    // Check for duplicate transactions
    const duplicates = [];
    const seen = new Map();
    
    for (const tx of transactions) {
      const key = `${tx.type}-${tx.credits}-${tx.createdAt}`;
      if (seen.has(key)) {
        duplicates.push({
          transaction: tx,
          possibleDuplicate: seen.get(key)
        });
      }
      seen.set(key, tx);
    }

    // Get recent activities
    const activitiesSnapshot = await db.collection('userActivities')
      .where('userId', '==', customerId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const activities = activitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    return NextResponse.json({
      customer: {
        uid: customerId,
        email: customerData.email,
        currentCredits: customerData.credits,
        createdAt: customerData.createdAt?.toDate?.() || customerData.createdAt,
        unlockedEpisodes: customerData.unlockedEpisodes?.length || 0
      },
      analysis: {
        currentBalance: customerData.credits,
        calculatedBalance: runningBalance,
        discrepancy: customerData.credits - runningBalance,
        transactionCount: transactions.length,
        hasDuplicates: duplicates.length > 0
      },
      creditOperations: creditOperations.reverse(), // Show most recent first
      recentTransactions: transactions.slice(0, 10),
      duplicates,
      recentActivities: activities,
      debug: {
        totalPurchases: transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + (t.credits || 0), 0),
        totalGrants: transactions.filter(t => t.type === 'admin_grant').reduce((sum, t) => sum + (t.credits || 0), 0),
        totalSpends: transactions.filter(t => t.type === 'spend').reduce((sum, t) => sum + (t.amount || 0), 0),
        totalBonus: transactions.filter(t => t.type === 'bonus').reduce((sum, t) => sum + (t.credits || t.amount || 0), 0)
      }
    });

  } catch (error: any) {
    console.error('[Check Credits] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to check credits',
      stack: error.stack
    }, { status: 500 });
  }
}