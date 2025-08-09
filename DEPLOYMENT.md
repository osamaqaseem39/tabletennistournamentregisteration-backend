# Vercel Deployment Guide

## Fixing the 404 NOT_FOUND Error

### 1. Environment Variables Setup

You need to set these environment variables in your Vercel project:

```bash
# Go to your Vercel dashboard
# Navigate to your project settings
# Add these environment variables:

MONGODB_URI_PROD=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/your_database
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Verify Vercel Configuration

Your `vercel.json` should look like this:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "vercel.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "vercel.js"
    },
    {
      "src": "/(.*)",
      "dest": "vercel.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 3. Database Connection

Make sure your MongoDB Atlas cluster:
- Is accessible from Vercel's IP addresses
- Has the correct username/password
- Database name is correct

### 4. Redeploy Steps

1. **Commit and push** your changes to GitHub
2. **Redeploy** on Vercel (should auto-deploy if GitHub integration is enabled)
3. **Check logs** in Vercel dashboard for any errors

### 5. Test Endpoints

After deployment, test these endpoints:
- `https://tt-server-red.vercel.app/` (root)
- `https://tt-server-red.vercel.app/api/health` (health check)

### 6. Common Issues

- **404 Error**: Usually means environment variables are missing or database connection failed
- **CORS Error**: Frontend domain not in CORS whitelist
- **Database Error**: Check MongoDB URI and network access

### 7. Debug Commands

Check Vercel function logs:
```bash
vercel logs tt-server-red.vercel.app
```

### 8. Local Testing

Test locally before deploying:
```bash
cd backend
$env:NODE_ENV="production"
$env:MONGODB_URI_PROD="your_production_uri"
node vercel.js
``` 