import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Deployment test endpoint working',
    timestamp: new Date().toISOString(),
    routes: {
      '/api/series/banner': 'Should handle series banner uploads',
      '/api/banner/upload': 'Should handle homepage banner uploads',
      '/api/content/[seriesId]/episode/[episodeId]/update': 'Should handle episode updates'
    }
  });
}