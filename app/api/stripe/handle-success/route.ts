import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');
  const packageId = searchParams.get('package');
  
  if (!sessionId) {
    return redirect('/credits/purchase?error=missing_session');
  }
  
  // Redirect to the success page with the session ID
  return redirect(`/credits/success?session_id=${sessionId}&package=${packageId || ''}`);
}
