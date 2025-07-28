# URGENT: Firebase Admin SDK Credentials Missing

## Problem
The banner upload is failing with "Storage bucket not found" error because the Firebase Admin SDK credentials are not configured in Vercel.

## Root Cause
From the test endpoint and local testing:
- ✅ `FIREBASE_STORAGE_BUCKET` is correctly set to `fabletech-studios-897f1.firebasestorage.app`
- ❌ `FIREBASE_CLIENT_EMAIL` is missing
- ❌ `FIREBASE_PRIVATE_KEY` is missing

Without these credentials, Firebase Admin SDK cannot authenticate and access the storage bucket.

## Solution Required

### 1. Get Service Account Credentials
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `fabletech-studios-897f1`
3. Go to **Project Settings** (gear icon)
4. Navigate to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file

### 2. Add to Vercel Environment Variables
Go to your [Vercel Dashboard](https://vercel.com/) → Project Settings → Environment Variables

Add these three variables from the service account JSON:

```
FIREBASE_PROJECT_ID=fabletech-studios-897f1
FIREBASE_CLIENT_EMAIL=[from JSON: "client_email" field]
FIREBASE_PRIVATE_KEY=[from JSON: "private_key" field - include the full key with \n]
```

**Important for FIREBASE_PRIVATE_KEY:**
- Copy the entire value including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep all the `\n` characters as they are
- Vercel will handle the newlines correctly

### 3. Verify Variables Are Set
After adding, ensure all these show as configured:
- ✅ FIREBASE_PROJECT_ID
- ✅ FIREBASE_CLIENT_EMAIL  
- ✅ FIREBASE_PRIVATE_KEY
- ✅ FIREBASE_STORAGE_BUCKET (already set)

### 4. Redeploy
Trigger a new deployment for the changes to take effect.

## Test After Deployment
Visit: `https://fabletech-studios.vercel.app/api/test-firebase`

You should see:
```json
{
  "success": true,
  "bucket": "fabletech-studios-897f1.firebasestorage.app",
  "services": {
    "adminStorage": "initialized"
  }
}
```

## Why This Is Critical
Without these credentials:
- Firebase Admin SDK cannot initialize
- Storage operations will fail
- The error message is misleading (says "bucket not found" when it's actually "not authenticated")

The code is correct and will work once these credentials are added.