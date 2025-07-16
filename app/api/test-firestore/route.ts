import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Firestore not initialized'
      });
    }

    // Try to read from a test collection
    const testCollection = collection(db, 'test-noauth');
    const snapshot = await getDocs(testCollection);
    
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));

    return NextResponse.json({
      success: true,
      message: 'Firestore read successful',
      documentCount: documents.length,
      documents
    });
  } catch (error: any) {
    console.error('Firestore test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to test Firestore'
    });
  }
}

export async function POST() {
  try {
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Firestore not initialized'
      });
    }

    // Try to write to a test collection
    const testCollection = collection(db, 'test-noauth');
    const docRef = await addDoc(testCollection, {
      message: 'Test document without auth',
      timestamp: serverTimestamp(),
      source: 'fabletech-studios'
    });

    return NextResponse.json({
      success: true,
      message: 'Firestore write successful',
      documentId: docRef.id
    });
  } catch (error: any) {
    console.error('Firestore write error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to write to Firestore'
    });
  }
}