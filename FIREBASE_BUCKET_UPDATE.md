# Firebase Storage Bucket Format Update Required

## 🚨 IMMEDIATE ACTION NEEDED

After the Firebase API key rotation, the storage bucket format has changed.

### Current Issue
- **Error**: `Storage bucket fabletech-studios-897f1.appspot.com not found`
- **Reason**: New Firebase projects require `.firebasestorage.app` format

### Fix Instructions

1. **Go to Vercel Dashboard**
   - Navigate to your project settings
   - Click on "Environment Variables"

2. **Update FIREBASE_STORAGE_BUCKET**
   - **FROM**: `fabletech-studios-897f1.appspot.com`
   - **TO**: `fabletech-studios-897f1.firebasestorage.app`

3. **Save and Redeploy**
   - Click "Save" after updating
   - Go to "Deployments" tab
   - Click "Redeploy" on the latest deployment

### Verification
After redeployment, visit:
```
https://fabletech-studios.vercel.app/api/test-firebase
```

You should see:
```json
{
  "success": true,
  "bucket": "fabletech-studios-897f1.firebasestorage.app"
}
```

### Why This Changed
When Firebase API keys are rotated or projects are updated, the storage bucket format requirements can change. Newer Firebase projects use the `.firebasestorage.app` domain instead of the legacy `.appspot.com` domain.

### Timeline
- **Before**: Used `.appspot.com` (legacy format)
- **After API rotation**: Requires `.firebasestorage.app` (new format)
- **Action needed**: Update environment variable NOW

This is a simple configuration change that will fix all upload issues immediately.