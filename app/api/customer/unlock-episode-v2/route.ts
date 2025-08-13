import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { extractUidFromToken } from '@/lib/utils/token-utils';
import { addUserActivity } from '@/lib/firebase/activity-service';
import { getSeriesFirebase } from '@/lib/firebase/content-service';

// Initialize Firebase Admin with fallback options
function getAdminDb() {
  try {
    if (!getApps().length) {
      // Try different initialization methods
      if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'fabletech-studios-897f1',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          })
        });
      } else {
        // Initialize without credentials - will use default
        initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'fabletech-studios-897f1'
        });
      }
    }
    return getFirestore();
  } catch (error) {
    console.error('Admin initialization failed:', error);
    return null;
  }
}

// Use client SDK as ultimate fallback
async function getClientDb() {
  const { initializeApp, getApps } = await import('firebase/app');
  const { getFirestore } = await import('firebase/firestore');
  
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'fabletech-studios-897f1',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  
  let app;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  return getFirestore(app);
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Extract UID from token using standardized function
    let uid: string;
    let userInfo: any;
    try {
      const extracted = extractUidFromToken(token);
      uid = extracted.uid;
      userInfo = extracted.userInfo;
    } catch (error: any) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { seriesId, episodeNumber, creditCost } = body;

    if (!seriesId || !episodeNumber || creditCost === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Try Admin SDK first, fall back to Client SDK
    let db = getAdminDb();
    let usingAdmin = true;
    
    if (!db) {
      console.log('Admin SDK failed, using client SDK');
      db = await getClientDb();
      usingAdmin = false;
    }
    
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database not available' }, { status: 500 });
    }

    // Perform the unlock operation
    if (usingAdmin) {
      // Admin SDK approach - bypasses all rules
      const customerRef = db.collection('customers').doc(uid);
      
      // Run transaction
      const result = await db.runTransaction(async (transaction: any) => {
        const doc = await transaction.get(customerRef);
        
        let customerData;
        if (!doc.exists) {
          // Create new customer
          customerData = {
            uid: uid,
            email: userInfo.email,
            name: userInfo.name,
            credits: 100,
            createdAt: new Date(),
            updatedAt: new Date(),
            authProvider: 'google',
            photoURL: userInfo.picture,
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
          await transaction.set(customerRef, customerData);
        } else {
          customerData = doc.data();
        }
        
        // Check if already unlocked
        const alreadyUnlocked = customerData.unlockedEpisodes?.some(
          (ep: any) => ep.seriesId === seriesId && ep.episodeNumber === episodeNumber
        );
        
        if (alreadyUnlocked) {
          return {
            success: true,
            alreadyUnlocked: true,
            remainingCredits: customerData.credits
          };
        }
        
        // Check credits
        if (customerData.credits < creditCost) {
          throw new Error('Insufficient credits');
        }
        
        // Update customer
        const newCredits = customerData.credits - creditCost;
        const updates = {
          credits: newCredits,
          unlockedEpisodes: [
            ...(customerData.unlockedEpisodes || []),
            {
              seriesId,
              episodeNumber,
              unlockedAt: new Date()
            }
          ],
          updatedAt: new Date()
        };
        
        // Also update stats if they exist
        if (customerData.stats) {
          updates['stats.episodesUnlocked'] = (customerData.stats.episodesUnlocked || 0) + 1;
          updates['stats.creditsSpent'] = (customerData.stats.creditsSpent || 0) + creditCost;
        }
        
        await transaction.update(customerRef, updates);
        
        // Create transaction record
        const transactionRef = db.collection('credit-transactions').doc();
        await transaction.set(transactionRef, {
          customerId: uid,
          type: 'spend',
          amount: -creditCost,
          balance: newCredits,
          description: `Unlocked episode ${episodeNumber}`,
          metadata: { seriesId, episodeNumber },
          createdAt: new Date()
        });
        
        return {
          success: true,
          remainingCredits: newCredits,
          alreadyUnlocked: false
        };
      });
      
      // Add activity record if unlock was successful and not already unlocked
      if (result.success && !result.alreadyUnlocked) {
        try {
          const series = await getSeriesFirebase(seriesId);
          if (series) {
            const episode = series.episodes.find((ep: any) => ep.episodeNumber === episodeNumber);
            await addUserActivity({
              userId: uid,
              type: 'episode_unlocked',
              description: `Unlocked Episode ${episodeNumber} of ${series.title}`,
              metadata: {
                seriesId,
                seriesTitle: series.title,
                episodeNumber,
                episodeTitle: episode?.title || `Episode ${episodeNumber}`,
                creditsAmount: creditCost
              }
            });
          }
        } catch (activityError) {
          console.error('Failed to add activity record (Admin SDK):', activityError);
          // Don't fail the unlock if activity logging fails
        }
      }
      
      return NextResponse.json(result);
      
    } else {
      // Client SDK approach with runTransaction
      const { doc, getDoc, setDoc, runTransaction, updateDoc } = await import('firebase/firestore');
      
      const result = await runTransaction(db, async (transaction) => {
        const customerRef = doc(db, 'customers', uid);
        const docSnap = await transaction.get(customerRef);
        
        let customerData;
        if (!docSnap.exists()) {
          // Create new customer
          customerData = {
            uid: uid,
            email: userInfo.email,
            name: userInfo.name,
            credits: 100,
            createdAt: new Date(),
            updatedAt: new Date(),
            authProvider: 'google',
            photoURL: userInfo.picture,
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
          transaction.set(customerRef, customerData);
        } else {
          customerData = docSnap.data();
        }
        
        // Check if already unlocked
        const alreadyUnlocked = customerData.unlockedEpisodes?.some(
          (ep: any) => ep.seriesId === seriesId && ep.episodeNumber === episodeNumber
        );
        
        if (alreadyUnlocked) {
          return {
            success: true,
            alreadyUnlocked: true,
            remainingCredits: customerData.credits
          };
        }
        
        // Check credits
        if (customerData.credits < creditCost) {
          throw new Error('Insufficient credits');
        }
        
        // For client SDK, we need to be careful with the update
        // Only update credits (rules allow credit deduction)
        const newCredits = customerData.credits - creditCost;
        
        // First update just credits
        transaction.update(customerRef, {
          credits: newCredits
        });
        
        // Then try to update other fields separately (may fail due to rules)
        try {
          const updatedEpisodes = [
            ...(customerData.unlockedEpisodes || []),
            {
              seriesId,
              episodeNumber,
              unlockedAt: new Date()
            }
          ];
          
          // Do this outside transaction if rules block it
          setTimeout(async () => {
            try {
              await updateDoc(customerRef, {
                unlockedEpisodes: updatedEpisodes,
                updatedAt: new Date()
              });
            } catch (e) {
              console.log('Could not update unlocked episodes due to rules');
            }
          }, 100);
        } catch (e) {
          console.log('Rules prevented full update, but credits were deducted');
        }
        
        return {
          success: true,
          remainingCredits: newCredits,
          alreadyUnlocked: false
        };
      });
      
      // Add activity record if unlock was successful and not already unlocked
      if (result.success && !result.alreadyUnlocked) {
        try {
          const series = await getSeriesFirebase(seriesId);
          if (series) {
            const episode = series.episodes.find((ep: any) => ep.episodeNumber === episodeNumber);
            await addUserActivity({
              userId: uid,
              type: 'episode_unlocked',
              description: `Unlocked Episode ${episodeNumber} of ${series.title}`,
              metadata: {
                seriesId,
                seriesTitle: series.title,
                episodeNumber,
                episodeTitle: episode?.title || `Episode ${episodeNumber}`,
                creditsAmount: creditCost
              }
            });
          }
        } catch (activityError) {
          console.error('Failed to add activity record (Client SDK):', activityError);
          // Don't fail the unlock if activity logging fails
        }
      }
      
      return NextResponse.json(result);
    }
    
  } catch (error: any) {
    console.error('Unlock episode v2 error:', error);
    
    // If it's insufficient credits, return a clear message
    if (error.message?.includes('Insufficient credits')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient credits' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to unlock episode' },
      { status: 500 }
    );
  }
}

