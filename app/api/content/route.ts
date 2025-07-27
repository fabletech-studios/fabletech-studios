import { NextRequest, NextResponse } from 'next/server';
import { getAllSeriesFirebase } from '@/lib/firebase/content-service';
import { convertSeriesMediaPaths } from '@/lib/media-utils';

export async function GET(request: NextRequest) {
  try {
    const series = await getAllSeriesFirebase();
    
    // Convert media paths for all series
    const convertedSeries = series.map(convertSeriesMediaPaths);
    
    return NextResponse.json({
      success: true,
      series: convertedSeries,
      count: convertedSeries.length
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}