import { NextRequest, NextResponse } from 'next/server';
import { extractUidFromToken } from '@/lib/utils/token-utils';
import jwt from 'jsonwebtoken';

const ADMIN_UIDS = [
  'IIP8rWwMCeZ62Svix1lcZPyRkRj2', // Your Google OAuth UID
  'BAhEHbxh31MgdhAQJza3SVJ7cIh2', // Your original UID
];

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No auth token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Extract UID
    let adminUid: string;
    try {
      const extracted = extractUidFromToken(token);
      adminUid = extracted.uid;
    } catch (error: any) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check admin access
    if (!ADMIN_UIDS.includes(adminUid)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { targetUid } = await request.json();

    if (!targetUid) {
      return NextResponse.json({ error: 'Target UID required' }, { status: 400 });
    }

    // Get target customer data
    const { adminDb } = await import('@/lib/firebase/admin');
    
    let customerData: any = null;
    
    if (!adminDb) {
      // Fallback to client SDK
      const { doc, getDoc } = await import('firebase/firestore');
      const { serverDb } = await import('@/lib/firebase/server-config');
      
      if (!serverDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }

      const customerDoc = await getDoc(doc(serverDb, 'customers', targetUid));
      if (!customerDoc.exists()) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
      
      customerData = customerDoc.data();
    } else {
      // Use Admin SDK
      const customerDoc = await adminDb.collection('customers').doc(targetUid).get();
      
      if (!customerDoc.exists) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
      
      customerData = customerDoc.data();
    }

    // Create a test token for the target customer
    // This token will allow admin to impersonate the customer for testing
    const impersonationToken = jwt.sign(
      {
        uid: targetUid,
        sub: targetUid,
        email: customerData.email,
        name: customerData.name,
        impersonatedBy: adminUid,
        impersonatedAt: new Date().toISOString(),
        expiresIn: '1h' // Token expires in 1 hour for security
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Log the impersonation for audit
    if (adminDb) {
      await adminDb.collection('admin-logs').add({
        action: 'customer_impersonation',
        adminUid,
        targetUid,
        targetEmail: customerData.email,
        timestamp: new Date(),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      });
    }

    return NextResponse.json({
      success: true,
      token: impersonationToken,
      customer: {
        uid: targetUid,
        email: customerData.email,
        name: customerData.name,
        credits: customerData.credits
      },
      message: 'Impersonation token created. It will expire in 1 hour.'
    });

  } catch (error: any) {
    console.error('Impersonate customer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to impersonate customer' },
      { status: 500 }
    );
  }
}