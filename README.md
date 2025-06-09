# Email to Podcast RSS Service

Convert incoming emails to podcasts automatically using Podcastfy and serve them via an RSS feed.

## Features

- Webhook endpoint for Postmark incoming emails
- Automatic email-to-podcast conversion using Podcastfy
- RSS feed generation for podcast distribution
- Episode storage and management
- Configurable podcast settings

## Prerequisites

- Node.js (v14 or higher)
- Postmark account (for receiving emails)
- OpenAI API key (for generating podcast scripts)
- ElevenLabs API key (for text-to-speech conversion)

## Installation

1. Clone the repository and navigate to the project directory

2. Run the setup script:
   ```bash
   ./setup.sh
   ```

3. Configure your environment variables in `.env`:
   ```
   PORT=3000
   PUBLIC_URL=https://your-domain.com
   POSTMARK_WEBHOOK_TOKEN=your_secret_token
   RSS_TITLE=My Email Podcasts
   RSS_DESCRIPTION=Podcasts generated from emails
   RSS_AUTHOR=Your Name
   RSS_EMAIL=your-email@example.com
   OPENAI_API_KEY=your_openai_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ELEVENLABS_VOICE_ID=your_voice_id
   POSTMARK_SERVER_TOKEN=your_postmark_server_token
   POSTMARK_FROM_EMAIL=noreply@yourdomain.com
   ```

## Usage

1. Start the server:
   ```bash
   npm start
   ```

2. Configure Postmark to send webhooks to:
   ```
   https://your-domain.com/webhook/postmark
   ```

3. Access your RSS feed at:
   ```
   https://your-domain.com/rss/feed.xml
   ```

## API Endpoints

- `POST /webhook/postmark` - Receives incoming email webhooks from Postmark
- `GET /rss/feed.xml` - RSS feed of all podcast episodes
- `GET /rss/episode/:id` - Get individual episode details
- `GET /podcasts/:filename` - Direct access to podcast audio files

## Postmark Webhook Configuration

1. Log in to your Postmark account
2. Go to your server settings
3. Navigate to "Webhooks" or "Inbound"
4. Add your webhook URL: `https://your-domain.com/webhook/postmark`
5. Set the webhook token in your `.env` file for security

## Customization

### Email Processing

Edit `src/services/emailProcessor.js` to customize how emails are converted to text for podcast generation.

### Podcast Settings

Modify the AI configuration in `emailProcessor.js`:
- OpenAI model and prompt style for script generation
- ElevenLabs voice settings for natural speech
- Audio format and quality settings

### RSS Feed

Customize RSS feed metadata in your `.env` file and `src/routes/rss.js`.

## Storage

- Podcast audio files are stored in `storage/podcasts/`
- Episode metadata is stored in `storage/metadata.json`
- Temporary files are stored in `temp/` and cleaned up after processing

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

## Deployment

This service can be deployed to any Node.js hosting platform:

1. Set environment variables on your hosting platform
2. Install dependencies: `npm install`
3. Start the service: `npm start`

## Security

- Always use HTTPS in production
- Set a strong `POSTMARK_WEBHOOK_TOKEN`
- Consider implementing rate limiting
- Validate and sanitize email content

## Troubleshooting

- **Podcast generation fails**: Check OpenAI and ElevenLabs API keys
- **RSS feed is empty**: Verify episodes are being saved to `storage/metadata.json`
- **Webhook not receiving emails**: Check Postmark webhook configuration and token
- **Audio generation errors**: Verify ElevenLabs voice ID and API limits

## License

MIT