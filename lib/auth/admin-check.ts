import { auth } from 'firebase-admin';
import { NextRequest } from 'next/server';

export async function isUserAdmin(request: NextRequest): Promise<boolean> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    
    const token = authHeader.substring(7);
    
    // Verify the token and get claims
    const decodedToken = await auth().verifyIdToken(token);
    
    // Check if user has admin claim
    return decodedToken.admin === true;
    
  } catch (error) {
    console.error('Admin check error:', error);
    return false;
  }
}

export async function getUserEmail(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    const decodedToken = await auth().verifyIdToken(token);
    
    return decodedToken.email || null;
    
  } catch (error) {
    console.error('Get user email error:', error);
    return null;
  }
}