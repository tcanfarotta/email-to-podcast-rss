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
- Python 3.8 or higher
- Postmark account (for receiving emails)
- API keys for Podcastfy's TTS service (OpenAI or other supported providers)

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
   ```

4. Configure Podcastfy with your API keys (see [Podcastfy documentation](https://github.com/souzatharsis/podcastfy))

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

Modify the Podcastfy configuration in `emailProcessor.js`:
- `text_to_speech_model`: TTS model to use
- `conversation_style`: Style of the podcast
- `dialogue_structure`: Monologue or dialogue format
- `output_format`: Audio format (mp3, wav, etc.)

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
2. Ensure Python is available for Podcastfy
3. Install dependencies: `npm install && pip install -r requirements.txt`
4. Start the service: `npm start`

## Security

- Always use HTTPS in production
- Set a strong `POSTMARK_WEBHOOK_TOKEN`
- Consider implementing rate limiting
- Validate and sanitize email content

## Troubleshooting

- **Podcast generation fails**: Check Podcastfy configuration and API keys
- **RSS feed is empty**: Verify episodes are being saved to `storage/metadata.json`
- **Webhook not receiving emails**: Check Postmark webhook configuration and token

## License

MIT