import { NextRequest, NextResponse } from 'next/server';

async function getAdminAuth() {
  try {
    const { adminAuth } = await import('@/lib/firebase/admin');
    return adminAuth;
  } catch (error) {
    console.error('Failed to get admin auth:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { secretKey } = await request.json();
    
    // Simple security check
    if (secretKey !== 'set-admin-2025-fabletech') {
      return NextResponse.json(
        { success: false, error: 'Invalid secret key' },
        { status: 403 }
      );
    }
    
    const adminAuth = await getAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { success: false, error: 'Admin auth not initialized' },
        { status: 500 }
      );
    }
    
    // List first 10 users
    const listUsersResult = await adminAuth.listUsers(10);
    
    const users = listUsersResult.users.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      customClaims: user.customClaims,
      createdAt: user.metadata.creationTime,
      lastSignIn: user.metadata.lastSignInTime
    }));
    
    return NextResponse.json({
      success: true,
      users: users,
      totalUsers: users.length
    });
    
  } catch (error: any) {
    console.error('Error listing users:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list users' },
      { status: 500 }
    );
  }
}