import { NextRequest, NextResponse } from 'next/server';
import { createEpisode, getSeriesEpisodes } from '@/lib/firebase/series-service';
import type { Episode } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seriesId = searchParams.get('seriesId');
    
    if (!seriesId) {
      return NextResponse.json(
        { success: false, error: 'Series ID is required' },
        { status: 400 }
      );
    }

    const episodes = await getSeriesEpisodes(seriesId);
    return NextResponse.json({ success: true, episodes });
  } catch (error: any) {
    console.error('Error fetching episodes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch episodes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.seriesId || !data.title || !data.episodeNumber) {
      return NextResponse.json(
        { success: false, error: 'Series ID, title, and episode number are required' },
        { status: 400 }
      );
    }

    const episodeData: Omit<Episode, 'id'> = {
      seriesId: data.seriesId,
      title: data.title,
      description: data.description || '',
      episodeNumber: data.episodeNumber,
      duration: data.duration || 0,
      videoUrl: data.videoUrl || '',
      audioUrl: data.audioUrl || '',
      thumbnailUrl: data.thumbnailUrl || '/default-thumbnail.jpg',
      credits: data.credits || 1,
      releaseDate: data.releaseDate || new Date().toISOString(),
      views: 0,
      status: 'published'
    };

    const newEpisode = await createEpisode(episodeData);
    
    if (newEpisode) {
      return NextResponse.json({ success: true, episode: newEpisode });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to create episode' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error creating episode:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}