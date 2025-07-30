# 4K Video Compression Guide

## Understanding 4K Video Sizes

A typical 4K video at 60fps can be:
- **RAW/ProRes**: 1-5 GB per minute
- **H.264 (High Quality)**: 375 MB per minute
- **H.264 (Optimized)**: 135-200 MB per minute
- **H.265/HEVC**: 65-100 MB per minute

## Compression Tools

### 1. FFmpeg (Free, Command Line)
Best for batch processing and automation.

```bash
# Install FFmpeg
brew install ffmpeg  # macOS
sudo apt install ffmpeg  # Ubuntu

# Basic 4K compression with H.264
ffmpeg -i input_4k.mp4 \
  -c:v libx264 \
  -preset slow \
  -crf 22 \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  output_compressed.mp4

# Aggressive compression for smaller size
ffmpeg -i input_4k.mp4 \
  -c:v libx264 \
  -preset veryslow \
  -crf 28 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  output_small.mp4

# H.265/HEVC for better compression (50% smaller)
ffmpeg -i input_4k.mp4 \
  -c:v libx265 \
  -preset slow \
  -crf 28 \
  -c:a aac -b:a 128k \
  -tag:v hvc1 \
  output_hevc.mp4
```

### 2. HandBrake (Free, GUI)
User-friendly interface for video compression.

Settings for 4K compression:
- **Format**: MP4
- **Video Codec**: H.265 (x265) or H.264
- **Framerate**: Same as source
- **Constant Quality**: 22-28 (lower = better quality)
- **Encoder Preset**: Slow or Slower
- **Audio**: AAC, 160-192 kbps

### 3. Adobe Media Encoder (Paid)
Professional tool with presets.

Recommended settings:
- **Format**: H.264
- **Preset**: YouTube 4K
- **Bitrate**: VBR, 2 pass
- **Target**: 35-45 Mbps
- **Maximum**: 60 Mbps

## Optimized Settings for Different Scenarios

### Episode 1 (Free, High Quality)
Keep highest quality for the free episode:
```bash
ffmpeg -i episode1_4k.mp4 \
  -c:v libx264 -preset slow -crf 20 \
  -c:a aac -b:a 256k \
  -movflags +faststart \
  episode1_premium.mp4
```
Expected size: ~300-400 MB per 10 minutes

### Regular Episodes (Balanced)
Good quality with reasonable size:
```bash
ffmpeg -i episode_4k.mp4 \
  -c:v libx264 -preset slow -crf 24 \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  episode_balanced.mp4
```
Expected size: ~200-250 MB per 10 minutes

### Mobile-Optimized Version
Create additional lower resolution versions:
```bash
# 1080p version
ffmpeg -i episode_4k.mp4 \
  -vf "scale=1920:1080" \
  -c:v libx264 -preset slow -crf 23 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  episode_1080p.mp4

# 720p version
ffmpeg -i episode_4k.mp4 \
  -vf "scale=1280:720" \
  -c:v libx264 -preset slow -crf 23 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  episode_720p.mp4
```

## Advanced Techniques

### Two-Pass Encoding
For best quality at specific file size:
```bash
# First pass
ffmpeg -i input_4k.mp4 -c:v libx264 -b:v 20M -pass 1 -f null /dev/null

# Second pass
ffmpeg -i input_4k.mp4 -c:v libx264 -b:v 20M -pass 2 output.mp4
```

### Hardware Acceleration
Use GPU for faster encoding:
```bash
# NVIDIA GPU
ffmpeg -hwaccel cuda -i input_4k.mp4 \
  -c:v h264_nvenc -preset slow -crf 23 \
  output_gpu.mp4

# Apple Silicon
ffmpeg -i input_4k.mp4 \
  -c:v h264_videotoolbox -b:v 20M \
  output_apple.mp4
```

## File Size Calculation

To achieve specific file size:
```
Bitrate (Mbps) = (File Size in MB × 8) / (Duration in seconds)
```

Example for 500MB, 20-minute video:
- Bitrate = (500 × 8) / (20 × 60) = 3.33 Mbps
- Use 3 Mbps video + 0.3 Mbps audio

## Quality Comparison

| CRF Value | Quality | File Size (10 min 4K) |
|-----------|---------|----------------------|
| 18 | Visually lossless | 500-700 MB |
| 22 | High quality | 250-400 MB |
| 26 | Good quality | 150-250 MB |
| 30 | Acceptable | 100-150 MB |

## Recommendations for FableTech

1. **Use H.265/HEVC** for 50% better compression
2. **Create multiple versions**:
   - 4K for premium users
   - 1080p for standard viewing
   - 720p for mobile
3. **Implement adaptive streaming** (HLS/DASH)
4. **Consider professional encoding services** like AWS MediaConvert or Coconut.co

## Testing Your Compression

Always test on multiple devices:
- Large TV/Monitor (quality check)
- Mobile phone (bandwidth check)
- Tablet (balance check)

Watch for:
- Banding in gradients
- Blockiness in dark scenes
- Motion blur in fast scenes
- Audio sync issues