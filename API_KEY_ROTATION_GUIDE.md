# Firebase API Key Rotation Guide

## Current Backup Status ✅

1. **Environment Variables**: Backed up to `.env.backup`
2. **Configuration Documentation**: Saved in `FIREBASE_CONFIG_BACKUP.md`
3. **Working State Checklist**: Created in `CURRENT_STATE_VERIFICATION.md`
4. **Current Working Key**: Documented (but compromised)

## Step-by-Step Key Rotation Process

### 1. Generate New API Key in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **fabletech-studios**
3. Click the gear icon → **Project settings**
4. Under **General** tab, find **Web API Key**
5. Click **Regenerate key** (or create new web app if needed)
6. Copy the new API key

### 2. Update Local Environment

1. Open `.env.local` in your editor
2. Replace the old API key:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-new-api-key-here
   ```
3. Save the file

### 3. Restart Development Server

```bash
# Stop current server (Ctrl+C)
# Start fresh
npm run dev
```

### 4. Clear Browser Data

1. Open Developer Tools (F12)
2. Go to Application tab
3. Clear:
   - Local Storage
   - Session Storage
   - Cookies
4. Hard refresh (Ctrl+Shift+R)

### 5. Test Critical Functions

Run through the verification checklist:
1. Try to sign up as new customer
2. Try to log in
3. Check if episodes load
4. Verify admin login works

### 6. Update Vercel (if deployed)

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Update `NEXT_PUBLIC_FIREBASE_API_KEY`
5. Redeploy

### 7. Update Authorized Domains

In Firebase Console:
1. Authentication → Settings → Authorized domains
2. Ensure these are listed:
   - localhost
   - Your Vercel domain
   - Your custom domain (if any)

## Troubleshooting

### If login stops working:
1. Check browser console for errors
2. Verify the new API key is correct
3. Check Firebase Console for any restrictions
4. Ensure authorized domains are set

### If you need to rollback:
```bash
# Restore original environment
cp .env.backup .env.local

# Restart server
npm run dev
```

### Common Issues:

**"Invalid API key"**
- Double-check you copied the entire key
- No extra spaces or quotes
- Correct environment variable name

**"Permission denied"**
- Check Firebase project settings
- Verify API key has correct permissions
- Check authorized domains

**"Firebase not initialized"**
- Clear all browser storage
- Hard refresh
- Check .env.local is saved
- Restart dev server

## Final Steps

Once everything is working with the new key:

1. ✅ Test all major features
2. ✅ Update Vercel environment
3. ✅ Document the change date
4. ✅ Keep backup for 1 week minimum
5. ❌ Never commit the new key to git

## Security Reminders

- The old key (AIzaSyBIZQGc5Vu6ac5rud_lbqOqHTl-jXmE-xw) is compromised
- Monitor Firebase usage for any suspicious activity
- Consider enabling Firebase App Check for additional security
- Set up billing alerts in Firebase Console

---

Remember: Take your time, test thoroughly, and keep the backup until you're 100% confident everything works!