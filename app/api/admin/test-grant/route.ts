import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/firebase/server-config';
import { extractUidFromToken } from '@/lib/utils/token-utils';

const ADMIN_UIDS = [
  'IIP8rWwMCeZ62Svix1lcZPyRkRj2', // Your Google OAuth UID
  'BAhEHbxh31MgdhAQJza3SVJ7cIh2', // Your original UID
];

export async function POST(request: NextRequest) {
  const steps: any[] = [];
  
  try {
    // Step 1: Check auth header
    const authHeader = request.headers.get('authorization');
    steps.push({ step: 'auth_header', has_header: !!authHeader });
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'No auth header',
        steps 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    steps.push({ step: 'token_extracted', token_length: token.length });
    
    // Step 2: Extract UID
    let adminUid: string;
    try {
      const extracted = extractUidFromToken(token);
      adminUid = extracted.uid;
      steps.push({ 
        step: 'uid_extracted', 
        uid: adminUid,
        is_admin: ADMIN_UIDS.includes(adminUid)
      });
    } catch (error: any) {
      steps.push({ step: 'uid_extraction_failed', error: error.message });
      return NextResponse.json({ 
        error: 'Invalid token',
        steps 
      }, { status: 401 });
    }

    // Step 3: Check admin access
    if (!ADMIN_UIDS.includes(adminUid)) {
      return NextResponse.json({ 
        error: 'Not admin',
        steps 
      }, { status: 403 });
    }

    // Step 4: Check database
    steps.push({ 
      step: 'check_db', 
      has_db: !!serverDb,
      db_type: serverDb ? typeof serverDb : 'null'
    });
    
    if (!serverDb) {
      return NextResponse.json({ 
        error: 'Database not initialized',
        steps 
      }, { status: 500 });
    }

    // Step 5: Try a simple query
    try {
      const { collection, getDocs, limit, query } = await import('firebase/firestore');
      const testQuery = query(collection(serverDb, 'customers'), limit(1));
      const snapshot = await getDocs(testQuery);
      steps.push({ 
        step: 'query_success', 
        found_docs: snapshot.size 
      });
    } catch (error: any) {
      steps.push({ 
        step: 'query_failed', 
        error: error.message,
        stack: error.stack
      });
      return NextResponse.json({ 
        error: 'Query failed',
        steps 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'All checks passed',
      steps 
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      steps,
      stack: error.stack
    }, { status: 500 });
  }
}