import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const commentId = params.id;
    
    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID required' },
        { status: 400 }
      );
    }
    
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
        message: 'Comment deleted successfully',
      });
    }
    
    // Verify user identity
    let userId: string;
    
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (authError) {
      // Try as customer token
      userId = token;
      
      // Verify the customer exists
      const customerDoc = await adminDb.collection('customers').doc(token).get();
      if (!customerDoc.exists) {
        return NextResponse.json(
          { error: 'Invalid authentication token' },
          { status: 401 }
        );
      }
    }
    
    // Get the comment to verify ownership
    const commentDoc = await adminDb.collection('comments').doc(commentId).get();
    
    if (!commentDoc.exists) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }
    
    const commentData = commentDoc.data();
    
    // Check if user owns this comment
    if (commentData?.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this comment' },
        { status: 403 }
      );
    }
    
    // Delete the comment
    await adminDb.collection('comments').doc(commentId).delete();
    
    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete comment' },
      { status: 500 }
    );
  }
}