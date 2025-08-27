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
    try {
      // Use episodeId only to avoid composite index requirement
      const commentsRef = adminDb
        .collection('comments')
        .where('episodeId', '==', episodeId)
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
    } catch (firestoreError: any) {
      // If Firestore query fails (likely due to missing index), try without orderBy
      console.log('Firestore query failed, trying simpler query:', firestoreError.message);
      
      try {
        const simpleRef = adminDb
          .collection('comments')
          .where('episodeId', '==', episodeId)
          .limit(50);

        const snapshot = await simpleRef.get();
        const comments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        }));

        // Sort in memory if orderBy failed
        comments.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA; // Descending order
        });

        return NextResponse.json({
          success: true,
          comments,
          total: comments.length,
        });
      } catch (fallbackError) {
        console.error('Even simple query failed:', fallbackError);
        // Return empty array instead of error to not break the UI
        return NextResponse.json({
          success: true,
          comments: [],
          total: 0,
        });
      }
    }
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
    const { episodeId, seriesId, content, rating, displayName } = body;

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

    // Verify user authentication - try Firebase auth first, then customer token
    let userId: string;
    let userEmail: string | undefined;
    let userName: string = 'Anonymous';
    
    try {
      // Try Firebase auth token
      const decodedToken = await adminAuth.verifyIdToken(token);
      userId = decodedToken.uid;
      userEmail = decodedToken.email;
      
      // Get user details from users collection
      const userDoc = await adminDb.collection('users').doc(userId).get();
      const userData = userDoc.data();
      userName = userData?.displayName || userEmail?.split('@')[0] || 'Anonymous';
    } catch (authError) {
      // If Firebase auth fails, try as customer token
      console.log('Firebase auth failed, trying customer token');
      
      // Customer tokens are just the UID
      const customerDoc = await adminDb.collection('customers').doc(token).get();
      
      if (!customerDoc.exists) {
        return NextResponse.json(
          { error: 'Invalid authentication token' },
          { status: 401 }
        );
      }
      
      const customerData = customerDoc.data();
      userId = token;
      userEmail = customerData?.email;
      userName = customerData?.displayName || customerData?.email?.split('@')[0] || 'Anonymous';
    }

    // Use the provided displayName if available, otherwise use the default
    if (displayName && displayName.trim()) {
      userName = displayName.trim();
    }

    // Get user's avatar URL
    let userAvatar: string | null = null;
    try {
      if (userId === token) {
        // Customer
        const customerDoc = await adminDb.collection('customers').doc(userId).get();
        const customerData = customerDoc.data();
        userAvatar = customerData?.avatarUrl || null;
      } else {
        // Firebase user
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.data();
        userAvatar = userData?.avatarUrl || userData?.photoURL || null;
      }
    } catch (error) {
      console.log('Could not fetch avatar:', error);
    }
    
    // Create comment
    const commentData = {
      episodeId,
      seriesId,
      userId,
      userName,
      userEmail,
      userAvatar,
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

    // Verify user authentication - try Firebase auth first, then customer token
    let userId: string;
    let isAdmin = false;
    
    try {
      // Try Firebase auth token
      const decodedToken = await adminAuth.verifyIdToken(token);
      userId = decodedToken.uid;
      isAdmin = decodedToken.admin || false;
    } catch (authError) {
      // If Firebase auth fails, try as customer token (just the UID)
      const customerDoc = await adminDb.collection('customers').doc(token).get();
      
      if (!customerDoc.exists) {
        return NextResponse.json(
          { error: 'Invalid authentication token' },
          { status: 401 }
        );
      }
      
      userId = token;
    }

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
    if (commentData?.userId !== userId && !isAdmin) {
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