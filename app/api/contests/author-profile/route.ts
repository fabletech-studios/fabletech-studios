import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    if (!adminDb || !adminAuth) {
      return NextResponse.json(
        { success: false, error: 'Admin SDK not initialized' },
        { status: 500 }
      );
    }
    
    // Get user from session cookie
    const cookieStore = cookies();
    const session = cookieStore.get('session');
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Verify session
    const decodedClaims = await adminAuth.verifySessionCookie(session.value, true);
    const userId = decodedClaims.uid;
    
    // Get or create author profile
    const profileDoc = await adminDb.collection('authorProfiles').doc(userId).get();
    
    if (profileDoc.exists) {
      return NextResponse.json({
        success: true,
        profile: {
          id: profileDoc.id,
          ...profileDoc.data()
        }
      });
    } else {
      // Create new profile
      const newProfile = {
        userId,
        penName: '',
        bio: '',
        totalSubmissions: 0,
        contestsWon: 0,
        totalVotesReceived: 0,
        totalEarnings: 0,
        followers: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await adminDb.collection('authorProfiles').doc(userId).set(newProfile);
      
      return NextResponse.json({
        success: true,
        profile: {
          id: userId,
          ...newProfile
        }
      });
    }
  } catch (error: any) {
    console.error('Error with author profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get/create author profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!adminDb || !adminAuth) {
      return NextResponse.json(
        { success: false, error: 'Admin SDK not initialized' },
        { status: 500 }
      );
    }
    
    // Get user from session cookie
    const cookieStore = cookies();
    const session = cookieStore.get('session');
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Verify session
    const decodedClaims = await adminAuth.verifySessionCookie(session.value, true);
    const userId = decodedClaims.uid;
    
    const updates = await request.json();
    
    // Update author profile
    await adminDb.collection('authorProfiles').doc(userId).update({
      ...updates,
      updatedAt: new Date()
    });
    
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating author profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update author profile' },
      { status: 500 }
    );
  }
}