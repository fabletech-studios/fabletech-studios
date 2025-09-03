import { NextRequest, NextResponse } from 'next/server';

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

// GET - Fetch episodes for an interactive series
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminDb = await getAdminDb();
    
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const { id: seriesId } = params;

    const snapshot = await adminDb
      .collection('interactiveEpisodes')
      .where('seriesId', '==', seriesId)
      .orderBy('episodeNumber', 'asc')
      .get();

    const episodes: any[] = [];
    snapshot.forEach((doc) => {
      episodes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return NextResponse.json({
      success: true,
      episodes
    });
  } catch (error: any) {
    console.error('Error fetching interactive episodes:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new interactive episode
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminDb = await getAdminDb();
    
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const { id: seriesId } = params;
    const formData = await request.formData();
    const episodeDataString = formData.get('episodeData') as string;
    const episodeData = JSON.parse(episodeDataString);

    // For now, create a simple episode structure
    // Audio upload will be handled later with Firebase Storage
    const newEpisode = {
      seriesId,
      episodeNumber: episodeData.episodeNumber || 1,
      title: episodeData.title,
      description: episodeData.description || '',
      creditCost: episodeData.creditCost || 1,
      forkType: episodeData.forkType || 'episode',
      nodes: episodeData.nodes || [
        {
          id: 'start',
          nodeType: 'start',
          audioUrl: '', // Will be populated when audio upload is implemented
          title: 'Episode Start',
          nextNodeId: 'end'
        },
        {
          id: 'end',
          nodeType: 'end',
          audioUrl: '',
          title: 'Episode End'
        }
      ],
      startNodeId: 'start',
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await adminDb.collection('interactiveEpisodes').add(newEpisode);

    // Update series episode count
    await adminDb.collection('interactiveSeries').doc(seriesId).update({
      totalEpisodes: adminDb.FieldValue.increment(1),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'Interactive episode created successfully'
    });
  } catch (error: any) {
    console.error('Error creating interactive episode:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}