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

// PUT - Update interactive series
export async function PUT(
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

    const body = await request.json();
    const { id } = params;

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
      .collection('interactiveSeries')
      .doc(id)
      .update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Interactive series updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating interactive series:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete interactive series
export async function DELETE(
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

    const { id } = params;

    // Delete all episodes for this series first
    const episodesSnapshot = await adminDb
      .collection('interactiveEpisodes')
      .where('seriesId', '==', id)
      .get();

    const batch = adminDb.batch();
    
    episodesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the series itself
    batch.delete(adminDb.collection('interactiveSeries').doc(id));

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: 'Interactive series deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting interactive series:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}