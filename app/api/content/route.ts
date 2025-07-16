import { NextRequest, NextResponse } from 'next/server';
import { getAllSeriesFirebase } from '@/lib/firebase/content-service';

export async function GET(request: NextRequest) {
  try {
    const series = await getAllSeriesFirebase();
    
    return NextResponse.json({
      success: true,
      series,
      count: series.length
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}