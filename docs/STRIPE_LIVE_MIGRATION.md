# Stripe Live Mode Migration Checklist

## Pre-Migration Requirements

### Business Verification
- [ ] Company information submitted
- [ ] Business type selected (LLC, Corporation, etc.)
- [ ] EIN/Tax ID provided
- [ ] Business address verified
- [ ] Business website added (will be fabletechstudios.com)

### Identity Verification
- [ ] Primary account owner verified
- [ ] Government ID uploaded
- [ ] SSN/Personal tax ID provided (if required)
- [ ] Beneficial ownership information complete

### Banking Information
- [ ] Bank account added
- [ ] Micro-deposits verified (2-3 business days)
- [ ] Account holder name matches business name
- [ ] Routing and account numbers confirmed

### Platform Requirements
- [ ] Terms of Service URL: https://fabletechstudios.com/terms
- [ ] Privacy Policy URL: https://fabletechstudios.com/privacy
- [ ] Refund Policy documented
- [ ] Customer support email configured

## Migration Steps

### Step 1: Stripe Dashboard Preparation

1. **Access Live Mode**
   ```
   - Log into Stripe Dashboard
   - Toggle switch from "Test" to "Live" (top right)
   - Confirm you want to activate live mode
   ```

2. **Generate Live API Keys**
   ```
   Dashboard → Developers → API keys
   
   Copy and save securely:
   - Publishable key: pk_live_...
   - Secret key: sk_live_...
   ```

3. **Configure Products (Live Mode)**
   ```
   Dashboard → Products → Create
   
   Credit Packages:
   - 10 Credits: $9.99
   - 25 Credits: $19.99
   - 50 Credits: $34.99
   - 100 Credits: $59.99
   ```

### Step 2: Webhook Configuration

1. **Create Live Webhook Endpoint**
   ```
   Dashboard → Developers → Webhooks → Add endpoint
   
   Endpoint URL: https://fabletechstudios.com/api/webhooks/stripe
   
   Events to listen for:
   ✓ checkout.session.completed
   ✓ payment_intent.succeeded
   ✓ payment_intent.payment_failed
   ✓ charge.succeeded
   ✓ charge.failed
   ✓ customer.created
   ✓ customer.updated
   ```

2. **Copy Webhook Signing Secret**
   ```
   After creation, click on the webhook
   Copy signing secret: whsec_...
   ```

### Step 3: Environment Variables Update

1. **Vercel Dashboard Updates**
   ```bash
   # Remove or rename test keys
   STRIPE_TEST_PUBLISHABLE_KEY=pk_test_... (optional backup)
   STRIPE_TEST_SECRET_KEY=sk_test_... (optional backup)
   
   # Add live keys
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_... (new live webhook secret)
   
   # Update app URL
   NEXT_PUBLIC_APP_URL=https://fabletechstudios.com
   NEXTAUTH_URL=https://fabletechstudios.com
   ```

2. **Deploy Changes**
   ```
   - Save environment variables
   - Trigger new deployment in Vercel
   - Wait for deployment to complete
   ```

### Step 4: Code Updates

1. **Update Stripe Initialization**
   ```typescript
   // lib/stripe/client.ts
   import { loadStripe } from '@stripe/stripe-js';
   
   const stripePromise = loadStripe(
     process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
   );
   
   export default stripePromise;
   ```

2. **Update Server-Side Stripe**
   ```typescript
   // lib/stripe/server.ts
   import Stripe from 'stripe';
   
   export const stripe = new Stripe(
     process.env.STRIPE_SECRET_KEY!,
     {
       apiVersion: '2024-11-20.acacia',
       typescript: true,
     }
   );
   ```

### Step 5: Testing Live Payments

1. **Test Transaction Flow**
   ```
   Test with REAL credit card (small amount):
   
   1. Create test account
   2. Purchase 10 credits ($9.99)
   3. Verify:
      - Payment succeeds
      - Webhook received
      - Credits added to account
      - Email confirmation sent
   4. Check Stripe Dashboard for transaction
   5. Issue refund after verification
   ```

2. **Test Error Scenarios**
   ```
   Test cards for live mode:
   - Insufficient funds: Use card with low balance
   - Invalid CVC: Enter wrong CVC
   - Expired card: Use expired card
   
   Verify:
   - Error messages display correctly
   - No credits added on failure
   - Failed attempts logged
   ```

## Post-Migration Verification

### Financial Checks
- [ ] Payments appear in Stripe Dashboard (Live)
- [ ] Payouts scheduled correctly
- [ ] Tax settings configured
- [ ] Invoice settings updated

### Technical Checks
- [ ] Webhooks delivering successfully
- [ ] No test mode transactions accepted
- [ ] SSL certificate valid on payment pages
- [ ] Mobile payments working

### Customer Experience
- [ ] Payment flow smooth
- [ ] Confirmation emails sent
- [ ] Credits instantly available
- [ ] Refund process documented

## Monitoring Setup

### Stripe Dashboard Alerts
1. Go to Settings → Team and security → Notifications
2. Enable notifications for:
   - [ ] Failed payments
   - [ ] Disputes
   - [ ] Unusual activity
   - [ ] Payout failures

### Custom Monitoring
```typescript
// lib/monitoring/stripe-monitor.ts
export async function monitorPayments() {
  // Check payment success rate
  // Alert if below threshold
  // Log failed payments for review
}
```

## Rollback Plan

If issues arise:

1. **Immediate Rollback**
   ```bash
   # In Vercel, revert to test keys:
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   
   # Redeploy immediately
   ```

2. **Communication**
   ```
   - Post status update on site
   - Email affected customers
   - Process manual refunds if needed
   ```

## Legal Compliance

### Required Policies
- [ ] Terms of Service updated with:
  - Payment processing terms
  - Subscription terms
  - Refund policy
  - Dispute resolution

- [ ] Privacy Policy updated with:
  - Payment data handling
  - Third-party processors (Stripe)
  - Data retention policies

### Customer Support
- [ ] Support email: support@fabletechstudios.com
- [ ] Response time: 24-48 hours
- [ ] Refund process: Within 7 days
- [ ] Dispute handling procedure

## Final Checklist

### Before Going Live
- [ ] All test transactions completed
- [ ] Webhook endpoint verified
- [ ] SSL certificate active
- [ ] Legal policies published
- [ ] Support contact available

### Day 1 Monitoring
- [ ] First live payment successful
- [ ] Webhook logs checked
- [ ] No error alerts
- [ ] Customer credits applied
- [ ] Payout schedule confirmed

### Week 1 Review
- [ ] Payment success rate > 95%
- [ ] No unresolved disputes
- [ ] Customer feedback positive
- [ ] Financial reconciliation complete

---

Migration Date: ___________
Migrated By: ___________
Verified By: ___________
Live Mode Active: [ ] Yes [ ] No