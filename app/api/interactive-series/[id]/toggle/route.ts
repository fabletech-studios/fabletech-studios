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

// POST - Toggle active status
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

    const body = await request.json();
    const { id } = params;

    await adminDb
      .collection('interactiveSeries')
      .doc(id)
      .update({
        isActive: body.isActive,
        updatedAt: new Date()
      });

    return NextResponse.json({
      success: true,
      message: `Series ${body.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error: any) {
    console.error('Error toggling series status:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}