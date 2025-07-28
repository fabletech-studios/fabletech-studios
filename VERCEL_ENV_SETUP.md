# Vercel Environment Variables Setup

## Required Firebase Admin SDK Variables

Please ensure these environment variables are set in your Vercel project settings:

### 1. Go to Vercel Dashboard
- Navigate to your project
- Go to Settings → Environment Variables

### 2. Add/Update these variables:

```
FIREBASE_PROJECT_ID=fabletech-studios-897f1
FIREBASE_CLIENT_EMAIL=[your-service-account-email]
FIREBASE_PRIVATE_KEY=[your-service-account-private-key]
FIREBASE_STORAGE_BUCKET=fabletech-studios-897f1.firebasestorage.app
```

### Important Notes:

1. **FIREBASE_STORAGE_BUCKET Format**:
   - For newer projects: `projectId.firebasestorage.app`
   - For older projects: `projectId.appspot.com`
   - Check your Firebase Console → Storage to see the exact bucket name

2. **FIREBASE_PRIVATE_KEY**:
   - Must include the full key with BEGIN/END markers
   - Preserve line breaks (Vercel will handle them)

3. **Apply to all environments**:
   - Production
   - Preview
   - Development

### 3. Redeploy after updating

After updating environment variables, you need to trigger a new deployment for changes to take effect.

### Debugging Storage Bucket Issues

If you're getting "bucket not found" errors:

1. Check Firebase Console → Storage
2. Look for the bucket URL at the top (e.g., `gs://fabletech-studios-897f1.firebasestorage.app`)
3. Use the part after `gs://` as your FIREBASE_STORAGE_BUCKET value

### Test Endpoint

Visit `/api/test-firebase` after deployment to verify Firebase is initialized correctly.