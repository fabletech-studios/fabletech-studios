import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { serverDb } from '@/lib/firebase/server-config';
import { collection, query, where, getDocs } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let uid: string;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      uid = payload.user_id || payload.sub;
      if (!uid) throw new Error('Invalid token');
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { sessionId } = await request.json();

    if (!sessionId || sessionId.startsWith('mock_')) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if session is paid
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, error: 'Session not paid' },
        { status: 400 }
      );
    }

    // Check if this session has already been processed
    let needsProcessing = true;
    if (serverDb) {
      const transactionsQuery = query(
        collection(serverDb, 'credit-transactions'),
        where('stripeSessionId', '==', sessionId)
      );
      const snapshot = await getDocs(transactionsQuery);
      needsProcessing = snapshot.empty;
    }

    // Extract metadata
    const packageId = session.metadata?.packageId || 'unknown';
    const credits = parseInt(session.metadata?.credits || '0');
    const amount = session.amount_total || 0;

    return NextResponse.json({
      success: true,
      needsProcessing,
      sessionId,
      packageId,
      credits,
      amount,
      customerEmail: session.customer_email,
    });
  } catch (error: any) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
