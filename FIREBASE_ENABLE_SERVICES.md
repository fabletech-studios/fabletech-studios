# Quick Guide: Enable Firebase Services

Based on the error you're seeing, you need to enable the required Firebase services. Here's how:

## 1. Enable Authentication (Email/Password)

The `auth/network-request-failed` error often occurs when Authentication isn't properly enabled.

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **fabletech-studios**
3. In the left sidebar, click **Authentication**
4. If you see "Get started", click it
5. Go to the **Sign-in method** tab
6. Find **Email/Password** in the list
7. Click on it and toggle **Enable** to ON
8. Click **Save**

## 2. Create Firestore Database

1. In the left sidebar, click **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (we'll secure it later)
4. Select your preferred location (choose closest to your users)
5. Click **Enable**

## 3. Enable Storage

1. In the left sidebar, click **Storage**
2. Click **Get started**
3. Choose **Start in test mode** (we'll secure it later)
4. Select same location as Firestore
5. Click **Done**

## 4. Verify Services

After enabling all services, go back to the test page:
- Navigate to http://localhost:3001/firebase-test
- Click "Run All Tests" again

## Common Issues

### Still seeing auth/network-request-failed?

1. **Check Internet Connection**: Ensure you have a stable connection
2. **Check Firebase Status**: Visit https://status.firebase.google.com/
3. **Verify API Key**: Make sure your API key is correct in .env.local
4. **Browser Issues**: Try in incognito mode or different browser
5. **CORS/Firewall**: Check if your network blocks Firebase domains

### Authentication specific errors:

- `auth/operation-not-allowed`: Email/Password not enabled
- `auth/invalid-api-key`: Wrong API key in configuration
- `auth/configuration-not-found`: Firebase project misconfigured

## Expected Results

When everything is properly configured:
- ✅ Firebase Connection: Should show project details
- ✅ Authentication: Creates test user successfully
- ✅ Firestore Database: Writes and reads test data
- ✅ Storage Upload: Uploads test file and returns URL

## Need Help?

1. Check Firebase Console for any warning messages
2. Ensure all services show "Enabled" status
3. Try refreshing the page and running tests again
4. Check browser console for additional error details