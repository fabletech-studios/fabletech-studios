import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const useAdminDb = !!adminDb;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    let submissions: any[] = [];
    
    if (useAdminDb) {
      // Use Admin SDK
      const submissionsSnapshot = await adminDb.collection('submissions')
        .where('authorId', '==', userId)
        .orderBy('submittedAt', 'desc')
        .get();
      
      // Get contest titles for each submission
      const contestIds = new Set<string>();
      submissionsSnapshot.forEach(doc => {
        contestIds.add(doc.data().contestId);
      });
      
      const contestMap = new Map<string, string>();
      for (const contestId of contestIds) {
        const contestDoc = await adminDb.collection('contests').doc(contestId).get();
        if (contestDoc.exists) {
          contestMap.set(contestId, contestDoc.data()?.title || 'Unknown Contest');
        }
      }
      
      submissions = submissionsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          contestTitle: contestMap.get(data.contestId)
        };
      });
    } else {
      // Fallback to client SDK
      const q = query(
        collection(db, 'submissions'),
        where('authorId', '==', userId),
        orderBy('submittedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      // Get contest titles
      const contestIds = new Set<string>();
      snapshot.forEach(doc => {
        contestIds.add(doc.data().contestId);
      });
      
      const contestMap = new Map<string, string>();
      for (const contestId of contestIds) {
        const contestRef = doc(db, 'contests', contestId);
        const contestDoc = await getDoc(contestRef);
        if (contestDoc.exists()) {
          contestMap.set(contestId, contestDoc.data()?.title || 'Unknown Contest');
        }
      }
      
      submissions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          contestTitle: contestMap.get(data.contestId)
        };
      });
    }
    
    return NextResponse.json({
      success: true,
      submissions
    });
    
  } catch (error: any) {
    console.error('Error fetching author submissions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}