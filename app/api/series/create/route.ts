import { NextRequest, NextResponse } from 'next/server';
import { createSeriesFirebase } from '@/lib/firebase/content-service';
import { requireAdminAuth } from '@/lib/middleware/admin-auth';
import { apiRateLimit } from '@/lib/middleware/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitResult = await apiRateLimit(request);
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