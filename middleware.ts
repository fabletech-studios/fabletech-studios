import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Middleware processing
    
    const response = NextResponse.next();
    
    // Add no-cache headers for media files to prevent stale content
    if (req.nextUrl.pathname.startsWith('/uploads/') || 
        req.nextUrl.pathname.match(/\.(mp4|webm|mp3|m4a|wav|ogg|jpg|jpeg|png|gif)$/i)) {
      
      // Set cache control headers to prevent caching
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('Surrogate-Control', 'no-store');
    }
    
    // Check for bypass cookie
    const bypassCookie = req.cookies.get('fabletech-auth-bypass');
    if (bypassCookie?.value === 'admin') {
      // Auth bypass active
      return response;
    }
    
    return response;
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Checking authorization
        
        // Check for bypass cookie first
        const bypassCookie = req.cookies.get('fabletech-auth-bypass');
        if (bypassCookie?.value === 'admin') {
          return true;
        }
        
        // Protect /manage and /upload routes
        if (req.nextUrl.pathname.startsWith('/manage') || 
            req.nextUrl.pathname.startsWith('/upload')) {
          const isAuthorized = token?.role === 'admin';
          // Authorization check complete
          return isAuthorized;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/manage/:path*', '/upload/:path*', '/uploads/:path*'],
};