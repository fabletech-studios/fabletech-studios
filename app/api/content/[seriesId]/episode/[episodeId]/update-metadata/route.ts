import { NextRequest, NextResponse } from 'next/server';
import { updateEpisodeFirebase } from '@/lib/firebase/content-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { seriesId: string; episodeId: string } }
) {
  try {
    const { seriesId, episodeId } = params;
    const data = await request.json();
    
    console.log('Updating episode metadata:', { seriesId, episodeId, data });
    
    // Use updateEpisodeFirebase which has the Italian language logic
    const updateSuccess = await updateEpisodeFirebase(seriesId, episodeId, data);
    
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