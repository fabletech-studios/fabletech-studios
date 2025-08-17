import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const useAdminDb = !!adminDb;
    
    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('contestId');
    const status = searchParams.get('status');
    
    if (!contestId) {
      return NextResponse.json(
        { success: false, error: 'contestId is required' },
        { status: 400 }
      );
    }
    
    let submissions: any[] = [];
    
    if (useAdminDb) {
      // Use Admin SDK
      let q = adminDb.collection('submissions')
        .where('contestId', '==', contestId);
      
      // Add status filter if provided
      if (status === 'approved') {
        q = q.where('isApproved', '==', true);
      }
      
      const snapshot = await q.get();
      
      submissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } else {
      // Fallback to client SDK
      const constraints = [where('contestId', '==', contestId)];
      
      if (status === 'approved') {
        constraints.push(where('isApproved', '==', true));
      }
      
      const q = query(collection(db, 'submissions'), ...constraints);
      const snapshot = await getDocs(q);
      
      submissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
    
    // Sort by total votes descending
    submissions.sort((a: any, b: any) => {
      const aTotal = a.votes?.total || 0;
      const bTotal = b.votes?.total || 0;
      return bTotal - aTotal;
    });
    
    return NextResponse.json({
      success: true,
      submissions
    });
    
  } catch (error: any) {
    console.error('Error loading submissions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load submissions' },
      { status: 500 }
    );
  }
}