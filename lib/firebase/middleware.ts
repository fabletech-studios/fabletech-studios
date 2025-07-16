import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from './admin';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email?: string;
    emailVerified?: boolean;
    customClaims?: any;
  };
}

export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Missing or invalid authorization header' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);
      
      // Verify the token
      const decodedToken = await verifyIdToken(token);
      if (!decodedToken) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }

      // Add user info to request
      (req as AuthenticatedRequest).user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        customClaims: decodedToken
      };

      // Call the handler
      return handler(req as AuthenticatedRequest);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

// Check if user is admin
export async function withAdminAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    // Check for admin claim
    if (!req.user?.customClaims?.admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return handler(req);
  });
}