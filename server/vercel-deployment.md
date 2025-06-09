# Vercel Deployment Guide

This guide explains how to deploy the Gen Meta App backend to Vercel.

## Prerequisites

- A Vercel account
- The Vercel CLI installed (optional, for local development)
- Your environment variables ready

## Deployment Steps

1. **Push your code to a Git repository** (GitHub, GitLab, or Bitbucket)

2. **Connect your repository in Vercel**:

   - Go to [vercel.com](https://vercel.com)
   - Create a new project
   - Import your repository
   - Select the "Node.js" framework preset

3. **Configure environment variables**:

   Add the following environment variables in the Vercel project settings:

   ```
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   DB_NAME=your_database_name
   GEMINI_API_KEY=your_gemini_api_key
   CORS_ORIGIN=https://your-frontend-domain.com

   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=your_google_callback_url

   # Authentication
   SESSION_SECRET=your_session_secret
   ACCESS_TOKEN_SECRET=your_access_token_secret
   ACCESS_TOKEN_EXPIRY=1d
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   REFRESH_TOKEN_EXPIRY=30d
   EMAIL_VERIFY_TOKEN_SECRET=your_email_verify_token_secret
   EMAIL_VERIFY_TOKEN_EXPIRY=1d

   # Email
   RESEND_API_KEY=your_resend_api_key

   # AWS S3
   AWS_S3_BUCKET_NAME=your_s3_bucket_name
   AWS_S3_COMPRESS_BUCKET_NAME=your_s3_compress_bucket_name
   AWS_S3_ENDPOINT=your_s3_endpoint
   AWS_S3_REGION=your_s3_region
   AWS_S3_ACCESS_KEY_ID=your_s3_access_key_id
   AWS_S3_SECRET_ACCESS_KEY=your_s3_secret_access_key

   # Bkash Payment
   BKASH_BASE_URL=your_bkash_base_url
   BKASH_APP_KEY=your_bkash_app_key
   BKASH_APP_SECRET=your_bkash_app_secret
   BKASH_USERNAME=your_bkash_username
   BKASH_PASSWORD=your_bkash_password
   BKASH_CALLBACK_URL=your_bkash_callback_url
   ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete

## Vercel Configuration

Your project includes a `vercel.json` file with the following configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/src/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

This configuration:

- Specifies that `src/index.js` is the entry point
- Routes all traffic to your Express application
- Sets the NODE_ENV to production

## Troubleshooting

- **Connection timeout issues**: Make sure your MongoDB connection string is correct and accessible from Vercel's servers
- **CORS errors**: Update the `CORS_ORIGIN` environment variable to match your frontend domain
- **Build failures**: Check the build logs for specific error messages

## Monitoring

After deployment, you can monitor your application using:

- Vercel Dashboard
- Logs section in project settings
- Integrating with external monitoring services

## Scaling

To handle increased traffic:

- Consider upgrading your Vercel plan
- Optimize your MongoDB queries
- Implement caching where appropriate
