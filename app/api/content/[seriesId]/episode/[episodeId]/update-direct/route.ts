import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

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
    
    if (!db) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database not initialized' 
      }, { status: 500 });
    }
    
    // Get the series document
    const seriesRef = doc(db, 'series', seriesId);
    const seriesDoc = await getDoc(seriesRef);
    
    if (!seriesDoc.exists()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Series not found' 
      }, { status: 404 });
    }
    
    const seriesData = seriesDoc.data();
    const episodes = seriesData.episodes || [];
    
    // Find and update the episode
    const updatedEpisodes = episodes.map((ep: any) => {
      if (ep.episodeId === episodeId) {
        return { ...ep, ...updates };
      }
      return ep;
    });
    
    // Update the series document
    await updateDoc(seriesRef, {
      episodes: updatedEpisodes,
      updatedAt: serverTimestamp()
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