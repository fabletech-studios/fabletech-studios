# FableTech Studios - Production Deployment Guide

## 🚀 Quick Start Deployment

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy to Vercel
vercel

# 3. Follow the prompts and configure environment variables
```

## 📋 Pre-Deployment Checklist

### ✅ Code Preparation (Completed)
- [x] Removed hardcoded localhost references
- [x] Updated to use environment variables
- [x] Cleaned up console.logs
- [x] Created vercel.json configuration
- [x] Updated package.json scripts
- [x] Created Firebase security rules

### 🔐 Environment Variables Required

See `VERCEL_ENV_VARS.md` for the complete list. Key variables:
- Firebase configuration (6 variables)
- Stripe keys (3 variables)
- Admin credentials (2 variables)
- App URL and NextAuth settings

## 📦 Step-by-Step Deployment

### 1. Initial Vercel Setup

```bash
# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Answer the prompts:
# - Set up and deploy: Y
# - Which scope: Select your account
# - Link to existing project: N
# - Project name: fabletech-studios
# - Directory: ./
# - Override settings: N
```

### 2. Configure Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add all variables from `VERCEL_ENV_VARS.md`
5. Important: Set them for Production environment

### 3. Update Firebase Configuration

#### Add Vercel Domain to Firebase
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Authentication → Settings → Authorized domains
3. Add your Vercel domains:
   - `your-app.vercel.app`
   - `*.vercel.app` (for preview deployments)
   - Your custom domain (if applicable)

#### Deploy Security Rules
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules
firebase deploy --only firestore:rules,storage:rules
```

### 4. Configure Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Add endpoint:
   - URL: `https://your-app.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`
3. Copy the webhook secret
4. Add to Vercel env vars as `STRIPE_WEBHOOK_SECRET`

### 5. Deploy to Production

```bash
# Deploy to production
vercel --prod

# Or push to main branch for automatic deployment
git push origin main
```

## 🔍 Post-Deployment Verification

### 1. Test Customer Flow
- [ ] Visit production URL
- [ ] Sign up as new customer
- [ ] Verify email functionality
- [ ] Browse content
- [ ] Test video/audio playback
- [ ] Purchase credits (use test card: 4242...)
- [ ] Unlock an episode
- [ ] Check purchase history

### 2. Test Admin Functions
- [ ] Login at `/admin/login`
- [ ] Upload new content
- [ ] Edit series metadata
- [ ] View analytics

### 3. Performance Checks
- [ ] Run Lighthouse audit
- [ ] Test on mobile devices
- [ ] Check global CDN performance
- [ ] Verify media streaming quality

## 🛠 Troubleshooting

### Common Issues

#### "Failed to load Stripe.js"
- This is expected if Stripe.js is blocked
- The hybrid solution handles this automatically

#### Firebase Auth Domain Error
- Add Vercel domain to Firebase authorized domains
- Clear browser cache and cookies

#### Media Files Not Loading
- Check Storage CORS configuration
- Verify Firebase Storage rules are deployed

#### 500 Errors on API Routes
- Check Vercel function logs
- Verify all env variables are set
- Check Firebase Admin SDK initialization

### Debugging Commands

```bash
# View production logs
vercel logs

# Check deployment status
vercel ls

# Rollback if needed
vercel rollback
```

## 🌐 Custom Domain Setup

1. In Vercel Dashboard → Settings → Domains
2. Add your domain (e.g., `fabletech.com`)
3. Update DNS records as instructed
4. Update environment variables:
   - `NEXT_PUBLIC_APP_URL=https://fabletech.com`
   - `NEXTAUTH_URL=https://fabletech.com`
5. Redeploy for changes to take effect

## 📊 Monitoring & Analytics

### Vercel Analytics
- Enable in project settings
- Monitor performance metrics
- Track Core Web Vitals

### Firebase Monitoring
- Use Firebase Console for:
  - Authentication metrics
  - Firestore usage
  - Storage bandwidth

### Stripe Dashboard
- Monitor payment success rate
- Track revenue metrics
- Review failed payments

## 🔄 Continuous Deployment

### GitHub Integration
1. Connect GitHub repo in Vercel
2. Enable automatic deployments
3. Configure:
   - Production Branch: `main`
   - Preview Branches: All other branches

### Deployment Workflow
```bash
# Development
git checkout -b feature/new-feature
# Make changes
git push origin feature/new-feature
# Creates preview deployment

# Production
git checkout main
git merge feature/new-feature
git push origin main
# Automatically deploys to production
```

## 🚨 Production Checklist

### Before Going Live
- [ ] Switch Stripe to live mode
- [ ] Update Stripe webhook for live events
- [ ] Enable Firebase App Check
- [ ] Set up error monitoring (Sentry)
- [ ] Configure backup strategy
- [ ] Review and tighten security rules
- [ ] Set up SSL certificate (automatic with Vercel)
- [ ] Test payment flow with real card

### After Going Live
- [ ] Monitor error logs closely
- [ ] Check performance metrics
- [ ] Verify webhook deliveries
- [ ] Monitor Firebase quotas
- [ ] Set up alerts for failures

## 📞 Support Resources

- **Vercel Support**: https://vercel.com/support
- **Firebase Support**: https://firebase.google.com/support
- **Stripe Support**: https://support.stripe.com
- **Next.js Docs**: https://nextjs.org/docs

## 🎉 Congratulations!

Your audiobook platform is now live and ready for customers. Remember to:
- Monitor logs and metrics regularly
- Keep dependencies updated
- Implement user feedback
- Scale resources as needed

Good luck with your launch! 🚀
