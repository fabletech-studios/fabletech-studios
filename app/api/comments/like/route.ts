import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

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
    const body = await request.json();
    const { commentId, action } = body;

    if (!commentId || !action || !['like', 'unlike'].includes(action)) {
      return NextResponse.json(
        { error: 'Comment ID and valid action (like/unlike) are required' },
        { status: 400 }
      );
    }

    // Mock response for local development
    if (!adminAuth || !adminDb) {
      return NextResponse.json({
        success: true,
        likes: action === 'like' ? 1 : 0,
        isLiked: action === 'like',
      });
    }

    // Verify user authentication
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get the comment
    const commentRef = adminDb.collection('comments').doc(commentId);
    const commentDoc = await commentRef.get();
    
    if (!commentDoc.exists) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    const commentData = commentDoc.data();
    const currentLikedBy = commentData?.likedBy || [];

    let updatedLikes: number;
    let updatedLikedBy: string[];
    let isLiked: boolean;

    if (action === 'like') {
      // Add like if not already liked
      if (!currentLikedBy.includes(userId)) {
        updatedLikes = (commentData?.likes || 0) + 1;
        updatedLikedBy = [...currentLikedBy, userId];
        isLiked = true;
      } else {
        // Already liked, no change
        updatedLikes = commentData?.likes || 0;
        updatedLikedBy = currentLikedBy;
        isLiked = true;
      }
    } else {
      // Remove like if currently liked
      if (currentLikedBy.includes(userId)) {
        updatedLikes = Math.max(0, (commentData?.likes || 0) - 1);
        updatedLikedBy = currentLikedBy.filter((id: string) => id !== userId);
        isLiked = false;
      } else {
        // Not liked, no change
        updatedLikes = commentData?.likes || 0;
        updatedLikedBy = currentLikedBy;
        isLiked = false;
      }
    }

    // Update the comment
    await commentRef.update({
      likes: updatedLikes,
      likedBy: updatedLikedBy,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      likes: updatedLikes,
      isLiked,
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment like' },
      { status: 500 }
    );
  }
}