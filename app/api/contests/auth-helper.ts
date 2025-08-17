import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function getAuthenticatedUserEmail(request: NextRequest): Promise<string | null> {
  // Try to get Firebase auth token from Authorization header first
  const authHeader = request.headers.get('authorization');
  let userEmail: string | null = null;
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      userEmail = decodedToken.email || null;
    } catch (error) {
      // Token verification failed, try cookie auth
    }
  }
  
  // If no email from token, try to get from Firebase session cookie
  if (!userEmail) {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('__session');
    
    if (sessionCookie) {
      try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie.value, true);
        userEmail = decodedClaims.email || null;
      } catch (error) {
        // Session cookie verification failed
      }
    }
  }
  
  return userEmail;
}