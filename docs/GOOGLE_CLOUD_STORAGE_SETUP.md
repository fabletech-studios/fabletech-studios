# Google Cloud Storage Setup for 4K Video Hosting

## Overview
This guide helps you set up Google Cloud Storage (GCS) for hosting large 4K videos with optimal streaming performance.

## Benefits
- **No file size limits** - Upload videos of any size
- **Direct browser uploads** - Bypass Vercel's server entirely
- **Adaptive bitrate streaming** - Automatic quality adjustment
- **Global CDN** - Fast delivery worldwide
- **Cost-effective** - Pay only for storage and bandwidth used

## Setup Steps

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable billing (required for storage)

### 2. Create Storage Bucket
```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash

# Create bucket
gsutil mb -p YOUR_PROJECT_ID -c STANDARD -l US-CENTRAL1 gs://fabletech-videos

# Enable uniform bucket-level access
gsutil uniformbucketlevelaccess set on gs://fabletech-videos

# Set CORS for web uploads
echo '[{"origin": ["*"], "method": ["GET", "POST", "PUT"], "maxAgeSeconds": 3600}]' > cors.json
gsutil cors set cors.json gs://fabletech-videos
```

### 3. Set Up Service Account
1. Go to IAM & Admin > Service Accounts
2. Create service account with roles:
   - Storage Object Admin
   - Storage Transfer Agent
3. Create and download JSON key
4. Add to `.env.local`:
```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_BUCKET=fabletech-videos
GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account",...}'
```

### 4. Enable CDN (Optional but Recommended)
```bash
# Create backend bucket
gcloud compute backend-buckets create fabletech-cdn-backend \
    --gcs-bucket-name=fabletech-videos

# Create URL map
gcloud compute url-maps create fabletech-cdn \
    --default-backend-bucket=fabletech-cdn-backend

# Create HTTP(S) proxy
gcloud compute target-https-proxies create fabletech-https-proxy \
    --url-map=fabletech-cdn

# Reserve IP address
gcloud compute addresses create fabletech-ip --global
```

## Video Optimization for 4K

### Recommended Encoding Settings
```bash
# Using FFmpeg for 4K optimization
ffmpeg -i input_4k.mp4 \
  -c:v libx264 \
  -preset slow \
  -crf 22 \
  -c:a aac \
  -b:a 192k \
  -movflags +faststart \
  -pix_fmt yuv420p \
  -vf "scale=3840:2160" \
  output_4k_optimized.mp4
```

### Multi-Resolution Encoding (HLS)
For adaptive streaming, create multiple resolutions:
```bash
# Create HLS variants
ffmpeg -i input_4k.mp4 \
  -filter_complex "[0:v]split=4[v1][v2][v3][v4]; \
  [v1]scale=w=1280:h=720[v1out]; \
  [v2]scale=w=1920:h=1080[v2out]; \
  [v3]scale=w=2560:h=1440[v3out]; \
  [v4]scale=w=3840:h=2160[v4out]" \
  -map "[v1out]" -c:v:0 libx264 -b:v:0 2M \
  -map "[v2out]" -c:v:1 libx264 -b:v:1 5M \
  -map "[v3out]" -c:v:2 libx264 -b:v:2 8M \
  -map "[v4out]" -c:v:3 libx264 -b:v:3 12M \
  -map a:0 -c:a aac -b:a 128k \
  -f hls -hls_time 10 -hls_playlist_type vod \
  -hls_segment_filename "segment_%v_%03d.ts" \
  -master_pl_name "master.m3u8" \
  -var_stream_map "v:0,a:0 v:1,a:0 v:2,a:0 v:3,a:0" stream_%v.m3u8
```

## Implementation in Your App

### Direct Upload Component
See `/components/upload/DirectGoogleUpload.tsx` for implementation.

### Streaming Player
The video player will automatically use the Google Cloud Storage URLs for streaming.

## Cost Estimation
- **Storage**: $0.02/GB/month (Standard)
- **Bandwidth**: $0.08-$0.12/GB (varies by region)
- **Operations**: $0.005 per 10,000 operations

Example for 10 4K videos (5GB each):
- Storage: 50GB × $0.02 = $1/month
- Bandwidth (1000 views): 5TB × $0.08 = $400/month

## Security Best Practices
1. Use signed URLs for temporary access
2. Implement rate limiting
3. Set up lifecycle rules to delete old videos
4. Monitor usage with Cloud Monitoring
5. Use VPC Service Controls for additional security