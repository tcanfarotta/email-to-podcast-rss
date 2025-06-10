# Vercel Deployment Guide

This guide will help you deploy the Email to Podcast RSS service to Vercel with Cloudflare R2 storage.

## Prerequisites

1. Vercel account (https://vercel.com)
2. Cloudflare account with R2 enabled
3. OpenAI API key
4. ElevenLabs API key
5. Postmark Server Token

## Step 1: Set up Cloudflare R2

1. Log in to your Cloudflare dashboard
2. Navigate to R2 Storage
3. Create a new bucket (e.g., `email-podcasts`)
4. Create R2 API credentials:
   - Go to R2 > Manage R2 API Tokens
   - Click "Create API token"
   - Select permissions: Object Read & Write
   - Note down:
     - Account ID
     - Access Key ID
     - Secret Access Key

## Step 2: Prepare for Deployment

1. Clone or fork this repository
2. Install dependencies locally:
   ```bash
   npm install
   ```

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Run deployment:
   ```bash
   vercel
   ```

3. Follow the prompts to link to your Vercel account

### Option B: Deploy via GitHub

1. Push your code to a GitHub repository
2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Vercel will auto-detect the configuration

## Step 4: Configure Environment Variables

In your Vercel project settings, add these environment variables:

### Required Variables:

- `OPENAI_API_KEY` - Your OpenAI API key
- `ELEVENLABS_API_KEY` - Your ElevenLabs API key
- `ELEVENLABS_VOICE_ID` - Your preferred ElevenLabs voice ID
- `POSTMARK_SERVER_TOKEN` - Your Postmark server token
- `POSTMARK_FROM_EMAIL` - Email address for sending notifications
- `PUBLIC_URL` - Your Vercel deployment URL (e.g., https://your-app.vercel.app)

### Cloudflare R2 Variables:

- `CF_ACCOUNT_ID` - Your Cloudflare account ID
- `R2_ACCESS_KEY_ID` - Your R2 access key ID
- `R2_SECRET_ACCESS_KEY` - Your R2 secret access key
- `R2_BUCKET_NAME` - Your R2 bucket name
- `R2_PUBLIC_URL` - Your R2 public URL (if using public bucket)

### Optional Variables:

- `RSS_TITLE` - Custom title for your RSS feed
- `RSS_DESCRIPTION` - Custom description for your RSS feed
- `RSS_AUTHOR` - Author name for the RSS feed
- `RSS_EMAIL` - Contact email for the RSS feed

## Step 5: Configure Postmark Webhook

1. In your Postmark account, go to your server settings
2. Navigate to "Webhooks"
3. Add a new webhook:
   - URL: `https://your-app.vercel.app/webhook/postmark`
   - Choose "Inbound" webhook type
   - Enable the webhook

## Step 6: Test Your Deployment

1. Send an email to your Postmark inbound address
2. Check the Vercel function logs for processing
3. Access your RSS feed at: `https://your-app.vercel.app/rss/feed.xml`

## API Endpoints

After deployment, these endpoints will be available:

- `POST /webhook/postmark` - Receives emails from Postmark
- `GET /rss/feed.xml` - Main RSS feed with all episodes
- `GET /rss/feed/[feedId]` - Personal RSS feed for specific email
- `GET /podcasts/[filename]` - Stream individual podcast files

## Troubleshooting

1. **Function Timeouts**: Vercel functions have a 60-second timeout. Large emails might fail to process.

2. **R2 Connection Issues**: Ensure your R2 credentials are correct and the bucket exists.

3. **Missing Audio Files**: Check that R2_PUBLIC_URL is correctly configured if using a public bucket.

4. **Email Not Processing**: Check Postmark webhook logs and Vercel function logs.

## Local Development

To test locally before deploying:

```bash
npm run dev
```

The local version will use file system storage unless R2 credentials are configured.

## Cost Considerations

- **Vercel**: Free tier includes 100GB bandwidth and 100K function invocations
- **Cloudflare R2**: Free tier includes 10GB storage and 1M requests per month
- **OpenAI**: Charges per token used for text generation
- **ElevenLabs**: Limited free tier, paid plans for more characters

## Security Notes

- All environment variables are encrypted in Vercel
- R2 credentials should have minimal required permissions
- Consider implementing rate limiting for production use
- Add domain restrictions in Postmark for security