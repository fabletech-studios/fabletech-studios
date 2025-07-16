import { NextRequest, NextResponse } from 'next/server';
import { getSeries, updateSeries, deleteSeries } from '@/lib/firebase/series-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { seriesId: string } }
) {
  try {
    const series = await getSeries(params.seriesId);
    
    if (series) {
      return NextResponse.json({ success: true, series });
    } else {
      return NextResponse.json(
        { success: false, error: 'Series not found' },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('Error fetching series:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch series' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { seriesId: string } }
) {
  try {
    const updates = await request.json();
    const success = await updateSeries(params.seriesId, updates);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to update series' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error updating series:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { seriesId: string } }
) {
  try {
    const success = await deleteSeries(params.seriesId);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to delete series' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error deleting series:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}