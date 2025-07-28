# Fix Firebase Storage CORS for Banner Images

## Problem
Banner images are uploaded successfully but cannot be displayed due to CORS restrictions on Firebase Storage.

## Solution
Apply CORS configuration to your Firebase Storage bucket.

### Option 1: Using gsutil (Recommended)

1. Install Google Cloud SDK if you haven't already:
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. Authenticate with your Google account:
   ```bash
   gcloud auth login
   ```

3. Apply the CORS configuration:
   ```bash
   gsutil cors set firebase-cors.json gs://fabletech-studios-897f1.firebasestorage.app
   ```

### Option 2: Using Firebase Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `fabletech-studios-897f1`
3. Navigate to **Cloud Storage** → **Buckets**
4. Find your bucket: `fabletech-studios-897f1.firebasestorage.app`
5. Click on the bucket
6. Go to **Configuration** tab
7. Click **Edit CORS**
8. Add this configuration:
   ```json
   [
     {
       "origin": ["*"],
       "method": ["GET", "HEAD"],
       "maxAgeSeconds": 3600
     }
   ]
   ```
9. Save

### Option 3: Quick Terminal Command (if gsutil is installed)

Run this single command:
```bash
echo '[{"origin": ["*"], "method": ["GET", "HEAD"], "maxAgeSeconds": 3600}]' | gsutil cors set /dev/stdin gs://fabletech-studios-897f1.firebasestorage.app
```

## Verification
After applying CORS, the banner images should load immediately. No redeployment needed.

Test by:
1. Refreshing the banner test page
2. The banner image should now display correctly

## Why This Happens
Firebase Storage buckets have CORS disabled by default for security. When your web app tries to load images from a different domain (storage.googleapis.com), the browser blocks it unless CORS headers are present.