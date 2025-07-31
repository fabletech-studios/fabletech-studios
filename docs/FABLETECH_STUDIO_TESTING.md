# FableTech.Studio Production Testing Checklist

## Pre-Launch Verification

### 1. Domain & SSL Status
```bash
# Run verification script
npx tsx scripts/verify-domain-readiness.ts
```

Expected results:
- [ ] DNS resolves to 76.76.21.21
- [ ] SSL certificate active
- [ ] HTTPS accessible
- [ ] HTTP redirects to HTTPS

### 2. Environment Configuration

#### Vercel Dashboard Updates
- [ ] NEXT_PUBLIC_APP_URL = https://fabletech.studio
- [ ] NEXTAUTH_URL = https://fabletech.studio
- [ ] ADMIN_EMAIL = admin@fabletech.studio

#### Firebase Console Updates
- [ ] Add fabletech.studio to authorized domains
- [ ] Add www.fabletech.studio to authorized domains

#### Google OAuth Updates
- [ ] Add https://fabletech.studio/api/auth/callback/google
- [ ] Add https://www.fabletech.studio/api/auth/callback/google

#### Stripe Webhook Update
- [ ] Create new webhook: https://fabletech.studio/api/webhooks/stripe
- [ ] Copy new webhook secret
- [ ] Update STRIPE_WEBHOOK_SECRET in Vercel

### 3. Functional Testing

#### Authentication Flow
- [ ] Admin login with admin@fabletech.studio
- [ ] Customer registration
- [ ] Google OAuth login
- [ ] Password reset flow
- [ ] Session persistence

#### Payment Testing
- [ ] Access pricing page
- [ ] Select credit package
- [ ] Complete test payment
- [ ] Verify webhook received
- [ ] Check credits added
- [ ] Verify email sent

#### Content Access
- [ ] Browse series catalog
- [ ] View series details
- [ ] Play free episode
- [ ] Unlock premium episode
- [ ] Video streaming works
- [ ] Audio playback works

#### Admin Functions
- [ ] Access /manage dashboard
- [ ] Create new series
- [ ] Upload episode (<45MB)
- [ ] Upload episode (>45MB via Firebase)
- [ ] Access monitoring dashboard
- [ ] View Firebase diagnostics

### 4. Cross-Domain Testing

#### Redirects
- [ ] fabletech-studios.vercel.app → fabletech.studio
- [ ] www.fabletech.studio → fabletech.studio
- [ ] Old bookmarks redirect properly

#### API Endpoints
```bash
# Test key endpoints
curl https://fabletech.studio/api/health
curl https://fabletech.studio/api/content
```

### 5. Email Configuration

#### Business Emails (IONOS)
- [ ] admin@fabletech.studio configured
- [ ] support@fabletech.studio configured
- [ ] billing@fabletech.studio configured
- [ ] hello@fabletech.studio configured

#### Email Testing
- [ ] Send test email from each address
- [ ] Verify SPF record active
- [ ] Test forwarding rules
- [ ] Check email signatures

### 6. Mobile Testing

#### iOS Safari
- [ ] Site loads correctly
- [ ] Video playback works
- [ ] Fullscreen functions
- [ ] Payment flow completes
- [ ] Screen recording protection active

#### Android Chrome
- [ ] Site loads correctly
- [ ] Video playback works
- [ ] Payment flow completes
- [ ] Responsive design correct

### 7. Performance Verification

#### Page Load Times
- [ ] Homepage < 3s
- [ ] Series page < 3s
- [ ] Video start < 5s

#### SSL/Security
- [ ] SSL Labs score A or better
- [ ] Security headers present
- [ ] CORS properly configured

### 8. Production Monitoring

#### Monitoring Dashboard
- [ ] Access /admin/monitoring
- [ ] All services show "healthy"
- [ ] Payment metrics loading
- [ ] Error tracking active

#### External Monitoring
- [ ] Set up UptimeRobot for fabletech.studio
- [ ] Configure downtime alerts
- [ ] Test alert delivery

## Launch Day Checklist

### Hour 0 (Go Live)
- [ ] Deploy to production
- [ ] Verify site accessible
- [ ] Test critical paths
- [ ] Monitor error logs

### Hour 1
- [ ] First real payment processed
- [ ] Check webhook logs
- [ ] Verify email delivery
- [ ] Review monitoring dashboard

### Hour 4
- [ ] Check error rate
- [ ] Review performance metrics
- [ ] Respond to any issues
- [ ] Update status page if needed

### Day 1 Review
- [ ] Total payments processed
- [ ] Error rate < 1%
- [ ] Average response time
- [ ] Customer feedback review

## Rollback Plan

If critical issues occur:

1. **Immediate Actions**
   - Revert Vercel deployment
   - Switch back to test Stripe keys
   - Post status update

2. **Communication**
   - Email affected users
   - Update social media
   - Process refunds if needed

3. **Recovery**
   - Fix identified issues
   - Test thoroughly
   - Schedule new launch

## Success Criteria

- [ ] 100% uptime first 24 hours
- [ ] < 1% error rate
- [ ] All payments processed successfully
- [ ] No critical security issues
- [ ] Positive user feedback

---

Testing Date: ___________
Tested By: ___________
Launch Approved: [ ] Yes [ ] No
Launch Date/Time: ___________