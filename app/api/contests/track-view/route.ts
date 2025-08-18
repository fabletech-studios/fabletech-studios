import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyId } = body;
    
    if (!storyId) {
      return NextResponse.json(
        { success: false, error: 'Story ID is required' },
        { status: 400 }
      );
    }
    
    // Get client IP for basic duplicate prevention
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Create a view record to prevent duplicate views from same session
    const viewId = `${storyId}_${ip}_${new Date().toISOString().split('T')[0]}`; // One view per IP per day
    
    // Check if this view already exists
    const viewDoc = await adminDb.collection('storyViews').doc(viewId).get();
    
    if (!viewDoc.exists) {
      // Record the new view
      await adminDb.collection('storyViews').doc(viewId).set({
        storyId,
        ip,
        viewedAt: FieldValue.serverTimestamp()
      });
      
      // Increment the view counter on the story
      await adminDb.collection('submissions').doc(storyId).update({
        views: FieldValue.increment(1)
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'View tracked'
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        message: 'View already tracked for this session'
      });
    }
    
  } catch (error: any) {
    console.error('Error tracking view:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to track view' },
      { status: 500 }
    );
  }
}