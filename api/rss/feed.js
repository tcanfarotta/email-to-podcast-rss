import RSS from 'rss';
import { getStorageAdapter } from '../src/services/storage/adapter.js';

export default async function handler(req, res) {
  console.log('=== RSS FEED REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Getting storage adapter...');
    const storage = getStorageAdapter();
    console.log('Fetching episodes...');
    const episodes = await storage.listEpisodes();
    console.log('Found episodes:', episodes.length);
    
    const publicUrl = process.env.PUBLIC_URL || `https://${req.headers.host}`;
    
    const feed = new RSS({
      title: process.env.RSS_TITLE || 'Email to Podcast Feed',
      description: process.env.RSS_DESCRIPTION || 'Automated podcast feed from email content',
      feed_url: `${publicUrl}/rss/feed.xml`,
      site_url: publicUrl,
      image_url: `${publicUrl}/logo.png`,
      author: process.env.RSS_AUTHOR || 'Email to Podcast Bot',
      copyright: `${new Date().getFullYear()} ${process.env.RSS_AUTHOR || 'Email to Podcast Bot'}`,
      language: 'en',
      pubDate: new Date(),
      ttl: '60',
      itunesAuthor: process.env.RSS_AUTHOR || 'Email to Podcast Bot',
      itunesSubtitle: 'Automated podcast feed',
      itunesSummary: process.env.RSS_DESCRIPTION || 'Automated podcast feed from email content',
      itunesOwner: {
        name: process.env.RSS_AUTHOR || 'Email to Podcast Bot',
        email: process.env.RSS_EMAIL || 'podcast@example.com'
      },
      itunesImage: `${publicUrl}/logo.png`,
      itunesCategory: {
        text: 'Technology'
      }
    });

    // Sort episodes by date (newest first)
    episodes.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    console.log('Adding episodes to feed:');
    for (const episode of episodes) {
      console.log('Adding episode:', {
        id: episode.id,
        title: episode.title,
        audioUrl: episode.audioUrl,
        date: episode.date
      });
      
      feed.item({
        title: episode.title,
        description: episode.description,
        url: `${publicUrl}/episodes/${episode.id}`,
        guid: episode.id,
        date: episode.date,
        enclosure: {
          url: episode.audioUrl,
          type: 'audio/mpeg',
          size: episode.size || 0
        },
        itunesDuration: episode.duration || '00:00'
      });
    }

    const xml = feed.xml();
    console.log('RSS feed generated, size:', xml.length);
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.status(200).send(xml);
  } catch (error) {
    console.error('=== RSS FEED ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to generate RSS feed',
      details: error.message 
    });
  }
}