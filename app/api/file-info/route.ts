import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { filePath } = await request.json();
    
    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'File path required' },
        { status: 400 }
      );
    }
    
    const fullPath = path.join(process.cwd(), 'public', filePath);
    
    try {
      const stats = await fs.stat(fullPath);
      
      return NextResponse.json({
        success: true,
        size: stats.size,
        sizeFormatted: formatFileSize(stats.size),
        modified: stats.mtime,
        exists: true
      });
    } catch (error) {
      return NextResponse.json({
        success: true,
        exists: false
      });
    }
  } catch (error) {
    console.error('Error getting file info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get file info' },
      { status: 500 }
    );
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}