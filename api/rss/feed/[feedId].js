import RSS from 'rss';
import { getStorageAdapter } from '../../../src/services/storage/adapter.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { feedId } = req.query;
    
    if (!feedId) {
      return res.status(400).json({ error: 'Feed ID required' });
    }
    
    const storage = getStorageAdapter();
    const allEpisodes = await storage.listEpisodes();
    
    // Filter episodes for this specific feed
    // Since we use a hash of the email for feed ID, we need to filter by matching the hash
    const feedEpisodes = allEpisodes.filter(episode => {
      if (episode.email && episode.email.from) {
        const emailHash = crypto.createHash('sha256')
          .update(episode.email.from.toLowerCase())
          .digest('hex')
          .substring(0, 16);
        return emailHash === feedId;
      }
      return false;
    });
    
    const publicUrl = process.env.PUBLIC_URL || `https://${req.headers.host}`;
    
    const feed = new RSS({
      title: process.env.RSS_TITLE || 'Email to Podcast Feed',
      description: process.env.RSS_DESCRIPTION || 'Your personal podcast feed from email content',
      feed_url: `${publicUrl}/rss/feed/${feedId}`,
      site_url: publicUrl,
      image_url: `${publicUrl}/logo.png`,
      author: process.env.RSS_AUTHOR || 'Email to Podcast Bot',
      copyright: `${new Date().getFullYear()} ${process.env.RSS_AUTHOR || 'Email to Podcast Bot'}`,
      language: 'en',
      pubDate: new Date(),
      ttl: '60',
      itunesAuthor: process.env.RSS_AUTHOR || 'Email to Podcast Bot',
      itunesSubtitle: 'Personal podcast feed',
      itunesSummary: process.env.RSS_DESCRIPTION || 'Your personal podcast feed from email content',
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
    feedEpisodes.sort((a, b) => new Date(b.date) - new Date(a.date));

    for (const episode of feedEpisodes) {
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

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.status(200).send(feed.xml());
  } catch (error) {
    console.error('RSS feed generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate RSS feed',
      details: error.message 
    });
  }
}