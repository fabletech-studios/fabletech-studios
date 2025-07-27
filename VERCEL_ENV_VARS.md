# Vercel Environment Variables Setup

## Required Environment Variables for Production

Copy these to your Vercel project settings under Settings > Environment Variables.

### Public Environment Variables (Available on Client-Side)

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# Application URL (IMPORTANT: Update this to your Vercel domain)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Feature Flags
NEXT_PUBLIC_MOCK_STRIPE=false
```

### Server-Side Environment Variables (Private)

```bash
# Firebase Admin SDK
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Admin Authentication
ADMIN_EMAIL=admin@fabletech.com
ADMIN_PASSWORD_HASH=$2b$10$gfVeitGUILqsBnqyJDJF.eAJgsekt72.8Vd40O7FSI94hWCOFbkma

# Stripe Secret Keys
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# NextAuth Configuration
NEXTAUTH_SECRET=your_generated_secret_here
NEXTAUTH_URL=https://your-app.vercel.app
```

## How to Set Up in Vercel

1. **Go to your Vercel project dashboard**
2. **Navigate to Settings > Environment Variables**
3. **Add each variable:**
   - Key: The variable name (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`)
   - Value: Your actual value
   - Environment: Select Production (and optionally Preview/Development)

## Important Notes

### 1. Generate NEXTAUTH_SECRET
```bash
# Run this command to generate a secure secret
openssl rand -base64 32
```

### 2. Firebase Private Key Format
- The private key should be entered as a single line with `\n` for line breaks
- In Vercel, paste the entire key including the BEGIN/END markers

### 3. Update NEXT_PUBLIC_APP_URL
- After deployment, update this to your actual Vercel domain
- Format: `https://your-app-name.vercel.app` or your custom domain

### 4. Stripe Configuration
- Use **LIVE** keys for production (starting with `pk_live_` and `sk_live_`)
- Set up webhook endpoint in Stripe Dashboard pointing to:
  `https://your-app.vercel.app/api/stripe/webhook`

### 5. Security Best Practices
- Never commit these values to your repository
- Use different values for development/staging/production
- Rotate secrets regularly
- Monitor access logs in both Firebase and Stripe

## Verification After Deployment

1. **Test Authentication:**
   - Customer signup/login at `/signup` and `/login`
   - Admin login at `/admin/login`

2. **Test Firebase Services:**
   - Upload a test video/audio file
   - Verify storage and playback work

3. **Test Stripe Integration:**
   - Make a test purchase (use test mode first)
   - Verify webhook receives events

4. **Check Application URLs:**
   - Ensure no localhost references appear
   - All API calls work correctly

## Troubleshooting

- **Firebase Auth Errors**: Check domain is added to Firebase Console > Authentication > Settings > Authorized domains
- **Stripe Errors**: Verify webhook secret matches and domain is added to Stripe
- **CORS Issues**: Add your Vercel domain to Firebase Storage CORS configuration
