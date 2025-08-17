import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const useAdminDb = !!adminDb;
    
    // Get userId from query params (passed from client that knows the user)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }
    
    let profile: any;
    
    if (useAdminDb) {
      // Use Admin SDK if available
      const profileDoc = await adminDb.collection('authorProfiles').doc(userId).get();
      
      if (profileDoc.exists) {
        profile = {
          id: profileDoc.id,
          ...profileDoc.data()
        };
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
        profile = {
          id: userId,
          ...newProfile
        };
      }
    } else {
      // Fallback to client SDK
      const profileRef = doc(db, 'authorProfiles', userId);
      const profileDoc = await getDoc(profileRef);
      
      if (profileDoc.exists()) {
        profile = {
          id: profileDoc.id,
          ...profileDoc.data()
        };
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
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(profileRef, newProfile);
        profile = {
          id: userId,
          ...newProfile,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      profile
    });
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
    const useAdminDb = !!adminDb;
    const { userId, ...updates } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }
    
    // Update author profile
    if (useAdminDb) {
      await adminDb.collection('authorProfiles').doc(userId).update({
        ...updates,
        updatedAt: new Date()
      });
    } else {
      // Fallback to client SDK
      await updateDoc(doc(db, 'authorProfiles', userId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    }
    
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