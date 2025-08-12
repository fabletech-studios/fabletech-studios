# IMPORTANT: Add these to your .env.local file

Add the following environment variables to your `.env.local` file in Vercel:

```
# IONOS Email Configuration
EMAIL_HOST=smtp.ionos.com
EMAIL_PORT=587
EMAIL_USER=admin@fabletech.studio
EMAIL_PASSWORD=0811thebestwaytobehappy18@+
EMAIL_FROM=admin@fabletech.studio
EMAIL_FROM_NAME=FableTech Studios
```

## To add these to Vercel:

1. Go to your Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable above
5. Make sure they're available for Production, Preview, and Development
6. Redeploy your application

## Testing:

After deployment, you can test the email by visiting:
- `/api/test-email` (only works in development mode)

## Security Note:

- Never commit the EMAIL_PASSWORD to git
- Always use environment variables for sensitive data
- The password has been saved only in this private file for your reference