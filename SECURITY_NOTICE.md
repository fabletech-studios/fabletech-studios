# 🔒 Security Notice

## API Key Security

All sensitive API keys have been removed from this repository for security purposes.

### Configuration Required

To run this application, you need to set the following environment variables:

#### Firebase Configuration
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

#### Stripe Configuration
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

#### Admin Configuration
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`

### Where to Set Environment Variables

1. **Local Development**: Create a `.env.local` file (automatically ignored by git)
2. **Production (Vercel)**: Set in Vercel Dashboard → Settings → Environment Variables

### Security Best Practices

- Never commit API keys to the repository
- Use environment variables for all sensitive data
- Rotate keys regularly
- Use different keys for development and production
- Monitor API usage for suspicious activity

### Getting Your API Keys

1. **Firebase**: Firebase Console → Project Settings → General
2. **Stripe**: Stripe Dashboard → Developers → API Keys
3. **Admin Password**: Generate using `bcrypt` with 10 rounds

---

**Note**: The `.env.local` file is automatically ignored by git to prevent accidental exposure of sensitive data.
