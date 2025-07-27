# Firebase Storage Upload Troubleshooting Guide

## 🔍 Diagnosing the 500 Error

### 1. Test Firebase Configuration
Visit: `https://fabletech-studios.vercel.app/api/test-firebase`

This will show you:
- Which Firebase services are initialized
- Which environment variables are missing
- The actual storage bucket being used

### 2. Common Issues and Solutions

#### Issue: "Firebase Admin Storage not initialized"
**Cause**: Missing Firebase Admin SDK credentials in Vercel

**Solution**:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key" 
3. Download the JSON file
4. In Vercel Dashboard, add these environment variables:

```env
FIREBASE_PROJECT_ID=fabletech-studios-897f1
FIREBASE_CLIENT_EMAIL=[copy from JSON: "client_email"]
FIREBASE_PRIVATE_KEY=[copy from JSON: "private_key" - KEEP THE \n CHARACTERS!]
FIREBASE_STORAGE_BUCKET=fabletech-studios-897f1.appspot.com
```

**IMPORTANT**: When copying the private key:
- Copy the ENTIRE value including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep all the `\n` characters - they are part of the key!
- In Vercel, paste it exactly as it appears in the JSON

#### Issue: "Invalid key format"
**Cause**: Private key newlines not preserved

**Solution**: 
- Make sure you're copying the private key exactly as it appears in the JSON
- The key should have `\n` characters, not actual line breaks
- Example format:
  ```
  -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n
  ```

#### Issue: "Permission denied" or "Bucket not found"
**Cause**: Storage bucket format mismatch

**Solution**:
1. Check your storage bucket format in Firebase Console
2. Use the `.appspot.com` format, not `.firebasestorage.app`
3. Update in Vercel:
   ```
   FIREBASE_STORAGE_BUCKET=fabletech-studios-897f1.appspot.com
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=fabletech-studios-897f1.appspot.com
   ```

### 3. Quick Fix Checklist

1. **Verify in Vercel Dashboard** (Settings → Environment Variables):
   - [ ] FIREBASE_PROJECT_ID is set
   - [ ] FIREBASE_CLIENT_EMAIL is set
   - [ ] FIREBASE_PRIVATE_KEY is set (with \n characters)
   - [ ] FIREBASE_STORAGE_BUCKET uses .appspot.com format

2. **Redeploy after adding variables**:
   - Vercel needs to rebuild with the new environment variables
   - Go to Deployments → Redeploy

3. **Check Firebase Console**:
   - [ ] Storage rules allow authenticated uploads
   - [ ] Storage bucket exists and is active
   - [ ] Service account has Storage Admin role

### 4. Testing After Fix

1. Visit `/api/test-firebase` - all services should show as initialized
2. Try uploading a banner in the admin panel
3. Check browser console for detailed error messages
4. Check Vercel Function logs for server-side errors

### 5. Emergency Fallback

If Firebase Storage continues to fail, the code now has a fallback:
- In development, it uses local file storage
- This allows testing while Firebase is being configured

### 6. Vercel Function Logs

To see detailed error logs:
1. Go to Vercel Dashboard
2. Navigate to Functions tab
3. Click on `api/series/banner`
4. View recent invocations and error logs

### 7. Manual CORS Application

If uploads work but images don't load:
```bash
# Install gsutil
curl https://sdk.cloud.google.com | bash

# Apply CORS
gsutil cors set cors.json gs://fabletech-studios-897f1.appspot.com
```

## 🚨 Most Common Fix

90% of the time, the issue is missing Firebase Admin SDK credentials in Vercel:

1. Download service account JSON from Firebase
2. Add these 4 environment variables to Vercel:
   - FIREBASE_PROJECT_ID
   - FIREBASE_CLIENT_EMAIL  
   - FIREBASE_PRIVATE_KEY (with \n characters!)
   - FIREBASE_STORAGE_BUCKET
3. Redeploy

The upload should work immediately after redeployment!