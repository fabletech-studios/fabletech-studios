import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }
  
  // Validate that it's a Firebase Storage URL
  if (!url.startsWith('https://storage.googleapis.com/')) {
    return new NextResponse('Invalid URL', { status: 400 });
  }
  
  try {
    // Fetch the image from Firebase Storage
    const response = await fetch(url);
    
    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: response.status });
    }
    
    // Get the content type
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Return the image with proper headers
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return new NextResponse('Failed to proxy image', { status: 500 });
  }
}