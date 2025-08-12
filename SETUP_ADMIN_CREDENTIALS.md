# Setting Up Firebase Admin SDK Credentials

To set admin roles and use server-side Firebase features, we need to set up Firebase Admin SDK credentials.

## Steps to Get Service Account Credentials:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `fabletech-studios-897f1`

2. **Generate Service Account Key**
   - Click the gear icon ⚙️ next to "Project Overview"
   - Select "Project settings"
   - Go to "Service accounts" tab
   - Click "Generate new private key"
   - Click "Generate key" in the popup
   - A JSON file will download

3. **Extract Required Values from the JSON file**
   Open the downloaded JSON file and find these values:
   - `project_id` → FIREBASE_PROJECT_ID
   - `client_email` → FIREBASE_CLIENT_EMAIL  
   - `private_key` → FIREBASE_PRIVATE_KEY

4. **Add to .env.local**
   Add these lines to your `.env.local` file:
   ```
   FIREBASE_PROJECT_ID=fabletech-studios-897f1
   FIREBASE_CLIENT_EMAIL=[value from JSON]
   FIREBASE_PRIVATE_KEY="[value from JSON - keep the quotes and \n characters]"
   ```

   **Important:** The private key should be wrapped in double quotes and keep all the `\n` characters as they are.

5. **Restart the Dev Server**
   After adding the credentials, restart the development server:
   ```bash
   npm run dev
   ```

## Alternative: Using Firebase CLI

If you prefer, you can also get the service account through Firebase CLI:

```bash
firebase projects:list
firebase use fabletech-studios-897f1
# Then follow the Firebase Console steps above
```

## Security Note
⚠️ **NEVER commit the service account credentials to git!**
The `.env.local` file is already in `.gitignore` to protect these secrets.

## Testing Admin Setup
Once you've added the credentials, we can test by running:
```bash
./SET_ADMIN.sh
```

And entering the email address you want to make admin (like `omvec.performance@gmail.com` or whichever account you use).