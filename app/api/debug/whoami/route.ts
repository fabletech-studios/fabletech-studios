import { NextRequest, NextResponse } from 'next/server';
import { extractUidFromToken } from '@/lib/utils/token-utils';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No auth token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    try {
      const extracted = extractUidFromToken(token);
      return NextResponse.json({
        uid: extracted.uid,
        userInfo: extracted.userInfo,
        isAdmin: ['IIP8rWwMCeZ62Svix1lcZPyRkRj2', 'BAhEHbxh31MgdhAQJza3SVJ7cIh2'].includes(extracted.uid)
      });
    } catch (error: any) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}