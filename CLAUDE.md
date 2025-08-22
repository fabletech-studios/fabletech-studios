# FableTech Studios - Development Guide

## Project Overview
FableTech Studios is a Next.js 13+ application with TypeScript, featuring:
- Audiobook streaming platform
- Contest system for story submissions
- Credit-based monetization
- Firebase Authentication & Firestore
- Stripe payment integration
- Email automation with IONOS

## Key Commands

### Development
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript type checking (if available)
```

### Testing & Verification
Always run these commands after making significant changes:
```bash
npm run lint       # Check for linting errors
npm run build      # Verify build succeeds
```

## Email Configuration

### Setup Requirements
Add these to `.env.local`:
```env
EMAIL_HOST=smtp.ionos.com
EMAIL_PORT=587
EMAIL_USER=admin@fabletech.studio
EMAIL_PASSWORD=your_ionos_password_here
EMAIL_FROM_NAME=FableTech Studios
```

### Testing Emails
1. Navigate to `/email-test` when logged in as admin
2. Select email type (Welcome, Password Reset, or Purchase)
3. Enter recipient email and admin password
4. Send test email to verify configuration

### Email Types
- **Welcome Email**: Sent to new users with 100 free credits
- **Password Reset**: Sent when users request password reset
- **Purchase Confirmation**: Sent after successful credit purchases

## Contest System

### Key Features
- Multiple votes per submission allowed (commercial purpose)
- Server-side voting with Firebase Admin SDK
- IP-based view tracking (one per day)
- Comprehensive terms and conditions at `/contest-terms`

### API Endpoints
- `/api/contests/vote` - Handle voting (requires auth)
- `/api/contests/author-submissions` - Get user's submissions
- `/api/contests/track-view` - Track story views
- `/api/contests/get-story` - Fetch story details

## Authentication Pattern
All contest-related API endpoints use this auth pattern:
```typescript
const authHeader = request.headers.get('authorization');
if (authHeader?.startsWith('Bearer ')) {
  const token = authHeader.substring(7);
  const decodedToken = await adminAuth.verifyIdToken(token);
  const userEmail = decodedToken.email;
}
```

## Firebase Rules
Current Firestore security rules restrict direct client access. All operations go through server-side API routes using Admin SDK.

## Story View Page Features

### Reading Controls
- **Font Sizes**: Small, Medium, Large (stored in localStorage)
- **Background Themes**: Dark, Light, Sepia, Gray, Night Blue
- **Floating Settings Button**: Bottom-right corner for easy access
- **Mobile Optimized**: Touch-friendly controls and responsive layout

### View Tracking
- IP-based deduplication (one view per IP per day)
- Automatic tracking on story load
- Stored in `storyViews` collection

## Mobile Optimizations

### Browse Page
- Series separators reduced height on mobile
- Episode cards stack vertically on small screens
- Full-width thumbnails for better visibility
- Touch-optimized button sizes

### Contest Page
- Responsive prize cards
- Mobile-friendly voting interface
- Optimized header animations

## Deployment Notes

### Environment Variables Required
- Firebase Admin SDK credentials
- Stripe API keys
- Email configuration (IONOS)
- NextAuth secret

### Pre-deployment Checklist
1. Run `npm run build` to verify build
2. Check all environment variables are set
3. Test email functionality
4. Verify Stripe webhooks are configured
5. Ensure Firebase security rules are updated

## Future Enhancements (Planned)

### Multi-Contest Support
Architecture considerations:
- Separate collections for each contest
- Contest metadata in `contests` collection
- Dynamic routing for contest pages
- Admin interface for contest management

## Common Issues & Solutions

### Email Not Sending
1. Check EMAIL_PASSWORD is set in .env.local
2. Verify IONOS credentials are correct
3. Check server console for detailed errors
4. Use /email-test page to debug

### Firebase Permission Errors
- All operations should use Admin SDK through API routes
- Never use client-side Firebase operations for protected resources

### Voting Issues
- Ensure user is authenticated
- Check Bearer token is included in requests
- Verify contest is in active voting phase

## Development Best Practices
1. Always use server-side API routes for Firebase operations
2. Include proper error handling and logging
3. Test on mobile devices regularly
4. Run lint and build before committing
5. Document API changes in this file