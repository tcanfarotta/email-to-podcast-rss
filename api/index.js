import { processEmail } from '../src/services/emailProcessor.js';
import { getStorageAdapter } from '../src/services/storage/adapter.js';
import RSS from 'rss';
import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  const { url, method } = req;
  const path = req.url || url || '';
  console.log('API Request:', method, path);
  console.log('Full request URL info:', { url: req.url, originalUrl: req.originalUrl, path: req.path });

  // Route: POST /webhook/postmark
  if (path.includes('/webhook/postmark') && method === 'POST') {
    return handleWebhook(req, res);
  }

  // Route: GET /rss/feed.xml or /rss/feed
  if (path.match(/\/rss\/feed(\.xml)?$/) && method === 'GET') {
    return handleRssFeed(req, res);
  }

  // Route: GET /rss/feed/[feedId]
  if (path.match(/\/rss\/feed\/[\w-]+$/) && method === 'GET') {
    return handlePersonalFeed(req, res);
  }

  // Route: GET /podcasts/[file]
  if (path.match(/\/podcasts\/[\w-]+\.mp3$/) && method === 'GET') {
    return handlePodcastFile(req, res);
  }

  console.log('No route matched for:', method, path);
  return res.status(404).json({ error: 'Not found', path, method });
}

async function handleWebhook(req, res) {
  console.log('=== WEBHOOK RECEIVED ===');
  try {
    const emailData = req.body;
    console.log('Email data received:', {
      from: emailData.FromFull?.Email || emailData.From,
      subject: emailData.Subject,
      hasTextBody: !!emailData.TextBody,
      hasHtmlBody: !!emailData.HtmlBody,
    });

    if (!emailData.FromFull || !emailData.Subject || !emailData.TextBody) {
      return res.status(400).json({ error: 'Invalid email data' });
    }

    const result = await processEmail(emailData);
    console.log('Email processed successfully:', result);

    res.status(200).json({
      success: true,
      message: 'Email processed successfully',
      episodeId: result.id
    });
  } catch (error) {
    console.error('=== WEBHOOK ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to process email',
      details: error.message
    });
  }
}

async function handleRssFeed(req, res) {
  console.log('=== RSS FEED REQUEST ===');
  try {
    const storage = getStorageAdapter();
    const episodes = await storage.listEpisodes();
    console.log('Found episodes:', episodes.length);
    if (episodes.length > 0) {
      console.log('First episode:', JSON.stringify(episodes[0], null, 2));
    }

    const publicUrl = process.env.PUBLIC_URL || `https://${req.headers.host}`;
    const feed = createRssFeed(publicUrl, episodes);

    const xml = feed.xml();
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.status(200).send(xml);
  } catch (error) {
    console.error('=== RSS FEED ERROR ===');
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Failed to generate RSS feed' });
  }
}

async function handlePersonalFeed(req, res) {
  console.log('=== PERSONAL RSS FEED REQUEST ===');
  const feedId = req.url.split('/').pop();
  console.log('Feed ID requested:', feedId);
  
  try {
    const storage = getStorageAdapter();
    const allEpisodes = await storage.listEpisodes();
    console.log('Total episodes found:', allEpisodes.length);
    
    const feedEpisodes = allEpisodes.filter(episode => {
      if (episode.email && episode.email.from) {
        const emailHash = crypto.createHash('sha256')
          .update(episode.email.from.toLowerCase())
          .digest('hex')
          .substring(0, 16);
        console.log('Checking episode:', {
          episodeId: episode.id,
          from: episode.email.from,
          hash: emailHash,
          matches: emailHash === feedId
        });
        return emailHash === feedId;
      }
      console.log('Episode missing email data:', episode.id);
      return false;
    });
    
    console.log('Filtered episodes for feed:', feedEpisodes.length);

    const publicUrl = process.env.PUBLIC_URL || `https://${req.headers.host}`;
    const feed = createRssFeed(publicUrl, feedEpisodes);

    const xml = feed.xml();
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.status(200).send(xml);
  } catch (error) {
    console.error('=== PERSONAL FEED ERROR ===');
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Failed to generate RSS feed' });
  }
}

async function handlePodcastFile(req, res) {
  console.log('=== PODCAST FILE REQUEST ===');
  const filename = req.url.split('/').pop();
  
  try {
    const storage = getStorageAdapter();
    const { stream, contentType, contentLength } = await storage.getAudioStream(filename);
    
    res.setHeader('Content-Type', contentType || 'audio/mpeg');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    stream.pipe(res);
  } catch (error) {
    console.error('=== AUDIO STREAMING ERROR ===');
    console.error('Error:', error.message);
    
    if (error.message === 'File not found') {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.status(500).json({ error: 'Failed to stream audio' });
  }
}

function createRssFeed(publicUrl, episodes) {
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

  episodes.sort((a, b) => new Date(b.date) - new Date(a.date));

  for (const episode of episodes) {
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

  return feed;
}