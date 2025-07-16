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
      // For client-side, we'll trust the token and extract UID
      // In production, use Firebase Admin SDK to verify
      const payload = JSON.parse(atob(token.split('.')[1]));
      uid = payload.user_id || payload.sub;
      if (!uid) throw new Error('Invalid token');
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { seriesId, episodeNumber, creditCost } = await request.json();

    if (!seriesId || !episodeNumber || creditCost === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Unlock episode with Firebase
    const result = await unlockEpisodeFirebase(
      uid,
      seriesId,
      episodeNumber,
      creditCost
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error
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
        remainingCredits: result.remainingCredits!,
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
      remainingCredits: result.remainingCredits!,
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
      const payload = JSON.parse(atob(token.split('.')[1]));
      uid = payload.user_id || payload.sub;
      if (!uid) throw new Error('Invalid token');
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
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

    const customer = await getFirebaseCustomer(uid);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

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