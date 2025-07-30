# Fix Firebase Storage CORS Error

## Quick Fix

Run this command to enable CORS on your Firebase Storage bucket:

```bash
gsutil cors set firebase-cors.json gs://fabletech-studios-897f1.firebasestorage.app
```

## If gsutil is not installed:

1. Install Google Cloud SDK:
```bash
curl https://sdk.cloud.google.com | bash
```

2. Restart your terminal

3. Initialize gcloud:
```bash
gcloud init
```

4. Select your project: `fabletech-studios-897f1`

5. Run the CORS command above

## Alternative: Use Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Storage
4. Click on "Rules" tab
5. Update rules to:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null || 
                     request.method == 'POST' && 
                     request.resource.contentType.matches('video/.*|audio/.*|image/.*');
    }
  }
}
```

## Verify CORS is working:

```bash
gsutil cors get gs://fabletech-studios-897f1.firebasestorage.app
```

Should show:
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin", "x-goog-*"]
  }
]
```