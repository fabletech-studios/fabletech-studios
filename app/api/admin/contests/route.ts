import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mockContests } from './mock';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    
    // For now, allow any authenticated user to view contests
    // You can add stricter admin checks later
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Check if Firebase Admin is properly initialized
    if (!adminDb) {
      console.log('Using mock data - Firebase Admin not configured');
      
      // Filter mock contests by status if provided
      let contests = mockContests;
      if (status && status !== 'all') {
        contests = mockContests.filter(c => c.status === status);
      }
      
      return NextResponse.json({
        success: true,
        contests,
        total: contests.length,
        mock: true // Indicate this is mock data
      });
    }
    
    let query = adminDb.collection('contests');
    
    // Apply status filter if provided and not 'all'
    if (status && status !== 'all') {
      // For draft contests, we need admin access
      if (status === 'draft') {
        // Check if user is admin
        if (!session || !process.env.ADMIN_EMAILS?.includes(session.user?.email || '')) {
          return NextResponse.json({
            success: true,
            contests: [] // Return empty array for non-admins
          });
        }
      }
      query = query.where('status', '==', status) as any;
    } else {
      // Don't show draft contests to non-admins
      if (!session || !process.env.ADMIN_EMAILS?.includes(session.user?.email || '')) {
        query = query.where('status', '!=', 'draft') as any;
      }
    }
    
    const snapshot = await query.get();
    
    const contests = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to ISO strings for JSON serialization
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        dates: data.dates ? {
          announced: data.dates.announced?.toDate?.()?.toISOString(),
          submissionStart: data.dates.submissionStart?.toDate?.()?.toISOString(),
          submissionEnd: data.dates.submissionEnd?.toDate?.()?.toISOString(),
          votingStart: data.dates.votingStart?.toDate?.()?.toISOString(),
          votingEnd: data.dates.votingEnd?.toDate?.()?.toISOString(),
          winnersAnnounced: data.dates.winnersAnnounced?.toDate?.()?.toISOString(),
        } : {}
      };
    });
    
    return NextResponse.json({
      success: true,
      contests,
      total: contests.length
    });
    
  } catch (error: any) {
    console.error('Error fetching contests:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch contests' },
      { status: 500 }
    );
  }
}