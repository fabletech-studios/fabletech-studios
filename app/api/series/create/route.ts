import { NextRequest, NextResponse } from 'next/server';
import { createSeriesFirebase } from '@/lib/firebase/content-service';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { title, description, author, genre } = data;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const seriesData = {
      title,
      description,
      episodes: []
    };

    const seriesId = await createSeriesFirebase(seriesData);

    if (!seriesId) {
      return NextResponse.json(
        { success: false, error: 'Failed to create series in Firebase' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      seriesId,
      series: {
        id: seriesId,
        ...seriesData,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error creating series:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create series' },
      { status: 500 }
    );
  }
}