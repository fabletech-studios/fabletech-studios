# 🚨 URGENT: Deploy Firestore Security Rules

## ⚠️ Your Firestore database will stop working in 2 days!

Firebase has sent you a warning that your Firestore database is currently in **test mode** (completely open to the internet) and will automatically **stop accepting requests in 2 days**.

## ✅ What I've Done

1. **Created proper security rules** for Firestore (`firestore.rules`)
2. **Updated storage security rules** (`storage.rules`)
3. **Created deployment script** (`deploy-firestore-rules.sh`)
4. **Set up Firebase configuration** (`firebase.json`)

## 🚀 What You Need to Do NOW

### Option 1: Deploy Using Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Deploy the rules**:
   ```bash
   firebase deploy --only firestore:rules,storage:rules --project fabletech-studios-secure
   ```

### Option 2: Deploy Using the Script

1. **Run the deployment script**:
   ```bash
   ./deploy-firestore-rules.sh
   ```

2. Enter your project ID when prompted: `fabletech-studios-secure`

3. Confirm deployment when asked

### Option 3: Manual Deploy via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **FableTech Studios Secure**
3. Go to **Firestore Database** → **Rules** tab
4. Copy the entire contents of `firestore.rules` file
5. Paste it in the rules editor
6. Click **Publish**
7. Go to **Storage** → **Rules** tab
8. Copy the entire contents of `storage.rules` file
9. Paste it in the rules editor
10. Click **Publish**

## 📋 What These Rules Do

### Firestore Rules:
- ✅ **Customers** can only access their own data
- ✅ **Series/Episodes** are publicly readable but only authenticated users can modify
- ✅ **Analytics** data is write-only for users, read-only for admins
- ✅ **Credit transactions** are protected from tampering
- ✅ Prevents users from giving themselves free credits

### Storage Rules:
- ✅ **Media files** are publicly viewable but require auth to upload
- ✅ **File size limits** enforced (5GB for videos, 500MB for audio)
- ✅ **Content type validation** (only allows proper media types)
- ✅ **User uploads** are private to each user

## ⏰ Timeline

- **NOW**: Deploy the rules immediately
- **In 2 days**: If not deployed, your app will stop working completely
- **After deployment**: Rules take effect immediately

## 🔍 Verify Deployment

After deploying, verify in Firebase Console:
1. Go to Firestore → Rules
2. You should see "Last published: [today's date]"
3. The rules should start with `rules_version = '2';`

## ❓ Need Help?

If you encounter any issues:
1. Make sure you're logged into the correct Firebase account
2. Verify the project ID is `fabletech-studios-secure`
3. Check that you have owner/editor permissions on the project

## 🎯 Summary

**This is critical** - your database will stop working in 2 days if you don't deploy these rules. The rules are ready and tested. You just need to deploy them using one of the methods above.

The easiest way is Option 1 using the Firebase CLI command provided above.