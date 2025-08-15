import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }
    
    if (!adminDb) {
      return NextResponse.json({ error: 'Admin database not initialized' }, { status: 500 });
    }
    
    console.log(`[Audit] Checking user: ${email}`);
    
    // Find user by email
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (error) {
      console.error('[Audit] User not found:', error);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = userRecord.uid;
    console.log(`[Audit] Found user: ${userId}`);
    
    // Get customer data
    const customerDoc = await adminDb.collection('customers').doc(userId).get();
    if (!customerDoc.exists) {
      return NextResponse.json({ error: 'Customer document not found' }, { status: 404 });
    }
    
    const customerData = customerDoc.data();
    
    // Get transactions
    const transactionsSnapshot = await adminDb.collection('credit-transactions')
      .where('customerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    const transactions = [];
    const expectedPrices = {
      starter: { credits: 50, price: 499 },
      popular: { credits: 100, price: 999 },
      premium: { credits: 200, price: 1999 }
    };
    
    let purchaseDiscrepancies = [];
    
    transactionsSnapshot.forEach(doc => {
      const data = doc.data();
      const transaction = {
        id: doc.id,
        type: data.type,
        amount: data.amount,
        credits: data.credits,
        balance: data.balance,
        packageId: data.packageId,
        description: data.description,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        metadata: data.metadata
      };
      
      // Check for price discrepancies
      if (data.type === 'purchase' && data.packageId && expectedPrices[data.packageId]) {
        const expected = expectedPrices[data.packageId];
        if (data.amount !== expected.price || data.credits !== expected.credits) {
          purchaseDiscrepancies.push({
            transactionId: doc.id,
            packageId: data.packageId,
            actualPrice: data.amount,
            expectedPrice: expected.price,
            actualCredits: data.credits,
            expectedCredits: expected.credits,
            priceDiff: data.amount - expected.price,
            creditsDiff: data.credits - expected.credits
          });
        }
      }
      
      transactions.push(transaction);
    });
    
    // Get activities
    const activitiesSnapshot = await adminDb.collection('userActivities')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    const activities = [];
    const activityTypes = {};
    
    activitiesSnapshot.forEach(doc => {
      const data = doc.data();
      const activity = {
        id: doc.id,
        type: data.type,
        description: data.description,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        metadata: data.metadata
      };
      activities.push(activity);
      activityTypes[data.type] = (activityTypes[data.type] || 0) + 1;
    });
    
    // Calculate totals
    const totalPurchases = transactions.filter(t => t.type === 'purchase').length;
    const totalSpends = transactions.filter(t => t.type === 'spend').length;
    const totalCreditsAdded = transactions
      .filter(t => t.type === 'purchase' || t.type === 'bonus')
      .reduce((sum, t) => sum + (t.credits || t.amount || 0), 0);
    const totalCreditsSpent = transactions
      .filter(t => t.type === 'spend')
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    
    // Check consistency
    const episodeUnlockActivities = activities.filter(a => a.type === 'episode_unlocked').length;
    const statsEpisodesUnlocked = customerData.stats?.episodesUnlocked || 0;
    const actualUnlockedEpisodes = customerData.unlockedEpisodes?.length || 0;
    
    const consistencyIssues = [];
    if (episodeUnlockActivities !== statsEpisodesUnlocked) {
      consistencyIssues.push(`Episode unlock count mismatch: activities=${episodeUnlockActivities}, stats=${statsEpisodesUnlocked}`);
    }
    if (episodeUnlockActivities !== actualUnlockedEpisodes) {
      consistencyIssues.push(`Episode unlock count mismatch: activities=${episodeUnlockActivities}, actual=${actualUnlockedEpisodes}`);
    }
    
    const calculatedBalance = totalCreditsAdded - totalCreditsSpent;
    const actualBalance = customerData.credits || 0;
    if (Math.abs(calculatedBalance - actualBalance) > 1) {
      consistencyIssues.push(`Credit balance mismatch: calculated=${calculatedBalance}, actual=${actualBalance}`);
    }
    
    return NextResponse.json({
      user: {
        uid: userId,
        email: email,
        emailVerified: userRecord.emailVerified
      },
      customer: {
        credits: customerData.credits || 0,
        unlockedEpisodes: actualUnlockedEpisodes,
        stats: customerData.stats || {},
        createdAt: customerData.createdAt?.toDate?.() || customerData.createdAt
      },
      transactions: {
        total: transactions.length,
        purchases: totalPurchases,
        spends: totalSpends,
        creditsAdded: totalCreditsAdded,
        creditsSpent: totalCreditsSpent,
        recent: transactions.slice(0, 10)
      },
      activities: {
        total: activities.length,
        types: activityTypes,
        recent: activities.slice(0, 10)
      },
      discrepancies: {
        purchases: purchaseDiscrepancies,
        consistency: consistencyIssues
      },
      analysis: {
        calculatedBalance,
        actualBalance,
        balanceDifference: actualBalance - calculatedBalance,
        episodeUnlockCounts: {
          fromActivities: episodeUnlockActivities,
          fromStats: statsEpisodesUnlocked,
          actual: actualUnlockedEpisodes
        }
      }
    });
    
  } catch (error) {
    console.error('[Audit] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}