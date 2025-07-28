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
      
      // Vercel has a 4.5MB limit for Hobby plan, 50MB for Pro
      const vercelLimit = 50; // Adjust based on your plan
      
      // Check if it exceeds Vercel's limit
      if (sizeInMB > vercelLimit) {
        console.error(`Request too large: ${sizeInMB.toFixed(2)}MB (limit: ${vercelLimit}MB)`);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Request entity too large',
            details: `File size ${sizeInMB.toFixed(2)}MB exceeds maximum allowed size of ${vercelLimit}MB`,
            suggestion: 'Please upload smaller files or consider using direct Firebase Storage uploads'
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