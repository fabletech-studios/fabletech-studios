import { NextRequest } from 'next/server';
import { extractUidFromToken } from '@/lib/utils/token-utils';

// Admin email whitelist
export const ADMIN_EMAILS = [
  'admin@fabletech.studio',
  'bmwhelp.ga@gmail.com',
  'support@fabletech.studio'
];

export interface AdminAuthResult {
  isAdmin: boolean;
  uid?: string;
  email?: string;
  error?: string;
}

/**
 * Check if the request is from an admin user
 * @param request NextRequest object
 * @returns AdminAuthResult with authentication status
 */
export async function checkAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
  try {
    // Check for authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isAdmin: false, error: 'No authorization header' };
    }

    const token = authHeader.substring(7);
    
    // Extract UID and email from token
    let uid: string;
    let email: string | undefined;
    
    try {
      const extracted = extractUidFromToken(token);
      uid = extracted.uid;
      email = extracted.userInfo?.email;
    } catch (error: any) {
      console.error('[Admin Auth] Token extraction failed:', error.message);
      return { isAdmin: false, error: 'Invalid token' };
    }

    // Check if email is in admin list
    const isAdmin = email && ADMIN_EMAILS.includes(email.toLowerCase());
    
    if (!isAdmin) {
      console.log('[Admin Auth] Not admin:', { uid, email });
      return { isAdmin: false, uid, email, error: 'Not an admin' };
    }

    console.log('[Admin Auth] Admin verified:', { uid, email });
    return { isAdmin: true, uid, email };
  } catch (error) {
    console.error('[Admin Auth] Error:', error);
    return { isAdmin: false, error: 'Authentication check failed' };
  }
}

/**
 * Check if an email is an admin email
 * @param email Email to check
 * @returns true if admin email
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}