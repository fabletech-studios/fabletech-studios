# How to Add Your Real Content to FableTech Studios

## Quick Start

1. **Prepare Your Files**
   - Video files: MP4 format recommended
   - Audio files: MP3 or AAC format
   - Thumbnails: JPG/PNG (1280x720 recommended)

2. **File Organization**
   ```
   public/content/
   └── your-audiobook-series/
       ├── cover.jpg
       ├── episode-1/
       │   ├── video.mp4
       │   ├── audio.mp3
       │   └── thumbnail.jpg
       ├── episode-2/
       │   ├── video.mp4
       │   ├── audio.mp3
       │   └── thumbnail.jpg
       └── ...
   ```

3. **Update the Content Data**

   Edit `/lib/content-data.ts` (create this file):
   ```typescript
   import { Series, Episode } from './data-schema';

   export const SERIES_DATA: Series[] = [
     {
       id: "your-series-id",
       title: "Your Audiobook Title",
       description: "Your series description",
       thumbnail: "/content/your-audiobook-series/cover.jpg",
       author: "Your Name",
       genre: ["Fantasy", "Adventure"],
       totalEpisodes: 10,
       createdAt: new Date(),
       updatedAt: new Date(),
     }
   ];

   export const EPISODES_DATA: Episode[] = [
     {
       id: "ep-001",
       seriesId: "your-series-id",
       episodeNumber: 1,
       title: "Episode 1 Title",
       description: "Episode description",
       videoUrl: "/content/your-audiobook-series/episode-1/video.mp4",
       audioUrl: "/content/your-audiobook-series/episode-1/audio.mp3",
       thumbnailUrl: "/content/your-audiobook-series/episode-1/thumbnail.jpg",
       duration: "45:30",
       credits: 0,  // Free episode
       isFree: true,
       publishedAt: new Date(),
     },
     // Add more episodes...
   ];
   ```

4. **Update Browse Page** to use real data:
   - Import your content data
   - Replace mock data with real episodes

5. **Update Watch Page** to fetch real content:
   - Use the episode ID to find the correct content
   - Load the actual video/audio URLs

## Using External Storage (Recommended for Production)

### Option 1: Cloudinary
1. Sign up at cloudinary.com
2. Upload your videos/audio
3. Use Cloudinary URLs in your content data

### Option 2: AWS S3
1. Create an S3 bucket
2. Upload your content
3. Use S3 URLs (with proper CORS settings)

### Option 3: YouTube/Vimeo
1. Upload as unlisted/private videos
2. Use embed URLs in your player

## Credit System Pricing

Default credit packages:
- 100 credits = $4.99
- 250 credits = $9.99 (+ 50 bonus)
- 500 credits = $19.99 (+ 100 bonus)
- 1000 credits = $39.99 (+ 250 bonus)

Suggested episode pricing:
- First episode: Free (0 credits)
- Regular episodes: 50-100 credits
- Premium/Finale episodes: 150-200 credits

## Next Steps

1. Set up a database (PostgreSQL/MySQL)
2. Add user authentication (NextAuth.js)
3. Integrate payment processing (Stripe)
4. Add admin dashboard for content management
5. Implement proper video streaming (HLS)