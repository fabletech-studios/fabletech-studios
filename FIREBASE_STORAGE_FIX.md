# Firebase Storage Bucket Configuration Fix

## Current Issue
The banner upload is failing with "Storage bucket not found" error. This is because the Firebase Admin SDK needs the correct bucket name format.

## Solution Steps

### 1. Verify Your Storage Bucket Name
Go to [Firebase Console](https://console.firebase.google.com) → Your Project → Storage

The bucket name should be visible at the top, usually in one of these formats:
- `gs://PROJECT-ID.appspot.com`
- `gs://PROJECT-ID.firebasestorage.app`

### 2. Set Environment Variable
Based on your error message, you currently have:
```
FIREBASE_STORAGE_BUCKET=fabletech-studios-897f1.appspot.com
```

The Firebase Admin SDK typically expects one of these formats:

**Option A: appspot.com format (most common)**
```
FIREBASE_STORAGE_BUCKET=fabletech-studios-897f1.appspot.com
```

**Option B: Just the project ID**
```
FIREBASE_STORAGE_BUCKET=fabletech-studios-897f1
```

**Option C: firebasestorage.app format**
```
FIREBASE_STORAGE_BUCKET=fabletech-studios-897f1.firebasestorage.app
```

### 3. Update Your Environment
In Vercel or your deployment platform:
1. Go to Settings → Environment Variables
2. Update `FIREBASE_STORAGE_BUCKET` to use the correct format
3. Redeploy your application

### 4. Verify Firebase Admin Credentials
Ensure these environment variables are also set correctly:
- `FIREBASE_PROJECT_ID` - Your project ID (e.g., `fabletech-studios-897f1`)
- `FIREBASE_CLIENT_EMAIL` - Service account email
- `FIREBASE_PRIVATE_KEY` - Service account private key (with proper line breaks)

### 5. Check Storage Rules
In Firebase Console → Storage → Rules, ensure your service account has access:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 6. Service Account Permissions
Ensure your service account has the following roles:
- Storage Admin
- Storage Object Admin

You can check this in Google Cloud Console → IAM & Admin → IAM.

## Testing
After updating the environment variable:
1. Redeploy your application
2. Visit `/api/test-firebase` to verify the configuration
3. Try uploading a banner again

## Debug Information
The updated code now:
- Tries multiple bucket formats automatically
- Provides detailed error messages
- Logs the exact bucket name being used
- Handles format conversions (.firebasestorage.app → .appspot.com)

## If Still Not Working
1. Check the server logs for the exact error message
2. Verify the bucket actually exists in Firebase Console
3. Try using the test endpoint: GET `/api/test-firebase`
4. Check if the project ID matches exactly (case-sensitive)

## Common Issues
- **Wrong format**: Firebase Admin SDK is picky about bucket format
- **Missing permissions**: Service account needs Storage Admin role
- **Typo in bucket name**: Double-check the project ID
- **Wrong environment**: Make sure you're setting production env vars