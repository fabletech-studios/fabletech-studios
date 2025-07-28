import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const slug = params.slug.join('/');
  
  return NextResponse.json({
    error: 'Route not found',
    requestedPath: `/api/series/${slug}`,
    availableRoutes: [
      '/api/series/banner',
      '/api/series/create',
      '/api/series/test'
    ],
    suggestion: 'Check if the route file exists and exports the correct methods'
  }, { status: 404 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const slug = params.slug.join('/');
  
  return NextResponse.json({
    error: 'Route not found',
    requestedPath: `/api/series/${slug}`,
    method: 'POST',
    availableRoutes: [
      '/api/series/banner (POST)',
      '/api/series/create (POST)',
      '/api/series/test (POST)'
    ],
    suggestion: 'The route might exist but not export a POST method'
  }, { status: 404 });
}