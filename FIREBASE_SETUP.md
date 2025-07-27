# Firebase Production Setup Guide

## 🔥 Critical Firebase Configuration for Production

### 1. Firebase Console Setup

#### Authentication Configuration
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `fabletech-studios-897f1`
3. Navigate to **Authentication → Settings → Authorized domains**
4. Add these domains:
   - `fabletech-studios.vercel.app`
   - `*.vercel.app` (for preview deployments)
   - Your custom domain (if you have one)

#### Enable Authentication Methods
1. Go to **Authentication → Sign-in method**
2. Enable **Email/Password** authentication
3. Make sure it's properly configured

### 2. Storage Configuration

#### Apply CORS Settings
Run this command in your terminal (requires `gsutil` from Google Cloud SDK):
```bash
gsutil cors set cors.json gs://fabletech-studios-897f1.appspot.com
```

Or if using the new storage bucket format:
```bash
gsutil cors set cors.json gs://fabletech-studios-897f1.firebasestorage.app
```

#### Deploy Storage Rules
```bash
firebase deploy --only storage:rules
```

### 3. Firestore Configuration

#### Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 4. Environment Variables for Production

You need to set these in Vercel Dashboard:

#### Client-side Variables (Already Set)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC8aI9mag8gHl7I3ENuhCo5MjZyJMSzSew
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=fabletech-studios-897f1.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=fabletech-studios-897f1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=fabletech-studios-897f1.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1003218112393
NEXT_PUBLIC_FIREBASE_APP_ID=1:1003218112393:web:883443ef79614180e7db58
```

#### Server-side Variables (REQUIRED - Currently Missing!)
To get these:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract these values and add to Vercel:

```env
FIREBASE_PROJECT_ID=fabletech-studios-897f1
FIREBASE_CLIENT_EMAIL=[from JSON file: client_email field]
FIREBASE_PRIVATE_KEY=[from JSON file: private_key field - keep the \n characters]
FIREBASE_STORAGE_BUCKET=fabletech-studios-897f1.appspot.com
```

### 5. Storage Bucket Format Issue

There's a mismatch in your storage bucket configuration:
- Current: `fabletech-studios-897f1.firebasestorage.app`
- Expected: `fabletech-studios-897f1.appspot.com`

**Fix**: Update `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` in Vercel to use `.appspot.com` format.

### 6. API Key Restrictions

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services → Credentials**
3. Find your API key
4. Under **Application restrictions**, select **HTTP referrers**
5. Add these referrers:
   - `https://fabletech-studios.vercel.app/*`
   - `https://*.vercel.app/*`
   - `http://localhost:3000/*` (for development)

### 7. Quick Test Commands

After setup, test your configuration:

```bash
# Test authentication
curl -X POST https://fabletech-studios.vercel.app/api/customer/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Test storage (requires authentication token)
# First login to get a token, then test upload
```

### 8. Common Issues and Solutions

#### "requests-from-referer-<empty>-are-blocked" Error
- Add your domain to Firebase Authentication authorized domains
- Check API key restrictions in Google Cloud Console
- Ensure auth domain matches your Firebase project

#### Storage Upload Failures
- Verify CORS configuration is applied
- Check storage rules allow authenticated writes
- Ensure Admin SDK credentials are configured
- Verify storage bucket format matches

#### Authentication Token Issues
- Make sure Firebase Admin SDK is initialized with proper credentials
- Check that FIREBASE_PRIVATE_KEY preserves newline characters
- Verify service account has necessary permissions

### 9. Firebase CLI Setup (Optional)

If you need to deploy rules from your local machine:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Deploy rules
firebase deploy --only firestore:rules,storage:rules
```

### 10. Monitoring

- Check Firebase Console → Authentication for user signups
- Monitor Storage usage in Firebase Console → Storage
- View Firestore data in Firebase Console → Firestore Database
- Check Functions logs (if using) in Firebase Console → Functions

## 🚨 Critical Action Items

1. **Add Admin SDK credentials to Vercel** (This is why uploads are failing!)
2. **Fix storage bucket format** in environment variables
3. **Apply CORS configuration** to storage bucket
4. **Verify authorized domains** in Firebase Authentication

Once these are configured, both authentication and storage should work properly in production.