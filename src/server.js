import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import the API handler
import apiHandler from '../api/index.js';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config(); // Also load .env as fallback

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(join(dirname(__dirname), 'public')));

// Local storage for podcasts (when not using R2)
app.use('/podcasts', express.static(join(dirname(__dirname), 'storage', 'podcasts')));

// Route all API requests through the Vercel API handler
app.all('*', (req, res) => {
  // Make the request compatible with Vercel's handler
  req.query = req.query || {};
  
  // Call the API handler
  return apiHandler(req, res);
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║        Email to Podcast - Local Server         ║
╠════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}      ║
║                                                ║
║  Endpoints:                                    ║
║  - Webhook: http://localhost:${PORT}/webhook/postmark
║  - RSS Feed: http://localhost:${PORT}/rss/feed.xml
║  - Personal Feed: http://localhost:${PORT}/rss/feed/[feedId]
║  - Podcasts: http://localhost:${PORT}/podcasts/[file]
║                                                ║
║  Storage: ${process.env.R2_ACCESS_KEY_ID ? 'Cloudflare R2' : 'Local filesystem'}
╚════════════════════════════════════════════════╝
  `);
});