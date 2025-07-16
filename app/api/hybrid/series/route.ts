import { NextRequest, NextResponse } from 'next/server';
import { getAllSeries, createSeries } from '@/lib/firebase/series-service';
import type { Series } from '@/lib/types';

export async function GET() {
  try {
    const series = await getAllSeries();
    return NextResponse.json({ success: true, series });
  } catch (error: any) {
    console.error('Error fetching series:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch series' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const seriesData: Omit<Series, 'id'> = {
      title: data.title,
      description: data.description,
      genre: data.genre || 'General',
      author: data.author || 'Unknown',
      narrator: data.narrator || 'Unknown',
      coverImage: data.coverImage || '/default-cover.jpg',
      totalEpisodes: 0,
      totalDuration: 0,
      status: 'active',
      tags: data.tags || [],
      rating: 0,
      views: 0,
      publishedDate: new Date().toISOString()
    };

    const newSeries = await createSeries(seriesData);
    
    if (newSeries) {
      return NextResponse.json({ success: true, series: newSeries });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to create series' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error creating series:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}