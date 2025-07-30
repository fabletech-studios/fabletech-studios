import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip size check for Firebase Storage upload endpoints
  const isFirebaseUpload = request.url.includes('/api/upload/firebase') || 
                          request.url.includes('/api/storage/');
  
  // Handle large file uploads
  if ((request.method === 'POST' || request.method === 'PUT') && !isFirebaseUpload) {
    const contentLength = request.headers.get('content-length');
    
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      
      // Log large requests
      if (sizeInMB > 10) {
        console.log(`Large request detected: ${sizeInMB.toFixed(2)}MB to ${request.url}`);
      }
      
      // Vercel has different limits based on plan:
      // - Hobby: 4.5MB
      // - Pro: 50MB (using 45MB to be safe)
      // - Enterprise: 100MB+
      // Check VERCEL_PLAN env var or default to Pro limits
      const isHobby = process.env.VERCEL_PLAN === 'hobby';
      const vercelLimit = isHobby ? 4.5 : 45; // Adjust based on your plan
      
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
  matcher: '/api/:path*',
};