import { NextResponse } from 'next/server';
import { CREDIT_PACKAGES } from '@/lib/stripe';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      packages: CREDIT_PACKAGES,
    });
  } catch (error) {
    console.error('Error fetching credit packages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch credit packages' },
      { status: 500 }
    );
  }
}