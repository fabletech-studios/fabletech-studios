import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'No auth token' });
  }

  const token = authHeader.substring(7);
  
  try {
    // Decode token to see what UID is being used
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    return NextResponse.json({
      token_uid: payload.sub || payload.user_id,
      all_uid_fields: {
        sub: payload.sub,
        user_id: payload.user_id,
        uid: payload.uid
      },
      email: payload.email,
      provider: payload.firebase?.sign_in_provider
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' });
  }
}