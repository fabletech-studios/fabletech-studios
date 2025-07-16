import { NextRequest, NextResponse } from 'next/server';
import { createFirebaseCustomer } from '@/lib/firebase/customer-service';
import { auth } from '@/lib/firebase/config';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Create customer with Firebase
    const result = await createFirebaseCustomer(email, password, name);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Get ID token from Firebase Auth
    const token = await result.user!.getIdToken();
    
    // Return customer data
    const customerData = {
      uid: result.user!.uid,
      email: result.user!.email,
      name: result.customer!.name,
      credits: result.customer!.credits
    };

    return NextResponse.json({
      success: true,
      token,
      customer: customerData,
      firebaseUser: {
        uid: result.user!.uid,
        emailVerified: result.user!.emailVerified
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