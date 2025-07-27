# Firebase Configuration Backup
**Created**: January 16, 2025
**Status**: WORKING CONFIGURATION - DO NOT DELETE

## Current Working Firebase Configuration

### Firebase Project Details
- **Project Name**: fabletech-studios
- **Project ID**: fabletech-studios
- **Auth Domain**: fabletech-studios.firebaseapp.com
- **Storage Bucket**: fabletech-studios.appspot.com

### Environment Variables Backup
A complete backup of your `.env.local` has been saved to `.env.backup`

### Services Currently Working
✅ **Authentication**
- Customer signup/login via Firebase Auth
- Admin login via NextAuth
- Password reset functionality

✅ **Firestore Database**
- Series and episode data storage
- Customer profiles and credits
- Activity tracking
- Badge system

✅ **Storage** (with local fallback)
- Media file uploads
- Banner image storage
- Thumbnail storage

✅ **Features Confirmed Working**
- Customer registration with 100 free credits
- Credit-based episode unlocking
- Activity tracking and history
- Badge earning and display
- Admin content management
- Media upload and optimization
- Responsive design

### Current Firebase SDK Versions
```json
"firebase": "^11.1.0",
"firebase-admin": "^13.0.1"
```

### Firestore Collections Structure
- `customers` - User profiles, credits, unlocked episodes
- `series` - Series metadata and episodes
- `credit-transactions` - Credit purchase/spend history
- `userActivities` - Activity tracking
- `banners` - Homepage banner configurations

### Security Rules Status
- Basic security rules in place
- Customers can read/write their own data
- Series/episodes publicly readable
- Admin operations through server-side SDK

## Rollback Instructions

If anything breaks after changing API keys:

1. **Restore environment variables**:
   ```bash
   cp .env.backup .env.local
   ```

2. **Restart development server**:
   ```bash
   npm run dev
   ```

3. **Clear browser cache and cookies**

4. **If deployed to Vercel**, revert environment variables in Vercel dashboard

## Testing Checklist Before API Key Change

Before changing the API key, verify these all work:

- [ ] Homepage loads with banner
- [ ] Customer can sign up
- [ ] Customer can log in
- [ ] Customer can unlock episode
- [ ] Admin can access /manage
- [ ] Admin can upload content
- [ ] Badges display correctly
- [ ] Activity tracking works

## Notes

- The exposed API key was: AIzaSyBIZQGc5Vu6ac5rud_lbqOqHTl-jXmE-xw
- This key should be considered compromised
- All test files containing this key have been removed from the repository
- Git history has been cleaned

---

**IMPORTANT**: Keep this backup until the new configuration is confirmed working!