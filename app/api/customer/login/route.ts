import { NextRequest, NextResponse } from 'next/server';
import { signInFirebaseCustomer } from '@/lib/firebase/customer-service';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Sign in with Firebase
    const result = await signInFirebaseCustomer(email, password);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
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
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}