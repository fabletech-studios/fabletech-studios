import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Admin SDK not initialized' },
        { status: 500 }
      );
    }
    
    // Get all contests using Admin SDK
    const snapshot = await adminDb.collection('contests')
      .orderBy('createdAt', 'desc')
      .get();
    
    const contests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({
      success: true,
      contests
    });
    
  } catch (error: any) {
    console.error('Error loading contests:', error);
    
    // If createdAt field doesn't exist, try without ordering
    if (error.code === 9) {
      try {
        const snapshot = await adminDb.collection('contests').get();
        const contests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        return NextResponse.json({
          success: true,
          contests
        });
      } catch (fallbackError: any) {
        return NextResponse.json(
          { success: false, error: fallbackError.message },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load contests' },
      { status: 500 }
    );
  }
}