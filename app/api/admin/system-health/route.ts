import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkType = searchParams.get('check') || 'all';
    
    const results: any = {
      timestamp: new Date().toISOString(),
      checks: {}
    };
    
    // Check Firebase Admin SDK
    if (checkType === 'all' || checkType === 'admin') {
      try {
        const { adminDb } = await import('@/lib/firebase/admin');
        results.checks.adminSdk = {
          status: adminDb ? 'OK' : 'NOT_INITIALIZED',
          message: adminDb ? 'Admin SDK is working' : 'Admin SDK not available'
        };
      } catch (error: any) {
        results.checks.adminSdk = {
          status: 'ERROR',
          message: error.message
        };
      }
    }
    
    // Check Client SDK
    if (checkType === 'all' || checkType === 'client') {
      try {
        const { serverDb } = await import('@/lib/firebase/server-config');
        results.checks.clientSdk = {
          status: serverDb ? 'OK' : 'NOT_INITIALIZED',
          message: serverDb ? 'Client SDK is working' : 'Client SDK not available'
        };
      } catch (error: any) {
        results.checks.clientSdk = {
          status: 'ERROR',
          message: error.message
        };
      }
    }
    
    // Check for orphaned customers (no email)
    if (checkType === 'all' || checkType === 'customers') {
      try {
        const { adminDb } = await import('@/lib/firebase/admin');
        
        if (adminDb) {
          const snapshot = await adminDb.collection('customers').limit(100).get();
          let orphanedCount = 0;
          let missingCredits = 0;
          let missingEpisodes = 0;
          
          snapshot.forEach((doc: any) => {
            const data = doc.data();
            if (!data.email) orphanedCount++;
            if (data.credits === undefined || data.credits === null) missingCredits++;
            if (!data.unlockedEpisodes) missingEpisodes++;
          });
          
          results.checks.customerIntegrity = {
            status: orphanedCount === 0 && missingCredits === 0 ? 'OK' : 'WARNING',
            totalChecked: snapshot.size,
            orphanedCustomers: orphanedCount,
            missingCredits: missingCredits,
            missingEpisodes: missingEpisodes
          };
        } else {
          // Fallback to client SDK
          const { collection, getDocs, limit, query } = await import('firebase/firestore');
          const { serverDb } = await import('@/lib/firebase/server-config');
          
          if (serverDb) {
            const q = query(collection(serverDb, 'customers'), limit(100));
            const snapshot = await getDocs(q);
            
            let orphanedCount = 0;
            let missingCredits = 0;
            let missingEpisodes = 0;
            
            snapshot.forEach(doc => {
              const data = doc.data();
              if (!data.email) orphanedCount++;
              if (data.credits === undefined || data.credits === null) missingCredits++;
              if (!data.unlockedEpisodes) missingEpisodes++;
            });
            
            results.checks.customerIntegrity = {
              status: orphanedCount === 0 && missingCredits === 0 ? 'OK' : 'WARNING',
              totalChecked: snapshot.size,
              orphanedCustomers: orphanedCount,
              missingCredits: missingCredits,
              missingEpisodes: missingEpisodes
            };
          }
        }
      } catch (error: any) {
        results.checks.customerIntegrity = {
          status: 'ERROR',
          message: error.message
        };
      }
    }
    
    // Check for duplicate customers
    if (checkType === 'all' || checkType === 'duplicates') {
      try {
        const { adminDb } = await import('@/lib/firebase/admin');
        
        if (adminDb) {
          const snapshot = await adminDb.collection('customers').get();
          const emailMap = new Map<string, number>();
          
          snapshot.forEach((doc: any) => {
            const data = doc.data();
            if (data.email) {
              const count = emailMap.get(data.email) || 0;
              emailMap.set(data.email, count + 1);
            }
          });
          
          const duplicates = Array.from(emailMap.entries())
            .filter(([email, count]) => count > 1)
            .map(([email, count]) => ({ email, count }));
          
          results.checks.duplicateCheck = {
            status: duplicates.length === 0 ? 'OK' : 'WARNING',
            totalCustomers: snapshot.size,
            duplicateEmails: duplicates
          };
        } else {
          results.checks.duplicateCheck = {
            status: 'SKIPPED',
            message: 'Admin SDK required for full duplicate check'
          };
        }
      } catch (error: any) {
        results.checks.duplicateCheck = {
          status: 'ERROR',
          message: error.message
        };
      }
    }
    
    // Overall health status
    const statuses = Object.values(results.checks).map((check: any) => check.status);
    if (statuses.includes('ERROR')) {
      results.overallStatus = 'ERROR';
    } else if (statuses.includes('WARNING')) {
      results.overallStatus = 'WARNING';
    } else {
      results.overallStatus = 'HEALTHY';
    }
    
    return NextResponse.json(results);
    
  } catch (error: any) {
    console.error('System health check error:', error);
    return NextResponse.json({
      overallStatus: 'ERROR',
      error: error.message
    }, { status: 500 });
  }
}