import { NextRequest, NextResponse } from 'next/server';
import { InteractiveSeries } from '@/types/interactive';

// Dynamic import to avoid initialization issues
async function getAdminDb() {
  try {
    const { getAdminDb } = await import('@/lib/firebase/admin');
    return await getAdminDb();
  } catch (error) {
    console.error('Failed to import admin services:', error);
    return null;
  }
}

// GET - Fetch all interactive series
export async function GET(request: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const snapshot = await adminDb
      .collection('interactiveSeries')
      .orderBy('createdAt', 'desc')
      .get();

    const series: InteractiveSeries[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      series.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        publishedAt: data.publishedAt?.toDate(),
      } as InteractiveSeries);
    });

    return NextResponse.json({
      success: true,
      series
    });
  } catch (error: any) {
    console.error('Error fetching interactive series:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new interactive series
export async function POST(request: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.author) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const seriesData = {
      title: body.title,
      description: body.description,
      author: body.author,
      narrator: body.narrator || '',
      tags: body.tags || [],
      thumbnailUrl: body.thumbnailUrl || '',
      coverImageUrl: body.coverImageUrl || '',
      totalEpisodes: 0,
      isActive: false,
      isPremium: body.isPremium || false,
      creditCost: body.creditCost || 1,
      stats: {
        totalPlays: 0,
        uniquePlayers: 0,
        averageCompletion: 0,
        totalPaths: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await adminDb.collection('interactiveSeries').add(seriesData);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'Interactive series created successfully'
    });
  } catch (error: any) {
    console.error('Error creating interactive series:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}