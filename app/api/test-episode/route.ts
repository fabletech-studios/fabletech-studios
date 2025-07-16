import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('Test episode endpoint called');
  
  try {
    // Try to read the body
    const contentType = request.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (contentType?.includes('multipart/form-data')) {
      console.log('Multipart form data detected');
      return NextResponse.json({ 
        success: true, 
        message: 'Test endpoint received multipart data',
        contentType 
      });
    }
    
    const body = await request.json().catch(() => null);
    console.log('Request body:', body);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test endpoint working',
      receivedData: body 
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}