# FableTech Studios

A premium multimedia streaming platform built with Next.js 15, TypeScript, and Firebase. FableTech Studios specializes in delivering high-quality audiobook content with a credit-based monetization system.

## Features

### Content Management
- **Series & Episode Management**: Create and manage audiobook series with multiple episodes
- **Media Upload**: Support for video, audio, and thumbnail files with validation
- **Storage Optimization**: Built-in media optimization recommendations and cost analysis
- **Admin Dashboard**: Comprehensive content management interface at `/manage`

### User Experience
- **Credit System**: Users purchase credits to unlock premium episodes
- **Free Episodes**: First episode of each series is free by default
- **Activity Tracking**: Complete user activity history and statistics
- **Badge System**: Gamification with custom-designed achievement badges
- **Responsive Design**: Fully responsive UI optimized for all devices

### Technical Features
- **Firebase Integration**: Authentication, Firestore database, and Storage
- **Real-time Updates**: Live credit balance and activity tracking
- **Progressive Web App**: Installable with offline support
- **SEO Optimized**: Server-side rendering with Next.js
- **Type Safety**: Full TypeScript implementation

## Tech Stack

- **Frontend**: Next.js 15.3.5, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage (with local fallback)
- **Authentication**: Firebase Auth for customers, NextAuth for admins
- **Icons**: Lucide React
- **Media Processing**: Client-side validation and optimization

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project with Firestore and Storage enabled

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fabletech-studios.git
cd fabletech-studios
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with:
```env
# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin (optional, for server-side operations)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
fabletech-studios/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (auth)/           # Authentication pages
│   ├── manage/           # Admin dashboard
│   └── ...               # Other pages
├── components/            # React components
│   ├── badges/           # Badge system components
│   └── ...               # Other components
├── contexts/             # React contexts
├── lib/                  # Utility functions and services
│   ├── firebase/         # Firebase services
│   └── ...               # Other utilities
├── public/               # Static assets
└── styles/               # Global styles
```

## Key Features Explained

### Credit System
- Users start with 100 free credits
- Credits are used to unlock episodes
- Credit packages available for purchase
- Real-time balance updates

### Badge System
- **First Listen**: Unlock your first episode
- **Binge Master**: Unlock 5 episodes in one day
- **Supporter**: Purchase 500+ credits
- **VIP Listener**: Purchase 1000+ credits
- **Completionist**: Complete 3 series
- **Early Adopter**: Join during beta period

### Admin Features
- Upload and manage series/episodes
- Banner management system
- Storage analytics dashboard
- Media optimization tools
- Bulk upload support

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Firebase Setup

1. Create a Firebase project
2. Enable Authentication, Firestore, and Storage
3. Add Firebase config to environment variables
4. Set up Firestore security rules
5. Configure Storage CORS if needed

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support, email support@fabletechstudios.com or open an issue in this repository.

---

Built with ❤️ by FableTech Studios