import { NextRequest, NextResponse } from 'next/server';
import { getSeriesFirebase } from '@/lib/firebase/content-service';
import { convertSeriesMediaPaths } from '@/lib/media-utils';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ seriesId: string }> }
) {
  try {
    const { seriesId } = await context.params;
    const series = await getSeriesFirebase(seriesId);
    
    if (!series) {
      return NextResponse.json(
        { success: false, error: 'Series not found' },
        { status: 404 }
      );
    }
    
    // Convert media paths
    const convertedSeries = convertSeriesMediaPaths(series);
    
    return NextResponse.json({
      success: true,
      series: convertedSeries
    });
  } catch (error) {
    console.error('Error fetching series:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch series' },
      { status: 500 }
    );
  }
}