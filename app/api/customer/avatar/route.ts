import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Get form data
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      );
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }
    
    // Mock response for local development
    if (!adminAuth || !adminDb || !adminStorage) {
      return NextResponse.json({
        success: true,
        avatarUrl: '/api/placeholder/150/150',
        message: 'Avatar uploaded successfully (mock)',
      });
    }
    
    // Verify user identity
    let userId: string;
    let isCustomer = false;
    
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (authError) {
      // Try as customer token
      const customerDoc = await adminDb.collection('customers').doc(token).get();
      if (!customerDoc.exists) {
        return NextResponse.json(
          { error: 'Invalid authentication token' },
          { status: 401 }
        );
      }
      userId = token;
      isCustomer = true;
    }
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `avatars/${userId}-${Date.now()}.${fileExtension}`;
    
    // Upload to Firebase Storage
    const bucket = adminStorage.bucket();
    const fileUpload = bucket.file(fileName);
    
    await fileUpload.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          userId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });
    
    // Make the file publicly accessible
    await fileUpload.makePublic();
    
    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    
    // Update user/customer document with avatar URL
    if (isCustomer) {
      await adminDb.collection('customers').doc(userId).update({
        avatarUrl: publicUrl,
        updatedAt: new Date(),
      });
    } else {
      await adminDb.collection('users').doc(userId).update({
        avatarUrl: publicUrl,
        photoURL: publicUrl, // Also update photoURL for compatibility
        updatedAt: new Date(),
      });
    }
    
    return NextResponse.json({
      success: true,
      avatarUrl: publicUrl,
      message: 'Avatar uploaded successfully',
    });
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Mock response for local development
    if (!adminAuth || !adminDb) {
      return NextResponse.json({
        success: true,
        avatarUrl: null,
      });
    }
    
    // Verify user identity and get avatar
    let avatarUrl: string | null = null;
    
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
      const userData = userDoc.data();
      avatarUrl = userData?.avatarUrl || userData?.photoURL || null;
    } catch (authError) {
      // Try as customer token
      const customerDoc = await adminDb.collection('customers').doc(token).get();
      if (customerDoc.exists) {
        const customerData = customerDoc.data();
        avatarUrl = customerData?.avatarUrl || null;
      }
    }
    
    return NextResponse.json({
      success: true,
      avatarUrl,
    });
  } catch (error: any) {
    console.error('Error fetching avatar:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch avatar' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Mock response for local development
    if (!adminAuth || !adminDb || !adminStorage) {
      return NextResponse.json({
        success: true,
        message: 'Avatar deleted successfully (mock)',
      });
    }
    
    // Verify user identity
    let userId: string;
    let isCustomer = false;
    let currentAvatarUrl: string | null = null;
    
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      userId = decodedToken.uid;
      const userDoc = await adminDb.collection('users').doc(userId).get();
      const userData = userDoc.data();
      currentAvatarUrl = userData?.avatarUrl || userData?.photoURL || null;
    } catch (authError) {
      // Try as customer token
      const customerDoc = await adminDb.collection('customers').doc(token).get();
      if (!customerDoc.exists) {
        return NextResponse.json(
          { error: 'Invalid authentication token' },
          { status: 401 }
        );
      }
      userId = token;
      isCustomer = true;
      const customerData = customerDoc.data();
      currentAvatarUrl = customerData?.avatarUrl || null;
    }
    
    // Delete from storage if exists
    if (currentAvatarUrl && currentAvatarUrl.includes('storage.googleapis.com')) {
      try {
        const fileName = currentAvatarUrl.split('/').pop();
        if (fileName) {
          const bucket = adminStorage.bucket();
          await bucket.file(`avatars/${fileName}`).delete();
        }
      } catch (deleteError) {
        console.error('Error deleting file from storage:', deleteError);
      }
    }
    
    // Update user/customer document to remove avatar URL
    if (isCustomer) {
      await adminDb.collection('customers').doc(userId).update({
        avatarUrl: null,
        updatedAt: new Date(),
      });
    } else {
      await adminDb.collection('users').doc(userId).update({
        avatarUrl: null,
        photoURL: null,
        updatedAt: new Date(),
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting avatar:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete avatar' },
      { status: 500 }
    );
  }
}