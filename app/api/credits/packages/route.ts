import { NextResponse } from 'next/server';
import { CREDIT_PACKAGES } from '@/lib/stripe';

export async function GET() {
  try {
    // Log the packages being returned
    console.log('[Credit Packages API] Returning packages:', CREDIT_PACKAGES.map(p => ({
      id: p.id,
      credits: p.credits,
      price: p.priceDisplay
    })));
    
    return NextResponse.json({
      success: true,
      packages: CREDIT_PACKAGES,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching credit packages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch credit packages' },
      { status: 500 }
    );
  }
}