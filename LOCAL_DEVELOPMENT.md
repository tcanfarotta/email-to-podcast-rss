# Local Development Guide

This guide helps you set up and run the Email to Podcast service locally for development.

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Your API keys ready (OpenAI, ElevenLabs, Postmark)

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/tcanfarotta/email-to-podcast-rss.git
   cd email-to-podcast-rss
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   # Required API Keys
   OPENAI_API_KEY=your_openai_key
   ELEVENLABS_API_KEY=your_elevenlabs_key
   ELEVENLABS_VOICE_ID=your_voice_id
   
   # Optional: Use local storage instead of R2
   # Comment out R2 variables to use local storage
   # R2_ACCESS_KEY_ID=
   # R2_SECRET_ACCESS_KEY=
   # R2_BUCKET_NAME=
   
   # Local development URL
   PUBLIC_URL=http://localhost:3000
   ```

## Running Locally

### Start the development server

```bash
npm run dev
```

This will start the server on http://localhost:3000 with:
- Auto-reload on file changes
- Local file storage (unless R2 is configured)
- All API endpoints available

### Test the webhook

In a new terminal, run:

```bash
npm run test:webhook
```

This will:
1. Send a test email to your local webhook
2. Generate a podcast episode
3. Show you the RSS feed and MP3 URLs

### Test with custom content

Edit `test-webhook.js` to change:
- Email subject
- Email content
- Sender details

## Local Storage

When R2 credentials are not configured, the app uses local file storage:
- Audio files: `./storage/podcasts/`
- Metadata: `./storage/metadata/`
- Feed mappings: `./storage/feed-mappings.json`

## API Endpoints

All endpoints work the same locally:

- **Webhook**: `POST http://localhost:3000/webhook/postmark`
- **RSS Feed**: `GET http://localhost:3000/rss/feed.xml`
- **Personal Feed**: `GET http://localhost:3000/rss/feed/{feedId}`
- **Audio Files**: `GET http://localhost:3000/podcasts/{filename}.mp3`

## Development Workflow

1. **Make changes** to the code
2. **Test locally** with `npm run test:webhook`
3. **Check logs** in the terminal for debugging
4. **View RSS feed** at http://localhost:3000/rss/feed.xml
5. **Test audio playback** by clicking MP3 links

## Testing Production APIs

To test against production (Vercel) from local:

```bash
# Test production webhook
npm run test:webhook -- --prod

# Or with custom URL
WEBHOOK_URL=https://email-to-podcast.vercel.app/webhook/postmark npm run test:webhook
```

## Debugging Tips

1. **Enable verbose logging**: The app already has extensive logging
2. **Check `.env.local`**: Ensure all required API keys are set
3. **Storage issues**: Check file permissions in `./storage/`
4. **API errors**: Look for specific error messages in console

## Common Issues

### "Cannot find module" errors
```bash
npm install
```

### API key errors
- Verify keys in `.env.local`
- Check API key quotas/limits

### Storage permission errors
```bash
mkdir -p storage/podcasts storage/metadata
chmod 755 storage storage/*
```

### Port already in use
```bash
# Use a different port
PORT=3001 npm run dev
```

## Switching Between Local and R2 Storage

- **For local storage**: Comment out R2 variables in `.env.local`
- **For R2 storage**: Uncomment and fill in R2 credentials

The app automatically detects which storage to use based on available credentials.

## Making Changes

1. **Frontend changes**: Edit files in `public/`
2. **API changes**: Edit `api/index.js`
3. **Storage logic**: Edit files in `src/services/storage/`
4. **Email processing**: Edit `src/services/emailProcessor.js`

## Before Pushing to Production

1. Test all changes locally
2. Run the webhook test
3. Verify RSS feed works
4. Test audio playback
5. Check logs for any errors

## Need Help?

- Check existing logs for error details
- Review `.env.local` configuration
- Ensure all dependencies are installed
- Try the test webhook with `--help` flag