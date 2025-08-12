import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Import Firebase Admin for server-side operations
async function getAdminDb() {
  try {
    const { getAdminDb } = await import('@/lib/firebase/admin');
    return await getAdminDb();
  } catch (error) {
    console.error('Failed to get admin DB:', error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { seriesId: string; episodeId: string } }
) {
  try {
    const { seriesId, episodeId } = params;
    const updates = await request.json();
    
    console.log('Direct update - Series:', seriesId);
    console.log('Direct update - Episode:', episodeId);
    console.log('Direct update - Data:', updates);
    
    // Use admin DB for server-side operations
    const adminDb = await getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database not initialized' 
      }, { status: 500 });
    }
    
    // Get the series document
    const seriesRef = adminDb.collection('series').doc(seriesId);
    const seriesDoc = await seriesRef.get();
    
    if (!seriesDoc.exists) {
      return NextResponse.json({ 
        success: false, 
        error: 'Series not found' 
      }, { status: 404 });
    }
    
    const seriesData = seriesDoc.data();
    const episodes = seriesData?.episodes || [];
    
    // Find and update the episode
    const updatedEpisodes = episodes.map((ep: any) => {
      if (ep.episodeId === episodeId) {
        return { ...ep, ...updates };
      }
      return ep;
    });
    
    // Update the series document using admin SDK
    await seriesRef.update({
      episodes: updatedEpisodes,
      updatedAt: new Date()
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Episode updated successfully'
    });
    
  } catch (error: any) {
    console.error('Direct update error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to update episode',
      details: error.toString()
    }, { status: 500 });
  }
}