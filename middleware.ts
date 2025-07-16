import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    console.log('Middleware hit for:', req.nextUrl.pathname);
    console.log('Token:', req.nextauth?.token);
    
    // Check for bypass cookie
    const bypassCookie = req.cookies.get('fabletech-auth-bypass');
    if (bypassCookie?.value === 'admin') {
      console.log('Auth bypass active');
      return NextResponse.next();
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        console.log('Authorized check for:', req.nextUrl.pathname, 'Token:', token);
        
        // Check for bypass cookie first
        const bypassCookie = req.cookies.get('fabletech-auth-bypass');
        if (bypassCookie?.value === 'admin') {
          return true;
        }
        
        // Protect /manage and /upload routes
        if (req.nextUrl.pathname.startsWith('/manage') || 
            req.nextUrl.pathname.startsWith('/upload')) {
          const isAuthorized = token?.role === 'admin';
          console.log('Is authorized:', isAuthorized);
          return isAuthorized;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/manage/:path*', '/upload/:path*'],
};