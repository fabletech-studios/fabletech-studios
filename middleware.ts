import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Log the request for debugging
  if (request.url.includes('/api/content/')) {
    console.log(`[Middleware] Request to: ${request.url}, Method: ${request.method}`);
  }
  
  // Skip ALL checks for content/episode endpoints
  if (request.url.includes('/api/content/') || request.url.includes('/episode')) {
    console.log(`[Middleware] Skipping all checks for content endpoint: ${request.url}`);
    return NextResponse.next();
  }
  
  // Skip size check for upload endpoints
  const isUploadEndpoint = request.url.includes('/api/upload/') || 
                          request.url.includes('/api/storage/');
  
  // Handle large file uploads
  if ((request.method === 'POST' || request.method === 'PUT') && !isUploadEndpoint) {
    const contentLength = request.headers.get('content-length');
    
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      
      // Log large requests
      if (sizeInMB > 10) {
        console.log(`Large request detected: ${sizeInMB.toFixed(2)}MB to ${request.url}`);
      }
      
      // Vercel has different limits based on plan:
      // - Hobby: 4.5MB
      // - Pro: 50MB
      // - Enterprise: 100MB+
      // Since you're on Pro, using 50MB limit
      const vercelLimit = 50; // Pro plan limit
      
      // Check if it exceeds Vercel's limit
      if (sizeInMB > vercelLimit) {
        console.error(`Request too large: ${sizeInMB.toFixed(2)}MB (limit: ${vercelLimit}MB) to ${request.url}`);
        
        // Set proper headers for CORS
        const response = NextResponse.json(
          { 
            success: false, 
            error: 'Request entity too large',
            details: `File size ${sizeInMB.toFixed(2)}MB exceeds maximum allowed size of ${vercelLimit}MB`,
            suggestion: 'Please upload smaller files or consider using direct Firebase Storage uploads',
            requestSize: sizeInMB,
            limit: vercelLimit
          },
          { status: 413 }
        );
        
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Content-Type', 'application/json');
        
        return response;
      }
    }
  }
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    // Get allowed origins from environment or use defaults
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'https://fabletech-studios.vercel.app',
      process.env.NEXT_PUBLIC_APP_URL
    ].filter(Boolean);
    
    const origin = request.headers.get('origin');
    const isAllowedOrigin = origin && allowedOrigins.includes(origin);
    
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'null',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'true'
      }
    });
  }
  
  return NextResponse.next();
}

export const config = {
  // Temporarily disable middleware for all API routes to fix 413 error
  matcher: [
    // Only run middleware on non-API routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};