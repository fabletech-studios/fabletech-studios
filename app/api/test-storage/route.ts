import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';

export async function GET() {
  try {
    if (!storage) {
      return NextResponse.json({
        success: false,
        error: 'Storage not initialized'
      });
    }

    // Try to list files in a test folder
    const testFolderRef = ref(storage, 'test-noauth/');
    const result = await listAll(testFolderRef);
    
    const files = await Promise.all(
      result.items.map(async (itemRef) => ({
        name: itemRef.name,
        fullPath: itemRef.fullPath,
        url: await getDownloadURL(itemRef)
      }))
    );

    return NextResponse.json({
      success: true,
      message: 'Storage read successful',
      fileCount: files.length,
      files
    });
  } catch (error: any) {
    console.error('Storage test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to test Storage'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!storage) {
      return NextResponse.json({
        success: false,
        error: 'Storage not initialized'
      });
    }

    // Create a test text file
    const timestamp = new Date().toISOString();
    const testContent = `Test file created at ${timestamp} without Firebase Auth`;
    const blob = new Blob([testContent], { type: 'text/plain' });
    
    const fileName = `test-${Date.now()}.txt`;
    const storageRef = ref(storage, `test-noauth/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'text/plain',
      customMetadata: {
        source: 'fabletech-studios',
        timestamp
      }
    });

    const downloadURL = await getDownloadURL(snapshot.ref);

    return NextResponse.json({
      success: true,
      message: 'Storage write successful',
      fileName,
      fullPath: snapshot.ref.fullPath,
      downloadURL
    });
  } catch (error: any) {
    console.error('Storage write error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to write to Storage'
    });
  }
}