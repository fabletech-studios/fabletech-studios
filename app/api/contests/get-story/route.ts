import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const useAdminDb = !!adminDb;
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('id');
    
    if (!storyId) {
      return NextResponse.json(
        { success: false, error: 'Story ID is required' },
        { status: 400 }
      );
    }
    
    let story: any = null;
    
    if (useAdminDb) {
      // Use Admin SDK
      const storyDoc = await adminDb.collection('submissions').doc(storyId).get();
      
      if (storyDoc.exists) {
        story = {
          id: storyDoc.id,
          ...storyDoc.data()
        };
      }
    } else {
      // Fallback to client SDK
      const storyRef = doc(db, 'submissions', storyId);
      const storyDoc = await getDoc(storyRef);
      
      if (storyDoc.exists()) {
        story = {
          id: storyDoc.id,
          ...storyDoc.data()
        };
      }
    }
    
    // Only return approved stories
    if (!story || !story.isApproved) {
      return NextResponse.json(
        { success: false, error: 'Story not found or not approved' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      story
    });
    
  } catch (error: any) {
    console.error('Error fetching story:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch story' },
      { status: 500 }
    );
  }
}