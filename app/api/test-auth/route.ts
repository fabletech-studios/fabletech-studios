import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = 'admin@fabletech.com';
const ADMIN_PASSWORD_HASH = '$2b$10$gfVeitGUILqsBnqyJDJF.eAJgsekt72.8Vd40O7FSI94hWCOFbkma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    console.log('Test auth endpoint called with:', email);
    
    if (email === ADMIN_EMAIL) {
      const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
      console.log('Password validation result:', isValid);
      
      if (isValid) {
        return NextResponse.json({ 
          success: true, 
          message: 'Authentication successful' 
        });
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid credentials' 
    }, { status: 401 });
    
  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error',
      error: String(error)
    }, { status: 500 });
  }
}