// GET method to check if episode is unlocked
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Extract UID from token using standardized function
    let uid: string;
    try {
      const extracted = extractUidFromToken(token);
      uid = extracted.uid;
    } catch (error: any) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const seriesId = searchParams.get('seriesId');
    const episodeNumber = searchParams.get('episodeNumber');

    console.log(`GET unlock-episode-v2: uid=${uid}, seriesId=${seriesId}, episode=${episodeNumber}`);

    if (!seriesId || !episodeNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Try Admin SDK first, fall back to Client SDK
    let db = getAdminDb();
    let usingAdmin = true;
    
    if (!db) {
      console.log('Admin SDK failed, using client SDK');
      db = await getClientDb();
      usingAdmin = false;
    }
    
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database not available' }, { status: 500 });
    }

    // Get customer document
    let customerData;
    if (usingAdmin) {
      const doc = await db.collection('customers').doc(uid).get();
      if (!doc.exists) {
        console.log(`Customer ${uid} not found in Admin SDK check`);
        // Try to use the customer service as fallback
        const { getFirebaseCustomer } = await import('@/lib/firebase/customer-service');
        const fallbackCustomer = await getFirebaseCustomer(uid);
        if (fallbackCustomer) {
          console.log(`Found customer ${uid} via fallback`);
          customerData = fallbackCustomer;
        } else {
          return NextResponse.json({
            success: true,
            isUnlocked: false,
            credits: 100 // Default for new users
          });
        }
      } else {
        customerData = doc.data();
      }
    } else {
      const { doc, getDoc } = await import('firebase/firestore');
      const customerRef = doc(db, 'customers', uid);
      const docSnap = await getDoc(customerRef);
      if (!docSnap.exists()) {
        console.log(`Customer ${uid} not found in client SDK check`);
        // Try to use the customer service as fallback
        const { getFirebaseCustomer } = await import('@/lib/firebase/customer-service');
        const fallbackCustomer = await getFirebaseCustomer(uid);
        if (fallbackCustomer) {
          console.log(`Found customer ${uid} via fallback`);
          customerData = fallbackCustomer;
        } else {
          return NextResponse.json({
            success: true,
            isUnlocked: false,
            credits: 100 // Default for new users
          });
        }
      } else {
        customerData = docSnap.data();
      }
    }

    // Check if episode is unlocked - handle both string and number episode numbers
    const episodeNum = parseInt(episodeNumber);
    const unlockedEpisodes = customerData.unlockedEpisodes || [];
    
    // Log for debugging
    console.log(`Customer ${uid} unlocked episodes:`, unlockedEpisodes.map((ep: any) => 
      `${ep.seriesId}/${ep.episodeNumber} (type: ${typeof ep.episodeNumber})`
    ));
    
    const isUnlocked = unlockedEpisodes.some((ep: any) => {
      // Handle both string and number episode numbers
      const epNum = typeof ep.episodeNumber === 'string' ? parseInt(ep.episodeNumber) : ep.episodeNumber;
      const matches = ep.seriesId === seriesId && epNum === episodeNum;
      if (matches) {
        console.log(`Found match: ${ep.seriesId}/${ep.episodeNumber}`);
      }
      return matches;
    });

    console.log(`Customer ${uid} has ${customerData.credits} credits, unlocked episodes: ${unlockedEpisodes.length}`);
    console.log(`Episode ${seriesId}/${episodeNumber} (parsed as ${episodeNum}) is ${isUnlocked ? 'UNLOCKED' : 'LOCKED'}`);

    return NextResponse.json({
      success: true,
      isUnlocked,
      credits: customerData.credits || 0
    });
    
  } catch (error: any) {
    console.error('Check unlock error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}