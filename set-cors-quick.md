# Quick CORS Fix for Firebase Storage

## Option 1: Using Firebase Console (Easiest)

The Storage Rules update should have fixed most CORS issues. If you still see CORS errors, try:

1. In Firebase Console, go to Storage
2. Click on the three dots menu (⋮) next to your bucket
3. Select "Bucket details"
4. This will take you to Google Cloud Console
5. Click on "Configuration" tab
6. Click on "Edit CORS configuration"
7. Add this configuration:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["*"],
    "maxAgeSeconds": 3600
  }
]
```

## Option 2: Using Cloud Shell (In Browser)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project: `fabletech-studios-897f1`
3. Click the Cloud Shell icon (>_) in the top right
4. In the terminal that opens, run:

```bash
echo '[{"origin": ["*"],"method": ["GET","HEAD","PUT","POST","DELETE"],"responseHeader": ["*"],"maxAgeSeconds": 3600}]' > cors.json

gsutil cors set cors.json gs://fabletech-studios-897f1.firebasestorage.app

gsutil cors get gs://fabletech-studios-897f1.firebasestorage.app
```

This will set CORS and show you the current configuration.

## Test Upload

After setting CORS, go to `/upload/firebase` and try uploading your 16MB file. It should work now!