import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function isCustomerAuthenticated(request: NextRequest): boolean {
  try {
    // Check for customer token in Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch (error) {
    return false;
  }
}

export function redirectToLogin(request: NextRequest): NextResponse {
  const url = new URL('/login', request.url);
  url.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}