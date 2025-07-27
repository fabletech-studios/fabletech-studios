import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirebaseCustomer } from '@/lib/firebase/customer-service';

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

    const customer = await getFirebaseCustomer(uid);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const { priceId, packageId, credits, amount } = await request.json();

    // Create a real Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customer.email,
      client_reference_id: uid,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${credits} Credits Package`,
              description: `Add ${credits} credits to your account`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: uid,
        packageId,
        credits: credits.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/handle-success?session_id={CHECKOUT_SESSION_ID}&package=${packageId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits/purchase`,
    });

    // Return the session URL directly since Stripe.js is blocked
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url, // Direct checkout URL
    });
  } catch (error: any) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
