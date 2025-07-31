# Production Testing Procedures

## Pre-Launch Testing Checklist

### 1. Domain & SSL Verification

```bash
# Test DNS resolution
nslookup fabletechstudios.com
dig fabletechstudios.com

# Test SSL certificate
openssl s_client -connect fabletechstudios.com:443 -servername fabletechstudios.com

# Test redirects
curl -I http://fabletechstudios.com
curl -I http://www.fabletechstudios.com
curl -I https://fabletech-studios.vercel.app
```

Expected Results:
- [ ] DNS resolves to Vercel IP (76.76.21.21)
- [ ] SSL certificate valid and not expired
- [ ] HTTP → HTTPS redirect (301)
- [ ] www → non-www redirect (301)
- [ ] Old domain → new domain redirect (301)

### 2. Application Functionality Tests

#### User Authentication
- [ ] Sign up with email
- [ ] Sign in with email
- [ ] Sign in with Google OAuth
- [ ] Password reset flow
- [ ] Session persistence
- [ ] Logout functionality

#### Content Access
- [ ] Browse series without login
- [ ] View series details
- [ ] Preview free episodes
- [ ] Premium content requires login
- [ ] Credit-based unlocking works

#### Media Playback
- [ ] Video playback (multiple browsers)
- [ ] Audio playback
- [ ] Quality switching
- [ ] Fullscreen mode
- [ ] Mobile playback
- [ ] Resume playback position

#### Firebase Integration
- [ ] Large file uploads (>50MB)
- [ ] Firebase Storage access
- [ ] Media streaming from Firebase
- [ ] Thumbnail loading

### 3. Payment Flow Testing

#### Test Purchase Flow
1. **Preparation**
   ```
   Use a real credit card for one small test:
   - Amount: $9.99 (10 credits)
   - Card: Personal card (will refund)
   ```

2. **Purchase Steps**
   - [ ] Navigate to pricing page
   - [ ] Select 10 credit package
   - [ ] Stripe Checkout loads with correct amount
   - [ ] Enter payment details
   - [ ] 3D Secure (if required)
   - [ ] Payment processes successfully
   - [ ] Redirect to success page

3. **Verification**
   - [ ] Check Stripe Dashboard (Live mode)
   - [ ] Verify webhook received in logs
   - [ ] Confirm credits added to account
   - [ ] Check database for transaction record
   - [ ] Verify confirmation email sent

4. **Refund Test**
   - [ ] Process refund in Stripe Dashboard
   - [ ] Verify credits removed from account
   - [ ] Check refund webhook processed

#### Error Scenario Testing
Test with these card numbers in LIVE mode:
- [ ] Insufficient funds (use low-balance card)
- [ ] Invalid card number
- [ ] Expired card
- [ ] Incorrect CVC

### 4. Performance Testing

#### Page Load Times
Target: < 3 seconds on 3G

```javascript
// Test script
const pages = [
  '/',
  '/series',
  '/series/[id]',
  '/pricing',
  '/dashboard'
];

pages.forEach(page => {
  // Measure load time
  // Log Core Web Vitals
});
```

#### Stress Testing
- [ ] Multiple concurrent users
- [ ] Large file uploads simultaneously
- [ ] Rapid navigation between pages
- [ ] Multiple video streams

### 5. Security Testing

#### Authentication Security
- [ ] Protected routes require authentication
- [ ] Admin routes properly secured
- [ ] API endpoints authenticated
- [ ] CORS properly configured

#### Payment Security
- [ ] HTTPS on all payment pages
- [ ] No card details stored locally
- [ ] Webhook signature verification
- [ ] Rate limiting on payment endpoints

### 6. Cross-Browser Testing

Test on:
- [ ] Chrome (Desktop/Mobile)
- [ ] Safari (Desktop/Mobile)
- [ ] Firefox (Desktop)
- [ ] Edge (Desktop)
- [ ] iOS Safari
- [ ] Android Chrome

### 7. Mobile Testing

#### iOS Testing
- [ ] Video playback in Safari
- [ ] Fullscreen mode
- [ ] Screen recording protection
- [ ] Payment flow
- [ ] Touch gestures

#### Android Testing
- [ ] Video playback in Chrome
- [ ] Fullscreen mode
- [ ] Payment flow
- [ ] Various screen sizes

## Production Monitoring Setup

### 1. Real User Monitoring

```javascript
// Add to app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 2. Error Tracking

```bash
# Install Sentry
npm install @sentry/nextjs

# Configure
npx @sentry/wizard -i nextjs
```

### 3. Uptime Monitoring

Services to configure:
- [ ] UptimeRobot (free tier)
- [ ] Vercel Analytics
- [ ] Google Search Console
- [ ] Stripe webhook monitoring

## Post-Launch Verification

### Hour 1
- [ ] Site accessible on custom domain
- [ ] No 500 errors in logs
- [ ] First real payment processed
- [ ] Monitoring tools connected

### Day 1
- [ ] 10+ successful payments
- [ ] < 1% error rate
- [ ] No security alerts
- [ ] Customer support inbox checked

### Week 1
- [ ] 100+ successful payments
- [ ] Uptime > 99.9%
- [ ] Page speed maintained
- [ ] No unresolved customer issues

## Emergency Procedures

### Site Down
1. Check Vercel status page
2. Check DNS propagation
3. Verify SSL certificate
4. Check error logs
5. Contact Vercel support if needed

### Payment Issues
1. Check Stripe status
2. Verify webhook endpoint
3. Check API keys
4. Review error logs
5. Enable test mode if critical

### High Error Rate
1. Check error tracking
2. Identify error pattern
3. Deploy hotfix if needed
4. Monitor resolution
5. Post-mortem analysis

## Testing Documentation

### Test Results Log

| Test Category | Date | Tester | Pass/Fail | Notes |
|--------------|------|---------|-----------|--------|
| DNS/SSL | | | | |
| Authentication | | | | |
| Payment Flow | | | | |
| Performance | | | | |
| Security | | | | |
| Mobile | | | | |

### Issue Tracking

| Issue | Severity | Found Date | Fixed Date | Notes |
|-------|----------|------------|------------|--------|
| | | | | |
| | | | | |

---

Testing Completed: ___________
Approved for Launch: ___________
Launch Date: ___________