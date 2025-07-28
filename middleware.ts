import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle large file uploads
  if (request.method === 'POST' || request.method === 'PUT') {
    const contentLength = request.headers.get('content-length');
    
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      
      // Log large requests
      if (sizeInMB > 10) {
        console.log(`Large request detected: ${sizeInMB.toFixed(2)}MB to ${request.url}`);
      }
      
      // Check if it exceeds our limit (500MB)
      if (sizeInMB > 500) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Request entity too large',
            details: `File size ${sizeInMB.toFixed(2)}MB exceeds maximum allowed size of 500MB`
          },
          { status: 413 }
        );
      }
    }
  }
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      }
    });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};