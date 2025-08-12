import { NextRequest, NextResponse } from 'next/server';
import { trackEpisodePlay, trackPlaybackProgress } from '@/lib/analytics/analytics-service';

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      seriesId, 
      episodeId, 
      episodeNumber,
      seriesTitle,
      episodeTitle,
      currentTime,
      duration
    } = await request.json();
    
    // Track the play event
    if (userId && seriesId && episodeId) {
      await trackEpisodePlay(
        userId,
        seriesId,
        episodeId,
        episodeNumber || 0,
        seriesTitle || 'Unknown Series',
        episodeTitle || 'Unknown Episode'
      );
      
      // Track progress if provided
      if (currentTime !== undefined && duration) {
        await trackPlaybackProgress(userId, episodeId, currentTime, duration);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ success: false });
  }
}