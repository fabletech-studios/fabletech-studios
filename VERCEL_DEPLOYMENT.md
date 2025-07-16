# Vercel Deployment Guide

## Prerequisites

1. GitHub repository set up with your code
2. Vercel account (free tier works)
3. Firebase project configured

## Deployment Steps

### 1. Import Project to Vercel

1. Go to [Vercel](https://vercel.com)
2. Click "New Project"
3. Import your `fabletech-studios` repository from GitHub
4. Vercel will auto-detect Next.js

### 2. Configure Build Settings

Vercel should auto-detect these, but verify:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (or leave as default)
- **Output Directory**: `.next` (or leave as default)
- **Install Command**: `npm install` (or leave as default)

### 3. Environment Variables

Add all environment variables from your `.env.local` file:

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-vercel-app.vercel.app

# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin Configuration (if using server-side Firebase)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key
```

**Important Notes:**
- For `NEXTAUTH_URL`, use your Vercel deployment URL
- For `FIREBASE_PRIVATE_KEY`, ensure you paste the entire key including `\n` characters
- You may need to wrap the private key in quotes

### 4. Firebase Configuration

Update Firebase to allow your Vercel domain:

1. **Authentication**:
   - Go to Firebase Console → Authentication → Settings
   - Add your Vercel domains to Authorized domains:
     - `your-app.vercel.app`
     - `your-custom-domain.com` (if using custom domain)

2. **Firestore Rules** (if not already set):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow authenticated users to read/write their own data
       match /customers/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Allow anyone to read series/episodes
       match /series/{document=**} {
         allow read: if true;
         allow write: if false; // Admin only through server
       }
       
       // Other collections...
     }
   }
   ```

3. **Storage CORS** (if using Firebase Storage):
   Create `cors.json`:
   ```json
   [
     {
       "origin": ["https://your-app.vercel.app", "http://localhost:3000"],
       "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
       "maxAgeSeconds": 3600
     }
   ]
   ```
   
   Apply with:
   ```bash
   gsutil cors set cors.json gs://your-storage-bucket
   ```

### 5. Deploy

1. Click "Deploy" in Vercel
2. Wait for build to complete (usually 2-5 minutes)
3. Visit your deployment URL

### 6. Post-Deployment

1. **Test Authentication**:
   - Try signing up as a new customer
   - Test login/logout
   - Verify Firebase connection

2. **Test Content**:
   - Access `/manage` with admin credentials
   - Upload test content
   - Verify media playback

3. **Custom Domain** (optional):
   - Go to Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed
   - Update `NEXTAUTH_URL` environment variable
   - Add domain to Firebase authorized domains

## Troubleshooting

### Build Errors

If build fails:
1. Check build logs for specific errors
2. Ensure all dependencies are in `package.json`
3. Verify environment variables are set correctly

### Authentication Issues

If auth doesn't work:
1. Verify `NEXTAUTH_URL` matches your deployment URL
2. Check Firebase authorized domains
3. Ensure `NEXTAUTH_SECRET` is set

### Firebase Connection Issues

If Firebase doesn't connect:
1. Check all Firebase environment variables
2. Verify service account credentials (for admin SDK)
3. Check Firestore rules allow access

### Media Upload Issues

If uploads fail:
1. Check Firebase Storage rules
2. Verify CORS configuration
3. Check file size limits

## Performance Optimization

1. Enable Vercel Analytics (free tier available)
2. Use Vercel Image Optimization
3. Enable ISR (Incremental Static Regeneration) where appropriate
4. Monitor Core Web Vitals

## Continuous Deployment

Once set up, Vercel automatically deploys:
- Production: When you push to `main` branch
- Preview: For pull requests

To disable auto-deploy:
1. Go to Settings → Git
2. Disable "Auto-deploy"

---

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Support](https://vercel.com/support)