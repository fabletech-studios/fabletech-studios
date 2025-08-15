import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let userId: string;
    
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      userId = payload.user_id || payload.sub || payload.uid;
      if (!userId) throw new Error('Invalid token');
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    console.log('[Purchases] Fetching for user:', userId);

    // Use Admin SDK to bypass Firestore rules
    if (!adminDb) {
      console.error('[Purchases] Admin DB not initialized');
      // Fall back to empty array instead of error
      return NextResponse.json({
        success: true,
        purchases: [],
      });
    }

    try {
      // Get transactions without ordering (to avoid index requirement)
      const transactionsRef = adminDb.collection('credit-transactions')
        .where('customerId', '==', userId)
        .limit(100);
      
      const snapshot = await transactionsRef.get();
      
      console.log('[Purchases] Found transactions:', snapshot.size);
      
      const allTransactions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type,
          packageId: data.packageId,
          packageName: data.packageId === 'starter' ? 'Starter Pack' : 
                       data.packageId === 'popular' ? 'Popular Pack' : 
                       data.packageId === 'premium' ? 'Premium Pack' : data.packageId,
          amount: data.amount,
          credits: data.credits,
          status: data.status || 'completed',
          stripeSessionId: data.stripeSessionId,
          createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
        };
      });

      // Filter for purchases and sort client-side
      const purchases = allTransactions
        .filter(transaction => transaction.type === 'purchase')
        .sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 50);

      return NextResponse.json({
        success: true,
        purchases,
      });
    } catch (dbError: any) {
      console.error('[Purchases] Database error:', dbError);
      // Return empty array instead of error for better UX
      return NextResponse.json({
        success: true,
        purchases: [],
      });
    }
  } catch (error: any) {
    console.error('[Purchases] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}