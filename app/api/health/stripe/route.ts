import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET() {
  try {
    // Test Stripe connection by fetching recent charges
    const charges = await stripe.charges.list({ limit: 1 });
    
    return NextResponse.json({
      status: 'healthy',
      connected: true,
      mode: stripe.apiKey?.startsWith('sk_live_') ? 'live' : 'test',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}