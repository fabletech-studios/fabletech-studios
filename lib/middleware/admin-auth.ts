import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { headers } from 'next/headers';

export async function requireAdminAuth(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No session' },
        { status: 401 }
      );
    }
    
    // Check if user has admin role
    if ((session.user as any).role !== 'admin') {
      // Log unauthorized access attempt
      const headersList = headers();
      const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
      const userAgent = headersList.get('user-agent') || 'unknown';
      
      console.warn(`[SECURITY] Unauthorized admin access attempt:
        User: ${session.user?.email}
        IP: ${ip}
        Time: ${new Date().toISOString()}
        Path: ${request.url}
        User-Agent: ${userAgent.substring(0, 100)}`);
      
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient privileges' },
        { status: 403 }
      );
    }
    
    // Log successful admin access
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    
    console.log(`[ADMIN API ACCESS] User: ${session.user?.email} | IP: ${ip} | Path: ${request.url} | Time: ${new Date().toISOString()}`);
    
    // Return session for use in route handler
    return { session, authenticated: true };
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication error' },
      { status: 500 }
    );
  }
}