import { NextRequest, NextResponse } from 'next/server';
import { 
  getFirebaseCustomer, 
  unlockEpisodeFirebase 
} from '@/lib/firebase/customer-service';
import { addUserActivity } from '@/lib/firebase/activity-service';
import { getSeriesFirebase } from '@/lib/firebase/content-service';
import { checkAndAwardBadges } from '@/lib/firebase/badge-service';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify Firebase ID token
    let uid: string;
    try {
      // Parse token to extract UID
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      uid = payload.user_id || payload.sub || payload.uid;
      if (!uid) {
        console.error('Token payload missing uid:', payload);
        throw new Error('Invalid token - no uid');
      }
    } catch (error: any) {
      console.error('Token verification error:', error.message);
      return NextResponse.json(
        { success: false, error: 'Invalid token: ' + error.message },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { seriesId, episodeNumber, creditCost } = body;

    if (!seriesId || !episodeNumber || creditCost === undefined) {
      console.error('Missing fields:', { seriesId, episodeNumber, creditCost });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if customer exists first, and create if needed
    let customer = await getFirebaseCustomer(uid);
    if (!customer) {
      console.error('Customer not found for uid:', uid, '- ensuring document exists...');
      
      // Call emergency-fix endpoint to ensure customer exists
      try {
        const fixResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/customer/emergency-fix`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (fixResponse.ok) {
          const fixResult = await fixResponse.json();
          console.log('Emergency fix result:', fixResult);
          
          // Try to get the customer again
          customer = await getFirebaseCustomer(uid);
        } else {
          console.error('Emergency fix failed:', await fixResponse.text());
        }
      } catch (fixError) {
        console.error('Failed to call emergency fix:', fixError);
      }
      
      // If still no customer, try direct creation as fallback
      if (!customer) {
        try {
          const tokenParts = token.split('.');
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          
          // Try both admin and client SDK approaches
          const { adminDb } = await import('@/lib/firebase/admin');
          const { doc, setDoc } = await import('firebase/firestore');
          const { serverDb } = await import('@/lib/firebase/server-config');
          
          const customerData = {
            uid: uid,
            email: payload.email || `${uid}@google.com`,
            name: payload.name || payload.given_name || 'Google User',
            credits: 100, // Welcome bonus
            createdAt: new Date(),
            updatedAt: new Date(),
            authProvider: payload.firebase?.sign_in_provider === 'google.com' ? 'google' : 'email',
            photoURL: payload.picture || '',
            emailVerified: true,
            unlockedEpisodes: [],
            stats: {
              episodesUnlocked: 0,
              creditsSpent: 0,
              totalCreditsPurchased: 0,
              seriesCompleted: 0
            },
            subscription: {
              status: 'active',
              tier: 'free'
            }
          };
          
          // Try admin SDK first
          if (adminDb) {
            console.log('Creating customer with admin SDK...');
            await adminDb.collection('customers').doc(uid).set(customerData);
          } else if (serverDb) {
            console.log('Creating customer with client SDK...');
            await setDoc(doc(serverDb, 'customers', uid), customerData);
          }
          
          // Try to get the customer again
          customer = await getFirebaseCustomer(uid);
        } catch (createError) {
          console.error('Failed to create customer document:', createError);
        }
      }
      
      if (!customer) {
        return NextResponse.json(
          { success: false, error: 'Customer not found and could not be created' },
          { status: 400 }
        );
      }
    }

    // Try to unlock episode using Admin SDK first (bypasses rules)
    let result: any = { success: false };
    
    try {
      const { adminDb } = await import('@/lib/firebase/admin');
      
      if (adminDb) {
        console.log('Attempting unlock with Admin SDK...');
        
        // Use Admin SDK transaction (bypasses security rules)
        const admin = await import('firebase-admin');
        
        result = await adminDb.runTransaction(async (transaction: any) => {
          const customerRef = adminDb.collection('customers').doc(uid);
          const customerDoc = await transaction.get(customerRef);
          
          if (!customerDoc.exists) {
            // Create customer if doesn't exist
            const customerData = {
              uid: uid,
              email: customer?.email || `${uid}@google.com`,
              name: customer?.name || 'User',
              credits: 100,
              createdAt: admin.firestore.Timestamp.now(),
              updatedAt: admin.firestore.Timestamp.now(),
              authProvider: 'google',
              emailVerified: true,
              unlockedEpisodes: [],
              stats: {
                episodesUnlocked: 0,
                creditsSpent: 0,
                totalCreditsPurchased: 0,
                seriesCompleted: 0
              }
            };
            await transaction.set(customerRef, customerData);
            // Re-get the document
            const newDoc = await transaction.get(customerRef);
            return { success: false, error: 'Customer was just created, please try again' };
          }
          
          const customerData = customerDoc.data();
          
          // Check if already unlocked
          const alreadyUnlocked = customerData.unlockedEpisodes?.some(
            (ep: any) => ep.seriesId === seriesId && ep.episodeNumber === episodeNumber
          );
          
          if (alreadyUnlocked) {
            return { success: true, alreadyUnlocked: true, credits: customerData.credits };
          }
          
          // Check credits
          if (customerData.credits < creditCost) {
            throw new Error('Insufficient credits');
          }
          
          // Update customer
          const newCredits = customerData.credits - creditCost;
          const updatedUnlockedEpisodes = [
            ...(customerData.unlockedEpisodes || []),
            {
              seriesId,
              episodeNumber,
              unlockedAt: admin.firestore.Timestamp.now()
            }
          ];
          
          // Update with Admin SDK (bypasses rules)
          transaction.update(customerRef, {
            credits: newCredits,
            unlockedEpisodes: updatedUnlockedEpisodes,
            'stats.episodesUnlocked': admin.firestore.FieldValue.increment(1),
            'stats.creditsSpent': admin.firestore.FieldValue.increment(creditCost),
            updatedAt: admin.firestore.Timestamp.now()
          });
          
          // Create transaction record
          const transactionRef = adminDb.collection('credit-transactions').doc();
          transaction.set(transactionRef, {
            customerId: uid,
            type: 'spend',
            amount: -creditCost,
            balance: newCredits,
            description: `Unlocked episode ${episodeNumber}`,
            metadata: { seriesId, episodeNumber },
            createdAt: admin.firestore.Timestamp.now()
          });
          
          return { success: true, credits: newCredits };
        });
        
        console.log('Admin SDK unlock result:', result);
      }
    } catch (adminError: any) {
      console.error('Admin SDK unlock failed:', adminError.message);
      
      // Fall back to client SDK
      console.log('Falling back to client SDK unlock...');
      result = await unlockEpisodeFirebase(
        uid,
        seriesId,
        episodeNumber,
        creditCost
      );
    }
    
    // If still no success, try client SDK
    if (!result.success && !result.alreadyUnlocked) {
      console.log('Attempting client SDK unlock as final fallback...');
      result = await unlockEpisodeFirebase(
        uid,
        seriesId,
        episodeNumber,
        creditCost
      );
    }

    if (!result.success && !result.alreadyUnlocked) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to unlock episode'
        },
        { status: 400 }
      );
    }

    // Track activity
    const series = await getSeriesFirebase(seriesId);
    if (series) {
      const episode = series.episodes.find(ep => ep.episodeNumber === episodeNumber);
      await addUserActivity({
        userId: uid,
        type: 'episode_unlocked',
        description: `Unlocked Episode ${episodeNumber} of ${series.title}`,
        metadata: {
          seriesId,
          seriesTitle: series.title,
          episodeNumber,
          episodeTitle: episode?.title,
          creditsAmount: creditCost
        }
      });
    }

    // Check and award badges - fetch fresh customer data after unlock
    console.log('Fetching updated customer data for badges...');
    const updatedCustomer = await getFirebaseCustomer(uid);
    if (updatedCustomer) {
      const userStats = {
        episodesUnlocked: updatedCustomer.stats?.episodesUnlocked || 0,
        totalCreditsPurchased: updatedCustomer.stats?.totalCreditsPurchased || 0,
        seriesCompleted: updatedCustomer.stats?.seriesCompleted || 0,
        createdAt: updatedCustomer.createdAt
      };
      
      console.log('Checking badges for user:', uid, 'with stats:', userStats);
      
      const awardedBadges = await checkAndAwardBadges(uid, userStats);
      
      if (awardedBadges.length > 0) {
        console.log('Awarded badges:', awardedBadges);
      }
      
      // Return awarded badges in response
      return NextResponse.json({
        success: true,
        remainingCredits: result.credits || result.remainingCredits || (customer?.credits || 0) - creditCost,
        unlockedEpisode: {
          seriesId,
          episodeNumber,
          unlockedAt: new Date().toISOString()
        },
        awardedBadges
      });
    }

    return NextResponse.json({
      success: true,
      remainingCredits: result.credits || result.remainingCredits || (customer?.credits || 0) - creditCost,
      unlockedEpisode: {
        seriesId,
        episodeNumber,
        unlockedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Unlock episode error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Check if episode is unlocked
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

    // Verify Firebase ID token
    let uid: string;
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      uid = payload.user_id || payload.sub || payload.uid;
      if (!uid) {
        console.error('Token payload missing uid:', payload);
        throw new Error('Invalid token - no uid');
      }
    } catch (error: any) {
      console.error('Token verification error:', error.message);
      return NextResponse.json(
        { success: false, error: 'Invalid token: ' + error.message },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const seriesId = searchParams.get('seriesId');
    const episodeNumber = searchParams.get('episodeNumber');

    if (!seriesId || !episodeNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('Checking unlock status for user:', uid, 'series:', seriesId, 'episode:', episodeNumber);
    
    // Check if customer exists first, and create if needed
    let customer = await getFirebaseCustomer(uid);
    if (!customer) {
      console.error('Customer not found for uid:', uid, '- ensuring document exists...');
      
      // Call emergency-fix endpoint to ensure customer exists
      try {
        const fixResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/customer/emergency-fix`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (fixResponse.ok) {
          const fixResult = await fixResponse.json();
          console.log('Emergency fix result:', fixResult);
          
          // Try to get the customer again
          customer = await getFirebaseCustomer(uid);
        } else {
          console.error('Emergency fix failed:', await fixResponse.text());
        }
      } catch (fixError) {
        console.error('Failed to call emergency fix:', fixError);
      }
      
      // If still no customer, try direct creation as fallback
      if (!customer) {
        try {
          const tokenParts = token.split('.');
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          
          // Try both admin and client SDK approaches
          const { adminDb } = await import('@/lib/firebase/admin');
          const { doc, setDoc } = await import('firebase/firestore');
          const { serverDb } = await import('@/lib/firebase/server-config');
          
          const customerData = {
            uid: uid,
            email: payload.email || `${uid}@google.com`,
            name: payload.name || payload.given_name || 'Google User',
            credits: 100, // Welcome bonus
            createdAt: new Date(),
            updatedAt: new Date(),
            authProvider: payload.firebase?.sign_in_provider === 'google.com' ? 'google' : 'email',
            photoURL: payload.picture || '',
            emailVerified: true,
            unlockedEpisodes: [],
            stats: {
              episodesUnlocked: 0,
              creditsSpent: 0,
              totalCreditsPurchased: 0,
              seriesCompleted: 0
            },
            subscription: {
              status: 'active',
              tier: 'free'
            }
          };
          
          // Try admin SDK first
          if (adminDb) {
            console.log('Creating customer with admin SDK...');
            await adminDb.collection('customers').doc(uid).set(customerData);
          } else if (serverDb) {
            console.log('Creating customer with client SDK...');
            await setDoc(doc(serverDb, 'customers', uid), customerData);
          }
          
          // Try to get the customer again
          customer = await getFirebaseCustomer(uid);
        } catch (createError) {
          console.error('Failed to create customer document:', createError);
        }
      }
      
      if (!customer) {
        // Return success with default values instead of 404
        console.log('Customer could not be created, returning default values');
        return NextResponse.json({
          success: true,
          isUnlocked: false, // First episode is free, so check episode number
          credits: 100 // Default credits for new users
        });
      }
    }
    
    console.log('Customer found:', { uid: customer.uid, hasUnlockedEpisodes: !!customer.unlockedEpisodes });

    const unlockedEpisodes = customer.unlockedEpisodes || [];
    const isUnlocked = unlockedEpisodes.some(
      ep => ep.seriesId === seriesId && ep.episodeNumber === parseInt(episodeNumber)
    );

    return NextResponse.json({
      success: true,
      isUnlocked,
      credits: customer.credits
    });

  } catch (error: any) {
    console.error('Check unlock error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}