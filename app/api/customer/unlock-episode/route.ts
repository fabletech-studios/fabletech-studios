import { NextRequest, NextResponse } from 'next/server';
import { 
  getFirebaseCustomer, 
  unlockEpisodeFirebase 
} from '@/lib/firebase/customer-service';
import { addUserActivity } from '@/lib/firebase/activity-service';
import { getSeriesFirebase } from '@/lib/firebase/content-service';
import { checkAndAwardBadges } from '@/lib/firebase/badge-service';
import { extractUidFromToken } from '@/lib/utils/token-utils';

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
    
    // Extract UID using standardized function
    let uid: string;
    let userInfo: any;
    try {
      const extracted = extractUidFromToken(token);
      uid = extracted.uid;
      userInfo = extracted.userInfo;
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

    // Try Admin SDK first (bypasses security rules)
    let customer: any = null;
    
    try {
      const { adminDb } = await import('@/lib/firebase/admin');
      if (adminDb) {
        const customerDoc = await adminDb.collection('customers').doc(uid).get();
        if (customerDoc.exists) {
          customer = customerDoc.data();
          customer.uid = uid;
        }
      }
    } catch (error) {
      console.log('Admin SDK not available, falling back to client SDK');
    }
    
    // Fallback to client SDK if Admin SDK failed
    if (!customer) {
      customer = await getFirebaseCustomer(uid);
    }
    
    if (!customer) {
      console.error('Customer not found for uid:', uid);
      return NextResponse.json(
        { success: false, error: 'Customer document not found. Please ensure you are logged in properly and try refreshing the page.' },
        { status: 400 }
      );
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
            // DO NOT create a new customer here - this causes the 100 credit reset bug
            throw new Error('Customer document not found. Please ensure you are logged in properly.');
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

    // Extract UID using standardized function
    let uid: string;
    try {
      const extracted = extractUidFromToken(token);
      uid = extracted.uid;
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
    
    // Try Admin SDK first (bypasses security rules)
    let customer: any = null;
    
    try {
      const { adminDb } = await import('@/lib/firebase/admin');
      if (adminDb) {
        const customerDoc = await adminDb.collection('customers').doc(uid).get();
        if (customerDoc.exists) {
          customer = customerDoc.data();
          customer.uid = uid;
        }
      }
    } catch (error) {
      console.log('Admin SDK not available, falling back to client SDK');
    }
    
    // Fallback to client SDK if Admin SDK failed
    if (!customer) {
      customer = await getFirebaseCustomer(uid);
    }
    
    if (!customer) {
      console.error('Customer not found for uid:', uid);
      // For GET requests (checking unlock status), return default values
      // DO NOT create customers here as it causes data overwrites
      return NextResponse.json({
        success: true,
        isUnlocked: false,
        credits: 100 // Default for display only
      });
    }
    
    console.log('Customer found:', { 
      uid: customer.uid, 
      credits: customer.credits,
      unlockedCount: customer.unlockedEpisodes?.length || 0
    });

    const unlockedEpisodes = customer.unlockedEpisodes || [];
    
    // Log all unlocked episodes for debugging
    console.log('Customer unlocked episodes:', unlockedEpisodes.map((ep: any) => ({
      seriesId: ep.seriesId,
      episodeNumber: ep.episodeNumber
    })));
    
    console.log('Checking for:', { seriesId, episodeNumber: parseInt(episodeNumber) });
    
    const isUnlocked = unlockedEpisodes.some(
      ep => ep.seriesId === seriesId && ep.episodeNumber === parseInt(episodeNumber)
    );
    
    console.log('Is unlocked result:', isUnlocked);

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