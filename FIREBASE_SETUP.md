# Firebase Setup Guide for FableTech Studios

This guide will help you set up Firebase for your production audiobook platform.

## Prerequisites

1. A Google account
2. A Firebase project (create one at https://console.firebase.google.com)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Name it "fabletech-studios" (or your preferred name)
4. Enable Google Analytics (optional)

## Step 2: Enable Services

### Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable "Email/Password" sign-in method
4. (Optional) Enable other providers like Google, Facebook, etc.

### Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose production mode
4. Select your preferred region (choose closest to your users)
5. Click "Enable"

### Storage
1. Go to "Storage"
2. Click "Get started"
3. Choose production mode
4. Select same region as Firestore
5. Update rules for authenticated uploads:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /videos/{seriesId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    match /audio/{seriesId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    match /thumbnails/{seriesId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

## Step 3: Get Configuration Keys

### Web App Configuration
1. In Firebase Console, click the gear icon → "Project settings"
2. Scroll down to "Your apps"
3. Click "Add app" → Web icon
4. Register app with nickname "FableTech Web"
5. Copy the configuration object

### Service Account (for Admin SDK)
1. In Project settings → "Service accounts" tab
2. Click "Generate new private key"
3. Save the JSON file securely (don't commit to git!)

## Step 4: Configure Environment Variables

Create a `.env.local` file with your Firebase configuration:

```bash
# Firebase Client SDK (Public - safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK (Private - keep secret)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-storage-bucket.appspot.com
```

## Step 5: Set Up Firestore Collections

Run these commands in Firebase Console or use the Admin SDK:

### Collections Structure:

1. **customers**
   - Document ID: User UID
   - Fields: email, name, credits, createdAt, updatedAt, subscription

2. **series**
   - Document ID: Auto-generated
   - Fields: title, description, author, genre, episodeCount, createdAt, updatedAt

3. **episodes**
   - Document ID: Auto-generated
   - Fields: seriesId, episodeNumber, title, videoUrl, audioUrl, credits, isFree

4. **transactions**
   - Document ID: Auto-generated
   - Fields: userId, amount, credits, type, status, createdAt

5. **watchHistory**
   - Document ID: Auto-generated
   - Fields: userId, episodeId, watchedAt, progress

## Step 6: Security Rules

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Customers can read their own data
    match /customers/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && 
        (request.auth.uid == userId || request.auth.token.admin == true);
    }
    
    // Anyone can read series and episodes
    match /series/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    match /episodes/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Users can read their own transactions
    match /transactions/{document} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || request.auth.token.admin == true);
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

## Step 7: Create Admin User

To set up your first admin user:

1. Create a user account through the signup page
2. Run this script to make them admin:

```javascript
// In Firebase Console or a Node.js script
const admin = require('firebase-admin');
admin.initializeApp();

async function makeAdmin(email) {
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { admin: true });
  console.log(`Made ${email} an admin`);
}

makeAdmin('your-admin@email.com');
```

## Step 8: Migration

To migrate existing data:

```bash
# Run migration script (after setting up environment variables)
npm run migrate:firebase
```

## Step 9: Testing

1. Test user registration at `/signup`
2. Test login at `/login`
3. Test file uploads in admin panel
4. Verify files appear in Firebase Storage
5. Check Firestore for created documents

## Production Checklist

- [ ] Enable App Check for additional security
- [ ] Set up Firebase Performance Monitoring
- [ ] Configure Firebase Analytics
- [ ] Set up backup policies for Firestore
- [ ] Enable Cloud Functions for server-side logic
- [ ] Set up monitoring alerts
- [ ] Configure custom domain for Firebase Hosting
- [ ] Enable CDN for Storage files
- [ ] Set up proper CORS policies

## Troubleshooting

### Common Issues:

1. **"Permission denied" errors**
   - Check Firestore/Storage security rules
   - Verify authentication tokens

2. **Upload failures**
   - Check file size limits
   - Verify Storage bucket configuration

3. **Authentication errors**
   - Ensure environment variables are set correctly
   - Check Firebase Auth settings

## Support

For Firebase-specific issues: https://firebase.google.com/support
For FableTech platform issues: Create an issue in the repository