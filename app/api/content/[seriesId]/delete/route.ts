import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/firebase/server-config';
import { doc, deleteDoc } from 'firebase/firestore';
import { requireAdminAuth } from '@/lib/middleware/admin-auth';
import { strictRateLimit } from '@/lib/middleware/rate-limit';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ seriesId: string }> }
) {
  try {
    // Apply strict rate limit for delete operations
    const rateLimitResult = await strictRateLimit(request);
    if (rateLimitResult.rateLimited === false) {
      // Rate limit check passed
    } else {
      return rateLimitResult; // Return rate limit error response
    }

    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (!authResult.authenticated) {
      return authResult; // Return auth error response
    }
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