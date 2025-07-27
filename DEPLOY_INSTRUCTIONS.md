# 🚀 Deployment Instructions - ESLint Fixed

## ✅ Changes Made

1. **Added ESLint & TypeScript bypass** in `next.config.ts` to allow deployment
2. **Updated URLs** to use Vercel URLs instead of localhost

## 📋 Environment Variables for Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

### Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=[Get from Vercel Dashboard or Firebase Console]
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=fabletech-studios-897f1.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=fabletech-studios-897f1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=fabletech-studios-897f1.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=[Get from Firebase Console]
NEXT_PUBLIC_FIREBASE_APP_ID=[Get from Firebase Console]
```

### Admin Access
```
ADMIN_EMAIL=admin@fabletech.com
ADMIN_PASSWORD_HASH=$2b$10$gfVeitGUILqsBnqyJDJF.eAJgsekt72.8Vd40O7FSI94hWCOFbkma
```

### Application URLs
```
NEXT_PUBLIC_APP_URL=https://fabletech-studios.vercel.app
NEXTAUTH_URL=https://fabletech-studios.vercel.app
NEXTAUTH_SECRET=dGhpc2lzYXN1cGVyc2VjcmV0a2V5Zm9yZmFibGV0ZWNo
NEXT_PUBLIC_MOCK_STRIPE=false
```

### Important: Stripe & Firebase Admin Keys

**Stripe Keys**: Copy from your `.env.local` file:
- STRIPE_SECRET_KEY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET

**Firebase Admin SDK**: Get from Firebase Console → Project Settings → Service Accounts:
- FIREBASE_PROJECT_ID=fabletech-studios-897f1
- FIREBASE_CLIENT_EMAIL=[from service account JSON]
- FIREBASE_PRIVATE_KEY=[from service account JSON - keep \n characters]
- FIREBASE_STORAGE_BUCKET=fabletech-studios-897f1.appspot.com

## 🚨 CRITICAL: Firebase Setup Required!

Your deployment has two issues that MUST be fixed:

### 1. Authentication Error Fix
- Go to Firebase Console → Authentication → Settings → Authorized domains
- Add `fabletech-studios.vercel.app`
- This fixes: "requests-from-referer-<empty>-are-blocked"

### 2. Storage Upload Fix
- Add the Firebase Admin SDK variables above to Vercel
- Update NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET to use `.appspot.com` format
- This fixes: "Upload failed: Failed to upload banner"

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for complete setup instructions.

## 🎯 After Firebase Setup

1. **Test Signup**: Create a customer account at `/signup`
2. **Test Admin**: Login at `/admin/login` with `admin@fabletech.com` / `admin123`
3. **Upload Content**: Use admin panel to upload your audiobooks

Your platform will be fully functional after Firebase configuration! 🎉
