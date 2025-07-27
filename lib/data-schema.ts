// Data Schema for FableTech Studios
// This file shows how to structure your real content

export interface Series {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  bannerUrl?: string; // Netflix-style banner image (1920x600)
  author: string;
  genre: string[];
  totalEpisodes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Episode {
  id: string;
  seriesId: string;
  episodeNumber: number;
  title: string;
  description: string;
  videoUrl: string;      // URL to video file (MP4, WebM, etc.)
  audioUrl: string;      // URL to audio file (MP3, AAC, etc.)
  thumbnailUrl: string;  // URL to thumbnail image
  duration: string;      // Format: "MM:SS" or "HH:MM:SS"
  credits: number;       // Cost in credits (0 = free)
  isFree: boolean;
  publishedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  purchasedEpisodes: string[]; // Episode IDs
  createdAt: Date;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'purchase' | 'spend' | 'bonus';
  description: string;
  createdAt: Date;
}

// Example of how to structure your content
export const EXAMPLE_CONTENT = {
  series: {
    id: "fable-chronicles",
    title: "The Fable Chronicles",
    description: "An epic audiobook series with immersive visuals",
    thumbnail: "/content/fable-chronicles/cover.jpg",
    author: "Your Name",
    genre: ["Fantasy", "Adventure"],
    totalEpisodes: 10,
  },
  episodes: [
    {
      id: "fc-ep-001",
      seriesId: "fable-chronicles",
      episodeNumber: 1,
      title: "The Beginning",
      description: "Our hero discovers their destiny...",
      videoUrl: "/content/fable-chronicles/ep1/video.mp4",
      audioUrl: "/content/fable-chronicles/ep1/audio.mp3",
      thumbnailUrl: "/content/fable-chronicles/ep1/thumb.jpg",
      duration: "45:30",
      credits: 0,
      isFree: true,
    },
    {
      id: "fc-ep-002",
      seriesId: "fable-chronicles",
      episodeNumber: 2,
      title: "The Journey Begins",
      description: "Setting out on an adventure...",
      videoUrl: "/content/fable-chronicles/ep2/video.mp4",
      audioUrl: "/content/fable-chronicles/ep2/audio.mp3",
      thumbnailUrl: "/content/fable-chronicles/ep2/thumb.jpg",
      duration: "52:15",
      credits: 50,
      isFree: false,
    },
  ],
};

// File Organization Structure:
/*
public/
└── content/
    └── [series-name]/
        ├── cover.jpg
        └── ep[number]/
            ├── video.mp4
            ├── audio.mp3
            └── thumb.jpg

OR use external storage:
- AWS S3
- Cloudinary
- Bunny CDN
- YouTube (private/unlisted)
- Vimeo Pro
*/