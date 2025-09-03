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

// DELETE - Delete an episode
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; episodeId: string } }
) {
  try {
    const adminDb = await getAdminDb();
    
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const { id: seriesId, episodeId } = params;

    // Delete the episode
    await adminDb.collection('interactiveEpisodes').doc(episodeId).delete();

    // Update series episode count
    const seriesRef = adminDb.collection('interactiveSeries').doc(seriesId);
    const seriesDoc = await seriesRef.get();
    const currentCount = seriesDoc.data()?.totalEpisodes || 1;
    
    await seriesRef.update({
      totalEpisodes: Math.max(0, currentCount - 1),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Episode deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting episode:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update an episode
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; episodeId: string } }
) {
  try {
    const adminDb = await getAdminDb();
    
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const { episodeId } = params;
    const body = await request.json();

    const updateData = {
      ...body,
      updatedAt: new Date()
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await adminDb
      .collection('interactiveEpisodes')
      .doc(episodeId)
      .update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Episode updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating episode:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}