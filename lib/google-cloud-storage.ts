import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

// Initialize Google Cloud Storage
let storage: Storage | null = null;

try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials,
    });
    console.log('[GCS] Initialized with service account');
  } else if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
    // Use default credentials (for Google Cloud Run, etc.)
    storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
    console.log('[GCS] Initialized with default credentials');
  }
} catch (error) {
  console.error('[GCS] Failed to initialize:', error);
}

export const gcsStorage = storage;
export const gcsBucket = storage?.bucket(process.env.GOOGLE_CLOUD_BUCKET || 'fabletech-videos');

// Generate a signed URL for direct upload
export async function generateUploadUrl(
  fileName: string,
  contentType: string,
  metadata?: Record<string, string>
) {
  if (!gcsBucket) {
    throw new Error('Google Cloud Storage not configured');
  }

  const fileExtension = fileName.split('.').pop();
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  const filePath = `videos/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${uniqueFileName}`;

  // Get a signed URL for uploading
  const [url] = await gcsBucket.file(filePath).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
    contentType,
    extensionHeaders: metadata,
  });

  // Generate CDN URL if configured
  const cdnDomain = process.env.GOOGLE_CDN_DOMAIN;
  const publicUrl = cdnDomain 
    ? `https://${cdnDomain}/${filePath}`
    : `https://storage.googleapis.com/${gcsBucket.name}/${filePath}`;

  return {
    uploadUrl: url,
    filePath,
    publicUrl,
    expires: new Date(Date.now() + 60 * 60 * 1000),
  };
}

// Generate a signed URL for streaming (with expiration)
export async function generateStreamingUrl(
  filePath: string,
  expiresInMinutes: number = 360 // 6 hours default
) {
  if (!gcsBucket) {
    throw new Error('Google Cloud Storage not configured');
  }

  const [url] = await gcsBucket.file(filePath).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });

  return url;
}

// Check if file exists
export async function fileExists(filePath: string): Promise<boolean> {
  if (!gcsBucket) return false;
  
  try {
    const [exists] = await gcsBucket.file(filePath).exists();
    return exists;
  } catch (error) {
    console.error('[GCS] Error checking file existence:', error);
    return false;
  }
}

// Get file metadata
export async function getFileMetadata(filePath: string) {
  if (!gcsBucket) {
    throw new Error('Google Cloud Storage not configured');
  }

  const [metadata] = await gcsBucket.file(filePath).getMetadata();
  return {
    size: metadata.size,
    contentType: metadata.contentType,
    created: metadata.timeCreated,
    updated: metadata.updated,
    metadata: metadata.metadata,
  };
}

// Delete file
export async function deleteFile(filePath: string): Promise<boolean> {
  if (!gcsBucket) return false;
  
  try {
    await gcsBucket.file(filePath).delete();
    return true;
  } catch (error) {
    console.error('[GCS] Error deleting file:', error);
    return false;
  }
}

// Upload file from buffer (for server-side uploads)
export async function uploadFromBuffer(
  buffer: Buffer,
  filePath: string,
  contentType: string,
  metadata?: Record<string, string>
) {
  if (!gcsBucket) {
    throw new Error('Google Cloud Storage not configured');
  }

  const file = gcsBucket.file(filePath);
  const stream = file.createWriteStream({
    metadata: {
      contentType,
      metadata,
    },
    resumable: false,
  });

  return new Promise<string>((resolve, reject) => {
    stream.on('error', reject);
    stream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${gcsBucket!.name}/${filePath}`;
      resolve(publicUrl);
    });
    stream.end(buffer);
  });
}