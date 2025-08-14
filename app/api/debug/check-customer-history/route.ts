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
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
      });
    }
    
    const db = admin.firestore();
    
    // Find ALL customers with this email (in case of duplicates)
    const customersSnapshot = await db.collection('customers')
      .where('email', '==', email.toLowerCase())
      .get();

    const customers = customersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    // For each customer, get their transaction history
    const customerHistories = await Promise.all(customers.map(async (customer) => {
      const transactionsSnapshot = await db.collection('credit-transactions')
        .where('customerId', '==', customer.id)
        .get();
      
      const transactions = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
      }));
      
      return {
        customer,
        transactions: transactions.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateA.getTime() - dateB.getTime();
        })
      };
    }));

    // Check for any activities that might have added credits
    const activities = [];
    for (const customer of customers) {
      const activitiesSnapshot = await db.collection('activities')
        .where('userId', '==', customer.id)
        .get();
      
      activitiesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.action === 'credit_purchase' || data.action === 'credits_added') {
          activities.push({
            id: doc.id,
            customerId: customer.id,
            ...data,
            timestamp: data.timestamp?.toDate?.() || data.timestamp
          });
        }
      });
    }

    // Look for any suspicious patterns
    const issues = [];
    
    // Check if customer was created with more than 100 credits
    for (const customer of customers) {
      const firstTransaction = customerHistories
        .find(h => h.customer.id === customer.id)
        ?.transactions[0];
      
      if (!firstTransaction || firstTransaction.type !== 'bonus' || firstTransaction.amount !== 100) {
        issues.push({
          type: 'unusual_starting_credits',
          customer: customer.id,
          credits: customer.credits,
          firstTransaction
        });
      }
    }

    return NextResponse.json({
      customersFound: customers.length,
      customers,
      customerHistories,
      activities,
      issues,
      analysis: {
        multipleAccounts: customers.length > 1,
        suspiciousActivity: issues.length > 0
      }
    });

  } catch (error: any) {
    console.error('[Check Customer History] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to check history',
      stack: error.stack
    }, { status: 500 });
  }
}