import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { serverDb, serverAuth } from '@/lib/firebase/server-config';
import { doc, updateDoc, addDoc, collection, serverTimestamp, increment } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Get metadata from the session
        const userId = session.metadata?.userId;
        const packageId = session.metadata?.packageId;
        const credits = parseInt(session.metadata?.credits || '0');
        
        if (!userId || !credits) {
          console.error('Missing metadata in checkout session:', session.metadata);
          return NextResponse.json(
            { error: 'Missing required metadata' },
            { status: 400 }
          );
        }

        if (!serverDb) {
          return NextResponse.json(
            { error: 'Database not initialized' },
            { status: 500 }
          );
        }

        // Update user's credit balance
        const userRef = doc(serverDb, 'customers', userId);
        await updateDoc(userRef, {
          credits: increment(credits),
          lastPurchase: serverTimestamp(),
        });

        // Record the purchase
        await addDoc(collection(serverDb, 'purchases'), {
          userId,
          packageId,
          credits,
          amount: session.amount_total, // in cents
          currency: session.currency,
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent,
          status: 'completed',
          createdAt: serverTimestamp(),
          metadata: {
            customerEmail: session.customer_email,
            customerName: session.customer_details?.name,
          },
        });

        // Log activity
        await addDoc(collection(serverDb, 'activities'), {
          userId,
          action: 'credit_purchase',
          details: {
            packageId,
            credits,
            amount: session.amount_total,
          },
          timestamp: serverTimestamp(),
        });

        console.log(`Successfully processed payment for user ${userId}: ${credits} credits`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.error('Payment failed:', paymentIntent.last_payment_error);
        
        // You could record failed payments for analytics
        if (paymentIntent.metadata?.userId) {
          await addDoc(collection(serverDb!, 'failed_payments'), {
            userId: paymentIntent.metadata.userId,
            amount: paymentIntent.amount,
            error: paymentIntent.last_payment_error,
            timestamp: serverTimestamp(),
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Stripe webhooks need raw body, so we need to disable body parsing
// Stripe webhooks need to run in Node.js runtime