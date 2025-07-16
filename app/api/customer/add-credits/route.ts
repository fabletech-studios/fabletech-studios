import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getCustomerById, updateCustomerCredits } from '@/lib/customer-auth-server';

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
    const decoded = verifyToken(token);

    if (!decoded || decoded.type !== 'customer') {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { credits } = await request.json();

    if (!credits || credits <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid credit amount' },
        { status: 400 }
      );
    }

    // Get current customer data
    const customer = await getCustomerById(decoded.id);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Add credits
    const newCredits = customer.credits + credits;
    await updateCustomerCredits(decoded.id, newCredits);

    return NextResponse.json({
      success: true,
      newBalance: newCredits,
      creditsAdded: credits
    });

  } catch (error: any) {
    console.error('Add credits error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}