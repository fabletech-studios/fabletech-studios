import { NextRequest, NextResponse } from 'next/server';
import { createCustomerHybrid } from '@/lib/hybrid-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await createCustomerHybrid(email, password, name);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        customer: result.customer,
        token: result.token
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Hybrid signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}