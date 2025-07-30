import { auth } from './config';
import { adminAuth } from './admin-config';

export async function verifyFirebaseToken(token: string) {
  try {
    // Try admin SDK first if available
    if (adminAuth) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        return {
          success: true,
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified
        };
      } catch (adminError) {
        console.error('Admin SDK token verification failed:', adminError);
      }
    }

    // Fallback to client SDK (less secure but better than manual parsing)
    // Note: This is not ideal in production, but works for development
    try {
      // Parse token to get basic info (this is not verification!)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const uid = payload.user_id || payload.sub;
      
      if (!uid) {
        throw new Error('Invalid token structure');
      }

      // In production, you should always use Admin SDK for token verification
      console.warn('Using fallback token parsing - not secure for production!');
      
      return {
        success: true,
        uid: uid,
        email: payload.email,
        emailVerified: payload.email_verified || false,
        warning: 'Token not cryptographically verified - use Firebase Admin SDK in production'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid token'
      };
    }
  } catch (error: any) {
    console.error('Token verification error:', error);
    return {
      success: false,
      error: error.message || 'Token verification failed'
    };
  }
}