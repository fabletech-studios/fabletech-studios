import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();
    
    if (!uid) {
      return NextResponse.json({ error: 'UID required' }, { status: 400 });
    }
    
    console.log(`🔍 Checking unlocked episodes for UID: ${uid}`);
    
    const { adminDb } = await import('@/lib/firebase/admin');
    
    if (!adminDb) {
      // Fallback to client SDK
      const { doc, getDoc } = await import('firebase/firestore');
      const { serverDb } = await import('@/lib/firebase/server-config');
      
      if (!serverDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }
      
      const customerDoc = await getDoc(doc(serverDb, 'customers', uid));
      
      if (!customerDoc.exists()) {
        return NextResponse.json({ 
          error: 'Customer not found',
          uid 
        }, { status: 404 });
      }
      
      const data = customerDoc.data();
      
      return NextResponse.json({
        uid,
        email: data.email,
        credits: data.credits,
        unlockedEpisodes: data.unlockedEpisodes || [],
        unlockedCount: (data.unlockedEpisodes || []).length,
        episodeDetails: (data.unlockedEpisodes || []).map((ep: any) => ({
          seriesId: ep.seriesId,
          episodeNumber: ep.episodeNumber,
          unlockedAt: ep.unlockedAt
        }))
      });
    }
    
    // Use Admin SDK
    const customerDoc = await adminDb.collection('customers').doc(uid).get();
    
    if (!customerDoc.exists) {
      return NextResponse.json({ 
        error: 'Customer not found',
        uid 
      }, { status: 404 });
    }
    
    const data = customerDoc.data();
    
    return NextResponse.json({
      uid,
      email: data.email,
      credits: data.credits,
      unlockedEpisodes: data.unlockedEpisodes || [],
      unlockedCount: (data.unlockedEpisodes || []).length,
      episodeDetails: (data.unlockedEpisodes || []).map((ep: any) => ({
        seriesId: ep.seriesId,
        episodeNumber: ep.episodeNumber,
        unlockedAt: ep.unlockedAt
      }))
    });
    
  } catch (error: any) {
    console.error('Check unlocked error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}