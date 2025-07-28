import { NextRequest, NextResponse } from 'next/server';
import { createCustomerWithAdmin } from '@/lib/firebase/admin-customer-service';
import { createFirebaseCustomer } from '@/lib/firebase/customer-service';

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

    // Try Admin SDK first if available
    const hasAdminCreds = process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY;
    
    if (hasAdminCreds) {
      console.log('Creating Firebase customer with Admin SDK...');
      const adminResult = await createCustomerWithAdmin(email, password, name);
      
      if (!adminResult.success) {
        console.error('Admin SDK creation failed:', adminResult.error);
        return NextResponse.json(
          { success: false, error: adminResult.error },
          { status: 400 }
        );
      }
      
      console.log('Customer created with Admin SDK:', adminResult.uid);
      
      return NextResponse.json({
        success: true,
        token: adminResult.token,
        customer: {
          uid: adminResult.uid!,
          email: email,
          name: name,
          credits: 100
        },
        firebaseUser: {
          uid: adminResult.uid!,
          emailVerified: false
        }
      });
    } else {
      // Fallback to client SDK (less secure but works without admin creds)
      console.log('Admin credentials not available, using client SDK...');
      const clientResult = await createFirebaseCustomer(email, password, name);
      
      if (!clientResult.success) {
        console.error('Client SDK creation failed:', clientResult.error);
        return NextResponse.json(
          { success: false, error: clientResult.error },
          { status: 400 }
        );
      }
      
      console.log('Customer created with client SDK:', clientResult.user?.uid);
      
      // Generate a simple JWT token as fallback
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { 
          uid: clientResult.user!.uid,
          email: clientResult.user!.email 
        },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '7d' }
      );
      
      return NextResponse.json({
        success: true,
        token,
        customer: clientResult.customer,
        firebaseUser: {
          uid: clientResult.user!.uid,
          emailVerified: clientResult.user!.emailVerified
        }
      });
    }

  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}