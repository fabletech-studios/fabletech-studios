import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Since Firebase Admin SDK isn't configured, we'll use a workaround
// This endpoint will mark the currently logged-in user as admin in Firestore

export async function POST(request: NextRequest) {
  try {
    // Get the session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Not logged in' },
        { status: 401 }
      );
    }

    // Parse the session to get user info
    const sessionData = JSON.parse(sessionCookie.value);
    const userEmail = sessionData.email;
    const userId = sessionData.uid;

    if (!userEmail || !userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    // For now, we'll just return success and handle admin checks differently
    // Since we can't set Firebase custom claims without Admin SDK,
    // we'll rely on email-based checks in the code
    
    const adminEmails = [
      'admin@fabletech.studio',
      'bmwhelp.ga@gmail.com',
      'omvec.performance@gmail.com'
    ];

    const isAdmin = adminEmails.includes(userEmail.toLowerCase());

    if (isAdmin) {
      return NextResponse.json({
        success: true,
        message: `${userEmail} is recognized as admin`,
        isAdmin: true,
        note: 'Admin access granted based on email whitelist'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'This email is not in the admin whitelist',
      email: userEmail
    });

  } catch (error: any) {
    console.error('Error checking admin status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check admin status' },
      { status: 500 }
    );
  }
}