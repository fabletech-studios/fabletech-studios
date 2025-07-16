import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/firebase/server-config';
import { doc, deleteDoc } from 'firebase/firestore';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ seriesId: string }> }
) {
  try {
    const { seriesId } = await context.params;
    
    if (!serverDb) {
      return NextResponse.json(
        { success: false, error: 'Firebase not initialized' },
        { status: 500 }
      );
    }
    
    // Delete series from Firestore
    await deleteDoc(doc(serverDb, 'series', seriesId));
    
    return NextResponse.json({
      success: true,
      message: 'Series deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting series:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete series' },
      { status: 500 }
    );
  }
}