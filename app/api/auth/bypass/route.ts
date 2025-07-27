import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.redirect(new URL('/manage', process.env.NEXT_PUBLIC_APP_URL));
  
  // Set a temporary auth cookie
  response.cookies.set('fabletech-auth-bypass', 'admin', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600, // 1 hour
    path: '/',
  });
  
  return response;
}