# Current State Verification Checklist

**Date**: January 16, 2025
**Purpose**: Document working state before Firebase API key rotation

## Pre-Change Verification

Please verify each of these items is working before changing the API key:

### 1. Public Pages
- [ ] **Homepage** (`/`)
  - [ ] Loads without errors
  - [ ] Banner displays correctly
  - [ ] Navigation works
  - [ ] Browse button functional

### 2. Customer Authentication
- [ ] **Signup** (`/signup`)
  - [ ] Can create new account
  - [ ] Receives 100 free credits
  - [ ] Email verification sent
  
- [ ] **Login** (`/login`)
  - [ ] Can log in with existing account
  - [ ] Credits display in header
  - [ ] Logout button works

- [ ] **Password Reset** (`/forgot-password`)
  - [ ] Can request password reset
  - [ ] Email sent successfully

### 3. Content Browsing
- [ ] **Browse Page** (`/browse`)
  - [ ] Series list loads
  - [ ] Episode information displays
  - [ ] Free episodes marked correctly
  - [ ] Credit costs shown

### 4. Episode Functionality
- [ ] **Episode Playback**
  - [ ] Free episodes play without credits
  - [ ] Premium episodes require credits
  - [ ] Credit deduction works
  - [ ] Media player functions

### 5. User Features
- [ ] **Profile Page** (`/profile`)
  - [ ] User information displays
  - [ ] Activity history shows
  - [ ] Stats are accurate
  - [ ] Badge showcase works
  - [ ] Badge sidebar toggle works

- [ ] **Credit Purchase** (`/credits/purchase`)
  - [ ] Credit packages display
  - [ ] Purchase simulation works
  - [ ] Balance updates

### 6. Badge System
- [ ] **Badge Earning**
  - [ ] First Listen badge awards on first unlock
  - [ ] Badges display in profile
  - [ ] Badge sidebar shows/hides
  - [ ] Badge notifications appear

### 7. Admin Dashboard
- [ ] **Admin Login** (`/admin/login`)
  - [ ] Admin can log in
  - [ ] Redirects to manage page

- [ ] **Content Management** (`/manage`)
  - [ ] Series list loads
  - [ ] Can create new series
  - [ ] Can upload episodes
  - [ ] Media optimization panel works
  - [ ] Storage analytics display

### 8. Technical Checks
- [ ] No console errors on any page
- [ ] Network tab shows successful Firebase calls
- [ ] Local storage has auth tokens
- [ ] Credits update in real-time

## Current Working Endpoints

### Customer APIs
- `POST /api/customer/signup` - ✅ Working
- `POST /api/customer/login` - ✅ Working
- `GET /api/customer/me` - ✅ Working
- `POST /api/customer/unlock-episode` - ✅ Working
- `POST /api/customer/purchase-credits` - ✅ Working

### Content APIs
- `GET /api/content` - ✅ Working
- `GET /api/content/[seriesId]` - ✅ Working
- `POST /api/series/create` - ✅ Working
- `POST /api/content/[seriesId]/episode` - ✅ Working

### Admin APIs
- `GET /api/auth/session` - ✅ Working
- `POST /api/banner/upload` - ✅ Working

## Browser Testing

Test in multiple browsers if possible:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Mobile Responsiveness
- [ ] Homepage responsive
- [ ] Navigation menu works
- [ ] Episode player responsive
- [ ] Profile page readable

## Error Handling
- [ ] 404 page works
- [ ] API errors show user-friendly messages
- [ ] Network offline handling

---

## Post-Change Verification

After changing the API key, run through this entire checklist again to ensure nothing is broken.

### If Issues Occur:
1. Check browser console for errors
2. Verify .env.local has correct new key
3. Restart development server
4. Clear browser cache/cookies
5. If still broken, restore from backup

### Success Criteria:
- All items above still working
- No new console errors
- Firebase connections successful
- User experience unchanged