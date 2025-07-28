import { NextRequest, NextResponse } from 'next/server';
import { createCustomerWithAdmin } from '@/lib/firebase/admin-customer-service';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    console.log('Signup attempt for:', email);

    // Validation
    if (!email || !password || !name) {
      console.error('Signup validation failed: missing fields');
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      console.error('Signup validation failed: password too short');
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Create customer with Firebase Admin SDK
    console.log('Creating Firebase customer...');
    const result = await createCustomerWithAdmin(email, password, name);

    if (!result.success) {
      console.error('Firebase customer creation failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    console.log('Firebase customer created successfully:', result.uid);

    // Return customer data with custom token
    const customerData = {
      uid: result.uid!,
      email: email,
      name: name,
      credits: 100 // Starting credits
    };

    return NextResponse.json({
      success: true,
      token: result.token, // Custom token for client-side auth
      customer: customerData,
      firebaseUser: {
        uid: result.uid!,
        emailVerified: false
      }
    });

  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}