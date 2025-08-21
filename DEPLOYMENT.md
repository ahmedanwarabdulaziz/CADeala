# Deployment Configuration Guide

## App URL Configuration

The app needs to know its base URL to generate correct signup links for customer ranks. This is automatically handled in most cases, but you can configure it manually if needed.

### Automatic Detection

The app automatically detects the correct URL in this order:
1. `NEXT_PUBLIC_APP_URL` environment variable
2. `VERCEL_URL` environment variable (for Vercel deployments)
3. `window.location.origin` (client-side)
4. Fallback to `http://localhost:3000`

### Manual Configuration

#### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add a new environment variable:
   - **Name**: `NEXT_PUBLIC_APP_URL`
   - **Value**: `https://your-domain.vercel.app` (replace with your actual domain)
4. Redeploy your application

#### For Other Hosting Platforms

Set the `NEXT_PUBLIC_APP_URL` environment variable to your production domain.

#### For Local Development

Create a `.env.local` file in the root directory:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Regenerating Signup Links

If you change your domain or need to update existing signup links:

1. Log in to your business dashboard
2. Go to the "Utility Tools" section
3. Click "Regenerate Links" to update all existing customer rank signup links

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | The base URL of your application | `https://your-app.com` |
| `VERCEL_URL` | Automatically set by Vercel | `your-app.vercel.app` |

### Troubleshooting

- **Signup links not working**: Make sure the `NEXT_PUBLIC_APP_URL` is set correctly
- **HTTPS issues**: The app automatically adds HTTPS for production URLs
- **Domain changes**: Use the "Regenerate Links" utility in the business dashboard
