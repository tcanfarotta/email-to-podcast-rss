import express from 'express';
import dotenv from 'dotenv';
import { webhookRouter } from './routes/webhook.js';
import { rssRouter } from './routes/rss.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (podcasts)
app.use('/podcasts', express.static(join(dirname(__dirname), 'storage', 'podcasts')));

// Routes
app.use('/webhook', webhookRouter);
app.use('/rss', rssRouter);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Email to Podcast RSS Service',
    endpoints: {
      webhook: '/webhook/postmark',
      rss: '/rss/feed.xml',
      podcasts: '/podcasts/:filename'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`RSS feed available at: ${process.env.PUBLIC_URL || `http://localhost:${PORT}`}/rss/feed.xml`);
});