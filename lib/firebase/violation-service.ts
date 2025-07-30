import { serverDb } from './server-config';
import { db } from './config';
import { collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp, Timestamp } from 'firebase/firestore';

export enum ViolationType {
  SCREEN_RECORDING = 'screen_recording',
  DOWNLOAD_ATTEMPT = 'download_attempt',
  EXCESSIVE_SEEKING = 'excessive_seeking',
  SUSPICIOUS_BEHAVIOR = 'suspicious_behavior',
  COPYRIGHT_VIOLATION = 'copyright_violation'
}

export interface Violation {
  id?: string;
  userId: string;
  type: ViolationType;
  contentId?: string;
  timestamp?: Timestamp;
  ipAddress?: string;
  userAgent?: string;
  detection?: {
    method: string;
    confidence: number;
    timestamp: number;
  };
  metadata?: any;
}

export async function logViolation(violation: Violation): Promise<void> {
  try {
    const violationData = {
      ...violation,
      timestamp: serverTimestamp(),
      ipAddress: typeof window !== 'undefined' ? await getClientIP() : 'server',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server'
    };

    // Use server DB if available, otherwise client
    const database = serverDb || db;
    await addDoc(collection(database, 'violations'), violationData);
    
    console.log('[Violation Logged]', violation.type, violation.userId);
  } catch (error) {
    console.error('Error logging violation:', error);
  }
}

export async function getUserViolations(userId: string, limit: number = 10): Promise<Violation[]> {
  try {
    const database = serverDb || db;
    const q = query(
      collection(database, 'violations'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Violation));
  } catch (error) {
    console.error('Error fetching violations:', error);
    return [];
  }
}

export async function getViolationStats(userId: string): Promise<{
  total: number;
  byType: Record<ViolationType, number>;
  lastViolation?: Date;
}> {
  const violations = await getUserViolations(userId, 100);
  
  const stats = {
    total: violations.length,
    byType: {} as Record<ViolationType, number>,
    lastViolation: undefined as Date | undefined
  };
  
  Object.values(ViolationType).forEach(type => {
    stats.byType[type] = 0;
  });
  
  violations.forEach(violation => {
    stats.byType[violation.type]++;
    if (!stats.lastViolation && violation.timestamp) {
      stats.lastViolation = violation.timestamp.toDate();
    }
  });
  
  return stats;
}

// Helper function to get client IP (requires API endpoint)
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('/api/get-ip');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch {
    return 'unknown';
  }
}