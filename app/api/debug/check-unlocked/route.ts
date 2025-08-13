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

    console.log('Debug check for uid:', uid);
    
    const { searchParams } = new URL(request.url);
    const checkSeries = searchParams.get('seriesId');
    const checkEpisode = searchParams.get('episodeNumber');

    // Try Admin SDK first
    try {
      const { adminDb } = await import('@/lib/firebase/admin');
      
      if (adminDb) {
        const customerDoc = await adminDb.collection('customers').doc(uid).get();
        if (customerDoc.exists) {
          const data = customerDoc.data();
          
          // Check specific episode if requested
          let specificEpisodeUnlocked = null;
          if (checkSeries && checkEpisode) {
            const episodeNum = parseInt(checkEpisode);
            specificEpisodeUnlocked = data?.unlockedEpisodes?.some((ep: any) => {
              const epNum = typeof ep.episodeNumber === 'string' ? parseInt(ep.episodeNumber) : ep.episodeNumber;
              return ep.seriesId === checkSeries && epNum === episodeNum;
            }) || false;
          }
          
          return NextResponse.json({
            source: 'admin-sdk',
            uid: uid,
            credits: data?.credits || 0,
            unlockedEpisodes: data?.unlockedEpisodes || [],
            unlockedCount: data?.unlockedEpisodes?.length || 0,
            specificEpisodeCheck: checkSeries && checkEpisode ? {
              seriesId: checkSeries,
              episodeNumber: checkEpisode,
              isUnlocked: specificEpisodeUnlocked
            } : null,
            unlockedEpisodesList: (data?.unlockedEpisodes || []).map((ep: any) => 
              `${ep.seriesId}/Episode ${ep.episodeNumber}`
            )
          });
        }
      }
    } catch (error) {
      console.log('Admin SDK failed, trying client SDK');
    }

    // Fallback to client SDK
    const { getFirebaseCustomer } = await import('@/lib/firebase/customer-service');
    const customer = await getFirebaseCustomer(uid);
    
    if (customer) {
      // Check specific episode if requested
      let specificEpisodeUnlocked = null;
      if (checkSeries && checkEpisode) {
        const episodeNum = parseInt(checkEpisode);
        specificEpisodeUnlocked = customer.unlockedEpisodes?.some((ep: any) => {
          const epNum = typeof ep.episodeNumber === 'string' ? parseInt(ep.episodeNumber) : ep.episodeNumber;
          return ep.seriesId === checkSeries && epNum === episodeNum;
        }) || false;
      }
      
      return NextResponse.json({
        source: 'client-sdk',
        uid: uid,
        credits: customer.credits || 0,
        unlockedEpisodes: customer.unlockedEpisodes || [],
        unlockedCount: customer.unlockedEpisodes?.length || 0,
        specificEpisodeCheck: checkSeries && checkEpisode ? {
          seriesId: checkSeries,
          episodeNumber: checkEpisode,
          isUnlocked: specificEpisodeUnlocked
        } : null,
        unlockedEpisodesList: (customer.unlockedEpisodes || []).map((ep: any) => 
          `${ep.seriesId}/Episode ${ep.episodeNumber}`
        )
      });
    }

    return NextResponse.json({
      source: 'not-found',
      uid: uid,
      message: 'Customer not found in database'
    });

  } catch (error: any) {
    console.error('Debug check error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}