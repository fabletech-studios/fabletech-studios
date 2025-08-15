import { NextRequest, NextResponse } from 'next/server';
import { getUserActivitiesAdmin } from '@/lib/firebase/admin-activity-service';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let userId: string;
    
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      userId = payload.user_id || payload.sub || payload.uid;
      if (!userId) throw new Error('Invalid token');
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    console.log('[Activities] Fetching for user:', userId);

    // Get activities using Admin SDK
    const activities = await getUserActivitiesAdmin(userId, 20);
    
    console.log('[Activities] Found activities:', activities.length);

    return NextResponse.json({
      success: true,
      activities,
    });
  } catch (error: any) {
    console.error('[Activities] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}