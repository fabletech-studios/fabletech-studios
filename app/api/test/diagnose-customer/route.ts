import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No auth token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Extract all possible UIDs from token
    let tokenInfo: any = {};
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      tokenInfo = {
        user_id: payload.user_id,
        sub: payload.sub,
        uid: payload.uid,
        email: payload.email,
        name: payload.name,
        given_name: payload.given_name,
        picture: payload.picture,
        provider: payload.firebase?.sign_in_provider,
        all_fields: Object.keys(payload)
      };
    } catch (error: any) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Determine which UID to use
    const uid = tokenInfo.user_id || tokenInfo.sub || tokenInfo.uid;
    
    // Try to find customer documents with different UIDs
    const { adminDb } = await import('@/lib/firebase/admin');
    const { getFirebaseCustomer } = await import('@/lib/firebase/customer-service');
    
    let customers: any[] = [];
    
    // Check with primary UID
    if (uid) {
      const customer1 = await getFirebaseCustomer(uid);
      if (customer1) {
        customers.push({ source: 'primary_uid', uid, data: customer1 });
      }
    }
    
    // Check with user_id if different
    if (tokenInfo.user_id && tokenInfo.user_id !== uid) {
      const customer2 = await getFirebaseCustomer(tokenInfo.user_id);
      if (customer2) {
        customers.push({ source: 'user_id', uid: tokenInfo.user_id, data: customer2 });
      }
    }
    
    // Check with sub if different
    if (tokenInfo.sub && tokenInfo.sub !== uid) {
      const customer3 = await getFirebaseCustomer(tokenInfo.sub);
      if (customer3) {
        customers.push({ source: 'sub', uid: tokenInfo.sub, data: customer3 });
      }
    }
    
    // Check with email if available
    if (tokenInfo.email && adminDb) {
      try {
        const emailQuery = await adminDb.collection('customers')
          .where('email', '==', tokenInfo.email)
          .get();
        
        emailQuery.forEach((doc: any) => {
          const data = doc.data();
          customers.push({ 
            source: 'email_query', 
            uid: doc.id, 
            data: { ...data, uid: doc.id }
          });
        });
      } catch (e) {
        console.error('Email query failed:', e);
      }
    }
    
    // Check all customers collection if admin SDK available
    if (adminDb) {
      try {
        const allCustomers = await adminDb.collection('customers').limit(10).get();
        const totalCount = allCustomers.size;
        
        return NextResponse.json({
          status: 'DIAGNOSTIC',
          token_info: tokenInfo,
          primary_uid: uid,
          customers_found: customers.length,
          customers: customers.map(c => ({
            source: c.source,
            uid: c.uid,
            email: c.data.email,
            credits: c.data.credits,
            unlocked_episodes: c.data.unlockedEpisodes?.length || 0,
            created_at: c.data.createdAt
          })),
          total_customers_in_db: totalCount,
          duplicate_detection: customers.length > 1 ? 'DUPLICATES_FOUND' : 'NO_DUPLICATES'
        });
      } catch (e) {
        console.error('Admin query failed:', e);
      }
    }
    
    return NextResponse.json({
      status: 'DIAGNOSTIC',
      token_info: tokenInfo,
      primary_uid: uid,
      customers_found: customers.length,
      customers: customers.map(c => ({
        source: c.source,
        uid: c.uid,
        email: c.data.email,
        credits: c.data.credits,
        unlocked_episodes: c.data.unlockedEpisodes?.length || 0
      })),
      duplicate_detection: customers.length > 1 ? 'DUPLICATES_FOUND' : 'NO_DUPLICATES'
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'ERROR',
      error: error.message
    }, { status: 500 });
  }
}