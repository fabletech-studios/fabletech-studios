import { NextRequest, NextResponse } from 'next/server';
import { getSeriesFirebase, updateSeriesFirebase } from '@/lib/firebase/content-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { seriesId: string; episodeId: string } }
) {
  try {
    const { seriesId, episodeId } = params;
    const data = await request.json();
    
    console.log('Updating episode metadata:', { seriesId, episodeId, data });
    
    // Get the current series
    const series = await getSeriesFirebase(seriesId);
    
    if (!series) {
      return NextResponse.json({ 
        success: false, 
        error: 'Series not found' 
      }, { status: 404 });
    }
    
    // Find and update the episode
    const updatedEpisodes = series.episodes.map(ep => {
      if (ep.episodeId === episodeId) {
        return {
          ...ep,
          ...data,
          episodeId: ep.episodeId // Preserve the ID
        };
      }
      return ep;
    });
    
    // Check if episode was found
    const episodeFound = series.episodes.some(ep => ep.episodeId === episodeId);
    if (!episodeFound) {
      return NextResponse.json({ 
        success: false, 
        error: 'Episode not found' 
      }, { status: 404 });
    }
    
    // Update the series with the modified episodes
    const updateSuccess = await updateSeriesFirebase(seriesId, {
      episodes: updatedEpisodes
    });
    
    if (!updateSuccess) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update episode' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Episode metadata updated successfully'
    });
    
  } catch (error: any) {
    console.error('Update episode metadata error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to update episode metadata' 
    }, { status: 500 });
  }
}