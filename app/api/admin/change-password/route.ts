import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hash, compare } from 'bcryptjs';
import { strictRateLimit } from '@/lib/middleware/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Apply strict rate limiting for password changes
    const rateLimitResult = await strictRateLimit(request);
    if (rateLimitResult.rateLimited === false) {
      // Rate limit check passed
    } else {
      return rateLimitResult; // Return rate limit error response
    }

    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    // Validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Verify current password
    const currentAdminPassword = process.env.ADMIN_PASSWORD;
    if (!currentAdminPassword) {
      console.error('[SECURITY] ADMIN_PASSWORD environment variable not set');
      console.log('[INFO] For initial setup, set ADMIN_PASSWORD environment variable to your desired password');
      console.log('[INFO] After first password change, update it with the generated hash');
      
      // For initial setup, allow setting password without verification if no password is set
      if (currentPassword === 'SET_INITIAL_PASSWORD') {
        // Generate hash for the new password
        const hashedPassword = await hash(newPassword, 12);
        
        console.log(`[INITIAL SETUP] Admin password hash generated for ${session.user?.email}`);
        console.log(`[ACTION REQUIRED] Set ADMIN_PASSWORD environment variable to:`);
        console.log(hashedPassword);
        
        return NextResponse.json({
          success: true,
          message: 'Initial password set. Update ADMIN_PASSWORD environment variable with the provided hash.',
          hashedPassword: hashedPassword,
          instructions: [
            '1. Copy the hashed password above',
            '2. Go to Vercel Dashboard > Settings > Environment Variables',
            '3. Add ADMIN_PASSWORD with the hash value',
            '4. Redeploy for changes to take effect',
            '5. You can then login with your new password'
          ]
        });
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Server configuration error - ADMIN_PASSWORD not set',
          hint: 'For initial setup, use "SET_INITIAL_PASSWORD" as current password' 
        },
        { status: 500 }
      );
    }

    // For initial setup, allow plain text comparison
    // In production, this should always use hashed passwords
    let isValidPassword = false;
    if (currentAdminPassword.startsWith('$2')) {
      // Hashed password
      isValidPassword = await compare(currentPassword, currentAdminPassword);
    } else {
      // Plain text (only for initial setup)
      isValidPassword = currentPassword === currentAdminPassword;
      console.warn('[SECURITY] Admin password is not hashed. Please update after first login.');
    }

    if (!isValidPassword) {
      console.warn(`[SECURITY] Failed admin password change attempt by ${session.user?.email}`);
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 12);

    // Log the password change
    console.log(`[ADMIN PASSWORD CHANGE] User: ${session.user?.email} | Time: ${new Date().toISOString()}`);
    console.log(`[ACTION REQUIRED] Update ADMIN_PASSWORD environment variable to:`);
    console.log(hashedPassword);

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully. Update ADMIN_PASSWORD environment variable with the provided hash.',
      hashedPassword: hashedPassword,
      instructions: [
        '1. Copy the hashed password above',
        '2. Go to Vercel Dashboard > Settings > Environment Variables',
        '3. Update ADMIN_PASSWORD with the new hash',
        '4. Redeploy for changes to take effect'
      ]
    });

  } catch (error: any) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}