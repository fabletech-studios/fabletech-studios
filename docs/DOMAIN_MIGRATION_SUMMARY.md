# FableTech.Studio Domain Migration Summary

## 🎯 Migration Overview
Migrating from `fabletech-studios.vercel.app` to `fabletech.studio`

## ✅ Completed Preparations

### 1. Environment Configuration
- Created `.env.production.fabletech.studio` with all updated variables
- Updated admin email to admin@fabletech.studio
- Configured support emails (support@, billing@, hello@)

### 2. Migration Scripts Created
- **migrate-to-fabletech-studio.ts** - Updates all configuration files
- **migrate-admin-email.ts** - Updates admin email in Firebase
- **verify-domain-readiness.ts** - Checks if domain is ready

### 3. Documentation
- **BUSINESS_EMAIL_SETUP.md** - Complete IONOS email setup guide
- **FABLETECH_STUDIO_TESTING.md** - Production testing checklist
- **Email templates** with new domain references

### 4. Application Updates
- CORS configuration for new domain
- Security headers updated
- Monitoring dashboard supports multiple domains
- Redirect rules configured in vercel.json

## 🚀 Quick Start Commands

```bash
# 1. Run migration script (once SSL is active)
npx tsx scripts/migrate-to-fabletech-studio.ts

# 2. Verify domain readiness
npx tsx scripts/verify-domain-readiness.ts

# 3. Migrate admin email (after Firebase auth update)
npx tsx scripts/migrate-admin-email.ts
```

## 📋 Manual Steps Required

### 1. Vercel Dashboard
```
Environment Variables to Update:
- NEXT_PUBLIC_APP_URL = https://fabletech.studio
- NEXTAUTH_URL = https://fabletech.studio
- ADMIN_EMAIL = admin@fabletech.studio
```

### 2. Firebase Console
```
Authentication → Settings → Authorized domains:
- Add: fabletech.studio
- Add: www.fabletech.studio
```

### 3. Google Cloud Console
```
APIs & Services → Credentials → OAuth 2.0 Client:
- Add: https://fabletech.studio/api/auth/callback/google
- Add: https://www.fabletech.studio/api/auth/callback/google
```

### 4. Stripe Dashboard
```
Developers → Webhooks → Add endpoint:
- URL: https://fabletech.studio/api/webhooks/stripe
- Events: checkout.session.completed, payment_intent.succeeded
- Copy new webhook secret to Vercel
```

### 5. IONOS Email Setup
```
Create these email accounts:
- admin@fabletech.studio
- support@fabletech.studio
- billing@fabletech.studio
- hello@fabletech.studio
```

## 🔍 Current Status

### DNS Configuration
- A Record: Points to 76.76.21.21 ✅
- WWW: Forwards to non-www ✅
- Status: **Propagating** ⏳

### SSL Certificate
- Provider: Vercel (Let's Encrypt)
- Status: **Pending** ⏳
- Expected: Within 24 hours

### Application Readiness
- Configuration files: **Ready** ✅
- Migration scripts: **Ready** ✅
- Testing checklist: **Ready** ✅
- Documentation: **Complete** ✅

## 🎬 Next Steps (Once SSL Active)

1. **Run Domain Verification**
   ```bash
   npx tsx scripts/verify-domain-readiness.ts
   ```

2. **Update Vercel Environment Variables**
   - Copy from `.env.production.fabletech.studio`
   - Deploy changes

3. **Run Migration Script**
   ```bash
   npx tsx scripts/migrate-to-fabletech-studio.ts
   ```

4. **Update External Services**
   - Firebase authorized domains
   - Google OAuth redirect URIs
   - Stripe webhook endpoint

5. **Test Everything**
   - Follow FABLETECH_STUDIO_TESTING.md checklist
   - Test payments with small amount
   - Verify all redirects work

## 📊 Success Metrics

- [ ] fabletech.studio loads with valid SSL
- [ ] All redirects working (www, old domain)
- [ ] Admin can login with new email
- [ ] Payments process successfully
- [ ] Emails send from new domain
- [ ] No errors in monitoring dashboard

## 🆘 Support Resources

- **Domain Issues**: IONOS Support - 1-866-991-2631
- **SSL/Vercel**: https://vercel.com/support
- **Firebase**: https://firebase.google.com/support
- **Stripe**: Dashboard → Support

## 🎉 Ready for Launch!

Everything is prepared for the domain migration. Once SSL is active (check with `verify-domain-readiness.ts`), follow the steps above to complete the migration.

---

Prepared: [Current Date]
Domain: fabletech.studio
Status: Awaiting SSL Activation