import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/firebase/server-config';
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let uid: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      uid = payload.user_id || payload.sub;
      if (!uid) throw new Error('Invalid token');
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const {
      episodeId,
      seriesId,
      currentTime,
      duration,
      action, // 'start', 'progress', 'complete', 'pause'
      playbackSpeed = 1,
      quality
    } = await request.json();

    if (!episodeId || !seriesId || action === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get device information
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    if (!serverDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // For start action, create new playback session
    if (action === 'start') {
      const sessionId = await addDoc(collection(serverDb, 'playback-sessions'), {
        userId: uid,
        episodeId,
        seriesId,
        startTime: serverTimestamp(),
        lastUpdateTime: serverTimestamp(),
        totalWatchTime: 0,
        currentTime: 0,
        duration,
        completed: false,
        playbackSpeed,
        quality,
        userAgent,
        ip,
        deviceType: getDeviceType(userAgent)
      });

      return NextResponse.json({
        success: true,
        sessionId: sessionId.id
      });
    }

    // For progress updates, find the most recent session
    if (action === 'progress' || action === 'complete' || action === 'pause') {
      const sessionsQuery = query(
        collection(serverDb, 'playback-sessions'),
        where('userId', '==', uid),
        where('episodeId', '==', episodeId),
        where('completed', '==', false),
        orderBy('startTime', 'desc'),
        limit(1)
      );

      const sessions = await getDocs(sessionsQuery);
      
      if (!sessions.empty) {
        const sessionDoc = sessions.docs[0];
        const sessionData = sessionDoc.data();
        
        // Calculate watch time
        const watchTime = currentTime - (sessionData.currentTime || 0);
        
        await updateDoc(doc(serverDb, 'playback-sessions', sessionDoc.id), {
          currentTime,
          lastUpdateTime: serverTimestamp(),
          totalWatchTime: (sessionData.totalWatchTime || 0) + Math.max(0, watchTime),
          completed: action === 'complete' || (currentTime / duration) > 0.95,
          playbackSpeed,
          quality
        });

        // Track milestone events
        if (action === 'complete' || (currentTime / duration) > 0.95) {
          await addDoc(collection(serverDb, 'playback-events'), {
            userId: uid,
            episodeId,
            seriesId,
            event: 'episode_completed',
            timestamp: serverTimestamp(),
            metadata: {
              watchTime: sessionData.totalWatchTime + watchTime,
              playbackSpeed
            }
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Playback tracking error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track playback' },
      { status: 500 }
    );
  }
}

function getDeviceType(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  if (/tv/i.test(userAgent)) return 'tv';
  return 'desktop';
}