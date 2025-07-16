import { NextRequest, NextResponse } from 'next/server';
import { signInCustomerHybrid } from '@/lib/hybrid-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing email or password' },
        { status: 400 }
      );
    }

    const result = await signInCustomerHybrid(email, password);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        customer: result.customer,
        token: result.token
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Hybrid login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}