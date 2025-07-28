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
    // Support range requests for video/audio streaming
    const range = request.headers.get('range');
    
    const headers: HeadersInit = {};
    if (range) {
      headers['Range'] = range;
    }
    
    // Fetch the media from Firebase Storage
    const response = await fetch(url, { headers });
    
    if (!response.ok && response.status !== 206) {
      return new NextResponse('Failed to fetch media', { status: response.status });
    }
    
    // Get response headers
    const contentType = response.headers.get('content-type') || 'video/mp4';
    const contentLength = response.headers.get('content-length');
    const contentRange = response.headers.get('content-range');
    const acceptRanges = response.headers.get('accept-ranges');
    
    // Build response headers
    const responseHeaders: HeadersInit = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
      'Accept-Ranges': acceptRanges || 'bytes',
    };
    
    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }
    
    if (contentRange) {
      responseHeaders['Content-Range'] = contentRange;
    }
    
    // Return the media stream
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Media proxy error:', error);
    return new NextResponse('Failed to proxy media', { status: 500 });
  }
}