# FableTech Studios - Security Documentation

## 🔒 Security Overview

This document outlines the security measures implemented in FableTech Studios and provides guidelines for maintaining platform security.

## Critical Security Features

### 1. Authentication & Authorization

#### Firebase Authentication
- **Primary Auth**: Firebase Auth with email/password and Google OAuth
- **Token Verification**: All tokens verified server-side using Firebase Admin SDK
- **Session Management**: Secure session cookies with httpOnly flag
- **Password Requirements**: Minimum 6 characters (Firebase enforced)

#### Admin Authentication
- **Admin Emails**: Configured via `ADMIN_EMAILS` environment variable
- **No Default Credentials**: Production requires configured admin credentials
- **Role-Based Access**: Admin role verified through Firebase custom claims

### 2. Password Reset Security

#### Token-Based System
- **Secure Tokens**: 32-byte cryptographically random tokens
- **Expiration**: 1-hour token validity
- **Single Use**: Tokens marked as used after successful reset
- **Rate Limiting**: 3 attempts per email per hour
- **Email Verification**: Shows email being reset for user confirmation

#### Implementation Details
```typescript
// Token generation
const resetToken = crypto.randomBytes(32).toString('hex');

// Rate limiting
checkRateLimit(rateLimitKey, 3, 60 * 60 * 1000);
```

### 3. API Security

#### Rate Limiting
- Password reset: 3 attempts/hour per IP+email
- Login attempts: 5 attempts/15 minutes (planned)
- API endpoints: Request throttling (planned)

#### CORS Configuration
- **Production**: Restricted to `https://www.fabletech.studio`
- **Development**: Limited to `http://localhost:3000`
- **Credentials**: Enabled for authenticated requests

### 4. Data Protection

#### Environment Variables
Required in production:
```env
# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Admin Access
ADMIN_EMAILS=email1@domain.com,email2@domain.com
ADMIN_EMAIL=admin@fabletech.studio
ADMIN_PASSWORD=[hashed_password]

# Email Service
EMAIL_HOST=smtp.ionos.com
EMAIL_PORT=587
EMAIL_USER=admin@fabletech.studio
EMAIL_PASSWORD=[secure_password]

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# NextAuth
NEXTAUTH_SECRET=[random_32_char_string]
NEXTAUTH_URL=https://www.fabletech.studio
```

#### Database Security
- **Firestore Rules**: Strict user isolation
- **Admin Operations**: Server-side only via Admin SDK
- **Sensitive Data**: Never stored in client-accessible collections

### 5. Payment Security

#### Stripe Integration
- **Webhook Verification**: Signature validation on all webhooks
- **No Card Storage**: PCI compliance through Stripe
- **Metadata Validation**: User ID and package verification
- **Idempotency**: Transaction recording prevents duplicates

### 6. Content Security Policy

Comprehensive CSP headers:
- Script sources restricted to trusted domains
- Style sources limited to self and inline
- Frame ancestors denied (clickjacking protection)
- Mixed content blocked

### 7. Email Security

#### IONOS SMTP
- **Authentication**: Required for all email sending
- **Rate Limiting**: Built into email service
- **Template Injection**: Protected against XSS
- **Password Reset**: Secure token-based flow

## Security Best Practices

### For Developers

1. **Never commit sensitive data**
   - Use `.env.local` for local development
   - Configure production secrets in Vercel

2. **Token Handling**
   - Always verify tokens server-side
   - Never trust client-provided user IDs
   - Use Firebase Admin SDK for verification

3. **Input Validation**
   - Sanitize all user inputs
   - Validate data types and formats
   - Use parameterized queries

4. **Error Handling**
   - Never expose internal errors to users
   - Log errors server-side only
   - Return generic error messages

### For Deployment

1. **Environment Setup**
   ```bash
   # Verify all required environment variables
   npm run check-env
   ```

2. **Security Headers**
   - Strict-Transport-Security enabled
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff

3. **HTTPS Only**
   - All production traffic over HTTPS
   - Secure cookies with sameSite attribute

## Security Audit Checklist

### Monthly Reviews
- [ ] Review admin access logs
- [ ] Check for unusual activity patterns
- [ ] Verify all environment variables are set
- [ ] Review failed login attempts
- [ ] Check rate limiting effectiveness

### Quarterly Reviews
- [ ] Rotate API keys and secrets
- [ ] Update dependencies for security patches
- [ ] Review and update Firestore rules
- [ ] Audit third-party integrations
- [ ] Penetration testing (if applicable)

## Incident Response

### If Security Breach Detected

1. **Immediate Actions**
   - Revoke affected tokens/sessions
   - Reset compromised credentials
   - Enable maintenance mode if needed

2. **Investigation**
   - Review access logs
   - Identify attack vector
   - Assess data exposure

3. **Remediation**
   - Patch vulnerabilities
   - Update security measures
   - Notify affected users (if required)

4. **Post-Incident**
   - Document lessons learned
   - Update security procedures
   - Implement additional monitoring

## Security Contacts

- **Primary**: admin@fabletech.studio
- **Firebase Issues**: Check Firebase Console
- **Stripe Issues**: Stripe Dashboard → Support
- **Vercel/Hosting**: Vercel Dashboard → Support

## Compliance

### GDPR Considerations
- User data deletion on request
- Data portability features
- Privacy policy compliance
- Cookie consent (if applicable)

### PCI Compliance
- No credit card data stored
- All payments through Stripe
- Secure transmission only

## Recent Security Updates

### Latest Changes (As of deployment)
1. ✅ Removed insecure token verification fallback
2. ✅ Admin emails moved to environment variables
3. ✅ Removed weak default passwords
4. ✅ CORS restricted to specific origins
5. ✅ Rate limiting on password reset
6. ✅ Token validation on password reset page

## Security Tools & Monitoring

### Recommended Tools
- **Monitoring**: Vercel Analytics
- **Error Tracking**: Console logs in production
- **Security Scanning**: npm audit
- **Dependency Updates**: Dependabot

### Regular Commands
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update

# Check outdated packages
npm outdated
```

## Future Security Enhancements

### Planned Improvements
1. Implement Redis-based rate limiting
2. Add 2FA for admin accounts
3. Implement session timeout warnings
4. Add security event logging
5. Implement automated security testing
6. Add Content Security Policy reporting

## Security Reporting

If you discover a security vulnerability, please email admin@fabletech.studio with:
- Description of the issue
- Steps to reproduce
- Potential impact
- Suggested remediation

We aim to respond within 48 hours and provide updates on remediation progress.

---

**Last Updated**: Current Deployment
**Review Schedule**: Monthly
**Next Review**: 30 days from deployment