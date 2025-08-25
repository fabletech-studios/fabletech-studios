import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const episodeId = searchParams.get('episodeId');
    const seriesId = searchParams.get('seriesId');

    if (!episodeId) {
      return NextResponse.json(
        { error: 'Episode ID is required' },
        { status: 400 }
      );
    }

    // Mock data for local development when Firebase Admin is not configured
    if (!adminDb) {
      const mockComments = [
        {
          id: 'comment-1',
          episodeId,
          seriesId,
          userId: 'user-1',
          userName: 'Sarah Johnson',
          userAvatar: null,
          content: 'This episode was amazing! The plot twist at the end was unexpected.',
          rating: 5,
          likes: 12,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'comment-2',
          episodeId,
          seriesId,
          userId: 'user-2',
          userName: 'Mike Chen',
          userAvatar: null,
          content: 'Great voice acting and sound effects. Really immersive!',
          rating: 4,
          likes: 8,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'comment-3',
          episodeId,
          seriesId,
          userId: 'user-3',
          userName: 'Emily Davis',
          userAvatar: null,
          content: 'Can\'t wait for the next episode! This series keeps getting better.',
          rating: 5,
          likes: 15,
          createdAt: new Date(Date.now() - 10800000).toISOString(),
          updatedAt: new Date(Date.now() - 10800000).toISOString(),
        },
      ];

      return NextResponse.json({
        success: true,
        comments: mockComments,
        total: mockComments.length,
      });
    }

    // Fetch comments from Firestore
    const commentsRef = adminDb
      .collection('comments')
      .where('episodeId', '==', episodeId)
      .where('seriesId', '==', seriesId)
      .orderBy('createdAt', 'desc')
      .limit(50);

    const snapshot = await commentsRef.get();
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    }));

    return NextResponse.json({
      success: true,
      comments,
      total: comments.length,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

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
    const { episodeId, seriesId, content, rating } = body;

    if (!episodeId || !seriesId || !content) {
      return NextResponse.json(
        { error: 'Episode ID, Series ID, and content are required' },
        { status: 400 }
      );
    }

    // Mock response for local development
    if (!adminAuth || !adminDb) {
      const mockComment = {
        id: `comment-${Date.now()}`,
        episodeId,
        seriesId,
        userId: 'mock-user',
        userName: 'Test User',
        userAvatar: null,
        content,
        rating: rating || 0,
        likes: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        comment: mockComment,
      });
    }

    // Verify user authentication
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    // Get user details
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const userName = userData?.displayName || userEmail?.split('@')[0] || 'Anonymous';

    // Create comment
    const commentData = {
      episodeId,
      seriesId,
      userId,
      userName,
      userEmail,
      userAvatar: userData?.photoURL || null,
      content,
      rating: rating || 0,
      likes: 0,
      likedBy: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      isApproved: true, // Auto-approve for now, can add moderation later
      isDeleted: false,
    };

    const commentRef = await adminDb.collection('comments').add(commentData);
    const newComment = {
      id: commentRef.id,
      ...commentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      comment: newComment,
    });
  } catch (error) {
    console.error('Error posting comment:', error);
    return NextResponse.json(
      { error: 'Failed to post comment' },
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

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
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

    // Verify user authentication
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get the comment
    const commentDoc = await adminDb.collection('comments').doc(commentId).get();
    
    if (!commentDoc.exists) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    const commentData = commentDoc.data();

    // Check if user owns the comment or is an admin
    if (commentData?.userId !== userId && !decodedToken.admin) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      );
    }

    // Soft delete the comment
    await adminDb.collection('comments').doc(commentId).update({
      isDeleted: true,
      deletedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}