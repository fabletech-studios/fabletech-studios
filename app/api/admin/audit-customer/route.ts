import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    console.log(`🔍 Starting comprehensive audit for: ${email}`);
    
    // Expected package configurations
    const EXPECTED_PACKAGES = {
      starter: { credits: 50, price: 499, name: 'Starter Pack' },
      popular: { credits: 100, price: 999, name: 'Popular Pack' },
      premium: { credits: 200, price: 1999, name: 'Premium Pack' }
    };
    
    const { adminDb } = await import('@/lib/firebase/admin');
    
    if (!adminDb) {
      // Fallback to client SDK
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const { serverDb } = await import('@/lib/firebase/server-config');
      
      if (!serverDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }
      
      // Step 1: Find customer(s) with this email
      const customersQuery = query(collection(serverDb, 'customers'), where('email', '==', email));
      const customersSnapshot = await getDocs(customersQuery);
      
      if (customersSnapshot.empty) {
        return NextResponse.json({ 
          error: 'Customer not found',
          email,
          found: false
        }, { status: 404 });
      }
      
      const auditResults = [];
      
      // Audit each customer found (in case of duplicates)
      for (const customerDoc of customersSnapshot.docs) {
        const customerData = customerDoc.data();
        const userId = customerDoc.id;
        
        console.log(`📊 Auditing customer: ${userId}`);
        
        // Step 2: Get credit transactions
        const transactionsQuery = query(
          collection(serverDb, 'credit-transactions'), 
          where('customerId', '==', userId)
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        
        // Step 3: Get user activities
        const activitiesQuery = query(
          collection(serverDb, 'userActivities'), 
          where('userId', '==', userId)
        );
        const activitiesSnapshot = await getDocs(activitiesQuery);
        
        // Process transactions
        const transactions = [];
        let purchaseDiscrepancies = [];
        let transactionAnalysis = {
          purchases: 0,
          spends: 0,
          bonuses: 0,
          totalCreditsAdded: 0,
          totalCreditsSpent: 0,
          totalAmountPaid: 0
        };
        
        transactionsSnapshot.forEach((doc) => {
          const transaction = doc.data();
          const transactionWithId = { id: doc.id, ...transaction };
          transactions.push(transactionWithId);
          
          if (transaction.type === 'purchase') {
            const packageId = transaction.packageId;
            const amountPaid = transaction.amount; // in cents
            const creditsReceived = transaction.credits || transaction.amount;
            
            // Check against expected pricing
            const expectedPackage = EXPECTED_PACKAGES[packageId];
            if (expectedPackage) {
              const isPriceCorrect = amountPaid === expectedPackage.price;
              const isCreditsCorrect = creditsReceived === expectedPackage.credits;
              
              if (!isPriceCorrect || !isCreditsCorrect) {
                purchaseDiscrepancies.push({
                  transactionId: doc.id,
                  packageId,
                  actualPrice: amountPaid,
                  expectedPrice: expectedPackage.price,
                  actualCredits: creditsReceived,
                  expectedCredits: expectedPackage.credits,
                  priceDiscrepancy: amountPaid - expectedPackage.price,
                  creditsDiscrepancy: creditsReceived - expectedPackage.credits
                });
              }
            }
            
            transactionAnalysis.purchases++;
            transactionAnalysis.totalCreditsAdded += creditsReceived;
            transactionAnalysis.totalAmountPaid += amountPaid;
          } else if (transaction.type === 'spend') {
            transactionAnalysis.spends++;
            transactionAnalysis.totalCreditsSpent += Math.abs(transaction.amount || transaction.credits);
          } else if (transaction.type === 'bonus') {
            transactionAnalysis.bonuses++;
            transactionAnalysis.totalCreditsAdded += transaction.amount || transaction.credits;
          }
        });
        
        // Process activities
        const activities = [];
        let activityAnalysis = {
          episode_unlocked: 0,
          episode_watched: 0,
          credits_purchased: 0,
          credits_spent: 0,
          badge_earned: 0,
          other: 0
        };
        
        activitiesSnapshot.forEach((doc) => {
          const activity = doc.data();
          const activityWithId = { id: doc.id, ...activity };
          activities.push(activityWithId);
          
          // Count by type
          if (activityAnalysis.hasOwnProperty(activity.type)) {
            activityAnalysis[activity.type]++;
          } else {
            activityAnalysis.other++;
          }
        });
        
        // Data consistency checks
        const unlockedFromCustomer = (customerData.unlockedEpisodes || []).length;
        const unlockedFromActivities = activityAnalysis.episode_unlocked;
        const unlockedFromStats = customerData.stats?.episodesUnlocked || 0;
        
        const calculatedBalance = transactionAnalysis.totalCreditsAdded - transactionAnalysis.totalCreditsSpent;
        const actualBalance = customerData.credits || 0;
        
        // Generate audit results for this customer
        const auditResult = {
          customer: {
            uid: userId,
            email: customerData.email,
            name: customerData.name || 'N/A',
            credits: customerData.credits || 0,
            unlockedEpisodes: unlockedFromCustomer,
            emailVerified: customerData.emailVerified || false,
            createdAt: customerData.createdAt,
            stats: customerData.stats || {}
          },
          transactions: {
            total: transactions.length,
            analysis: transactionAnalysis,
            discrepancies: purchaseDiscrepancies,
            list: transactions
          },
          activities: {
            total: activities.length,
            analysis: activityAnalysis,
            list: activities
          },
          consistencyChecks: {
            episodeUnlocks: {
              customerDoc: unlockedFromCustomer,
              activities: unlockedFromActivities,
              stats: unlockedFromStats,
              consistent: unlockedFromCustomer === unlockedFromActivities && unlockedFromCustomer === unlockedFromStats
            },
            creditBalance: {
              calculated: calculatedBalance,
              actual: actualBalance,
              discrepancy: actualBalance - calculatedBalance,
              consistent: calculatedBalance === actualBalance
            }
          },
          issues: {
            purchasePriceDiscrepancies: purchaseDiscrepancies.length > 0,
            episodeUnlockMismatch: unlockedFromCustomer !== unlockedFromActivities || unlockedFromCustomer !== unlockedFromStats,
            creditBalanceMismatch: calculatedBalance !== actualBalance,
            noTransactions: transactions.length === 0,
            noActivities: activities.length === 0
          },
          recommendations: []
        };
        
        // Generate recommendations
        if (purchaseDiscrepancies.length > 0) {
          auditResult.recommendations.push('Fix price discrepancies in transaction records');
          auditResult.recommendations.push('Review Stripe webhook implementation');
          auditResult.recommendations.push('Check package price configuration');
        }
        
        if (unlockedFromCustomer !== unlockedFromActivities) {
          auditResult.recommendations.push('Review episode unlock activity tracking');
          auditResult.recommendations.push('Check if activities are being created for all unlocks');
        }
        
        if (calculatedBalance !== actualBalance) {
          auditResult.recommendations.push('Investigate credit balance calculation issues');
          auditResult.recommendations.push('Review transaction recording accuracy');
        }
        
        if (activities.length === 0) {
          auditResult.recommendations.push('No user activities found - check if activity tracking is working');
        }
        
        if (transactions.length === 0) {
          auditResult.recommendations.push('No transactions found - verify payment processing is working');
        }
        
        if (auditResult.recommendations.length === 0) {
          auditResult.recommendations.push('All systems appear to be working correctly');
        }
        
        auditResults.push(auditResult);
      }
      
      return NextResponse.json({
        email,
        found: true,
        customerCount: customersSnapshot.size,
        hasDuplicates: customersSnapshot.size > 1,
        auditResults,
        summary: {
          totalIssuesFound: auditResults.reduce((sum, result) => 
            sum + Object.values(result.issues).filter(issue => issue === true).length, 0
          ),
          allSystemsHealthy: auditResults.every(result => 
            result.recommendations.length === 1 && 
            result.recommendations[0] === 'All systems appear to be working correctly'
          )
        }
      });
    }
    
    // Admin SDK version (similar logic but using Admin SDK)
    const snapshot = await adminDb.collection('customers')
      .where('email', '==', email)
      .get();
    
    if (snapshot.empty) {
      return NextResponse.json({ 
        error: 'Customer not found',
        email,
        found: false
      }, { status: 404 });
    }
    
    const auditResults = [];
    
    for (const customerDoc of snapshot.docs) {
      const customerData = customerDoc.data();
      const userId = customerDoc.id;
      
      // Get transactions and activities using Admin SDK
      const [transactionsSnapshot, activitiesSnapshot] = await Promise.all([
        adminDb.collection('credit-transactions').where('customerId', '==', userId).get(),
        adminDb.collection('userActivities').where('userId', '==', userId).get()
      ]);
      
      // Process data (same logic as above)
      const transactions = [];
      let purchaseDiscrepancies = [];
      let transactionAnalysis = {
        purchases: 0,
        spends: 0,
        bonuses: 0,
        totalCreditsAdded: 0,
        totalCreditsSpent: 0,
        totalAmountPaid: 0
      };
      
      transactionsSnapshot.forEach((doc) => {
        const transaction = doc.data();
        const transactionWithId = { id: doc.id, ...transaction };
        transactions.push(transactionWithId);
        
        if (transaction.type === 'purchase') {
          const packageId = transaction.packageId;
          const amountPaid = transaction.amount;
          const creditsReceived = transaction.credits || transaction.amount;
          
          const expectedPackage = EXPECTED_PACKAGES[packageId];
          if (expectedPackage) {
            const isPriceCorrect = amountPaid === expectedPackage.price;
            const isCreditsCorrect = creditsReceived === expectedPackage.credits;
            
            if (!isPriceCorrect || !isCreditsCorrect) {
              purchaseDiscrepancies.push({
                transactionId: doc.id,
                packageId,
                actualPrice: amountPaid,
                expectedPrice: expectedPackage.price,
                actualCredits: creditsReceived,
                expectedCredits: expectedPackage.credits,
                priceDiscrepancy: amountPaid - expectedPackage.price,
                creditsDiscrepancy: creditsReceived - expectedPackage.credits
              });
            }
          }
          
          transactionAnalysis.purchases++;
          transactionAnalysis.totalCreditsAdded += creditsReceived;
          transactionAnalysis.totalAmountPaid += amountPaid;
        } else if (transaction.type === 'spend') {
          transactionAnalysis.spends++;
          transactionAnalysis.totalCreditsSpent += Math.abs(transaction.amount || transaction.credits);
        } else if (transaction.type === 'bonus') {
          transactionAnalysis.bonuses++;
          transactionAnalysis.totalCreditsAdded += transaction.amount || transaction.credits;
        }
      });
      
      const activities = [];
      let activityAnalysis = {
        episode_unlocked: 0,
        episode_watched: 0,
        credits_purchased: 0,
        credits_spent: 0,
        badge_earned: 0,
        other: 0
      };
      
      activitiesSnapshot.forEach((doc) => {
        const activity = doc.data();
        const activityWithId = { id: doc.id, ...activity };
        activities.push(activityWithId);
        
        if (activityAnalysis.hasOwnProperty(activity.type)) {
          activityAnalysis[activity.type]++;
        } else {
          activityAnalysis.other++;
        }
      });
      
      // Same consistency checks and audit result generation as above
      const unlockedFromCustomer = (customerData.unlockedEpisodes || []).length;
      const unlockedFromActivities = activityAnalysis.episode_unlocked;
      const unlockedFromStats = customerData.stats?.episodesUnlocked || 0;
      
      const calculatedBalance = transactionAnalysis.totalCreditsAdded - transactionAnalysis.totalCreditsSpent;
      const actualBalance = customerData.credits || 0;
      
      const auditResult = {
        customer: {
          uid: userId,
          email: customerData.email,
          name: customerData.name || 'N/A',
          credits: customerData.credits || 0,
          unlockedEpisodes: unlockedFromCustomer,
          emailVerified: customerData.emailVerified || false,
          createdAt: customerData.createdAt,
          stats: customerData.stats || {}
        },
        transactions: {
          total: transactions.length,
          analysis: transactionAnalysis,
          discrepancies: purchaseDiscrepancies,
          list: transactions
        },
        activities: {
          total: activities.length,
          analysis: activityAnalysis,
          list: activities
        },
        consistencyChecks: {
          episodeUnlocks: {
            customerDoc: unlockedFromCustomer,
            activities: unlockedFromActivities,
            stats: unlockedFromStats,
            consistent: unlockedFromCustomer === unlockedFromActivities && unlockedFromCustomer === unlockedFromStats
          },
          creditBalance: {
            calculated: calculatedBalance,
            actual: actualBalance,
            discrepancy: actualBalance - calculatedBalance,
            consistent: calculatedBalance === actualBalance
          }
        },
        issues: {
          purchasePriceDiscrepancies: purchaseDiscrepancies.length > 0,
          episodeUnlockMismatch: unlockedFromCustomer !== unlockedFromActivities || unlockedFromCustomer !== unlockedFromStats,
          creditBalanceMismatch: calculatedBalance !== actualBalance,
          noTransactions: transactions.length === 0,
          noActivities: activities.length === 0
        },
        recommendations: []
      };
      
      // Generate recommendations
      if (purchaseDiscrepancies.length > 0) {
        auditResult.recommendations.push('Fix price discrepancies in transaction records');
        auditResult.recommendations.push('Review Stripe webhook implementation');
        auditResult.recommendations.push('Check package price configuration');
      }
      
      if (unlockedFromCustomer !== unlockedFromActivities) {
        auditResult.recommendations.push('Review episode unlock activity tracking');
        auditResult.recommendations.push('Check if activities are being created for all unlocks');
      }
      
      if (calculatedBalance !== actualBalance) {
        auditResult.recommendations.push('Investigate credit balance calculation issues');
        auditResult.recommendations.push('Review transaction recording accuracy');
      }
      
      if (activities.length === 0) {
        auditResult.recommendations.push('No user activities found - check if activity tracking is working');
      }
      
      if (transactions.length === 0) {
        auditResult.recommendations.push('No transactions found - verify payment processing is working');
      }
      
      if (auditResult.recommendations.length === 0) {
        auditResult.recommendations.push('All systems appear to be working correctly');
      }
      
      auditResults.push(auditResult);
    }
    
    return NextResponse.json({
      email,
      found: true,
      customerCount: snapshot.size,
      hasDuplicates: snapshot.size > 1,
      auditResults,
      summary: {
        totalIssuesFound: auditResults.reduce((sum, result) => 
          sum + Object.values(result.issues).filter(issue => issue === true).length, 0
        ),
        allSystemsHealthy: auditResults.every(result => 
          result.recommendations.length === 1 && 
          result.recommendations[0] === 'All systems appear to be working correctly'
        )
      }
    });
    
  } catch (error: any) {
    console.error('Audit customer error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}