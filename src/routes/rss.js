import { Router } from 'express';
import RSS from 'rss';
import { getPodcastEpisodes, getEmailByFeedId } from '../services/podcastStorage.js';

export const rssRouter = Router();

// Get episodes by feed ID
rssRouter.get('/feed/:feedId', async (req, res) => {
  try {
    const feedId = req.params.feedId;
    const senderEmail = await getEmailByFeedId(feedId);
    
    if (!senderEmail) {
      return res.status(404).json({ error: 'Feed not found' });
    }
    
    const episodes = await getPodcastEpisodes();
    
    // Filter episodes by sender
    const senderEpisodes = episodes.filter(ep => ep.author === senderEmail);
    
    const feed = new RSS({
      title: `${process.env.RSS_TITLE || 'Email to Podcast'} - Personal Feed`,
      description: `Your personal podcast feed`,
      feed_url: `${process.env.PUBLIC_URL || req.protocol + '://' + req.get('host')}/rss/feed/${feedId}`,
      site_url: process.env.PUBLIC_URL || req.protocol + '://' + req.get('host'),
      image_url: `${process.env.PUBLIC_URL || req.protocol + '://' + req.get('host')}/logo.png`,
      author: senderEmail,
      managingEditor: senderEmail,
      webMaster: process.env.RSS_EMAIL || 'noreply@example.com',
      copyright: `${new Date().getFullYear()} ${senderEmail}`,
      language: 'en',
      categories: ['Technology', 'Email', 'Automation'],
      pubDate: senderEpisodes.length > 0 ? new Date(senderEpisodes[0].date) : new Date(),
      ttl: 60,
      custom_namespaces: {
        'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd'
      },
      custom_elements: [
        {'itunes:subtitle': `Your personal podcast feed`},
        {'itunes:author': senderEmail},
        {'itunes:summary': `Automatically generated podcasts from your emails`},
        {'itunes:owner': [
          {'itunes:name': senderEmail},
          {'itunes:email': senderEmail}
        ]},
        {'itunes:explicit': 'no'},
        {'itunes:category': {
          _attr: {
            text: 'Technology'
          }
        }},
        {'itunes:image': {
          _attr: {
            href: `${process.env.PUBLIC_URL || req.protocol + '://' + req.get('host')}/logo.png`
          }
        }},
        {'itunes:type': 'episodic'}
      ]
    });
    
    // Add episodes to feed
    senderEpisodes.forEach(episode => {
      feed.item({
        title: episode.title,
        description: episode.description,
        url: `${process.env.PUBLIC_URL || req.protocol + '://' + req.get('host')}/rss/episode/${episode.id}`,
        guid: episode.id,
        categories: ['Email', 'Podcast'],
        author: episode.author,
        date: episode.date,
        enclosure: {
          url: episode.audioUrl,
          type: 'audio/mpeg',
          length: episode.fileSize || 0
        },
        custom_elements: [
          {'itunes:author': episode.author},
          {'itunes:subtitle': episode.description},
          {'itunes:duration': formatDuration(episode.duration)},
          {'itunes:summary': episode.content},
          {'itunes:episodeType': 'full'},
          {'itunes:explicit': 'no'}
        ]
      });
    });
    
    res.set('Content-Type', 'application/rss+xml');
    res.send(feed.xml());
    
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    res.status(500).json({ error: 'Failed to generate RSS feed' });
  }
});

// Get all episodes
rssRouter.get('/feed.xml', async (req, res) => {
  try {
    const episodes = await getPodcastEpisodes();
    
    const feed = new RSS({
      title: process.env.RSS_TITLE || 'Email Podcasts',
      description: process.env.RSS_DESCRIPTION || 'Automatically generated podcasts from emails',
      feed_url: `${process.env.PUBLIC_URL || req.protocol + '://' + req.get('host')}/rss/feed.xml`,
      site_url: process.env.PUBLIC_URL || req.protocol + '://' + req.get('host'),
      image_url: `${process.env.PUBLIC_URL || req.protocol + '://' + req.get('host')}/logo.png`,
      author: process.env.RSS_AUTHOR || 'Email Podcast Generator',
      copyright: `${new Date().getFullYear()} ${process.env.RSS_AUTHOR || 'Email Podcast Generator'}`,
      language: 'en',
      categories: ['Technology', 'Email', 'Automation'],
      pubDate: episodes.length > 0 ? episodes[0].date : new Date(),
      ttl: 60,
      custom_namespaces: {
        'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd'
      },
      custom_elements: [
        {'itunes:subtitle': 'Convert emails to podcasts automatically'},
        {'itunes:author': process.env.RSS_AUTHOR || 'Email Podcast Generator'},
        {'itunes:summary': process.env.RSS_DESCRIPTION || 'Automatically generated podcasts from emails'},
        {'itunes:owner': [
          {'itunes:name': process.env.RSS_AUTHOR || 'Email Podcast Generator'},
          {'itunes:email': process.env.RSS_EMAIL || 'noreply@example.com'}
        ]},
        {'itunes:explicit': 'no'},
        {'itunes:category': {
          _attr: {
            text: 'Technology'
          }
        }}
      ]
    });
    
    // Add episodes to feed
    episodes.forEach(episode => {
      feed.item({
        title: episode.title,
        description: episode.description,
        url: `${process.env.PUBLIC_URL || req.protocol + '://' + req.get('host')}/rss/episode/${episode.id}`,
        guid: episode.id,
        categories: ['Email', 'Podcast'],
        author: episode.author,
        date: episode.date,
        enclosure: {
          url: episode.audioUrl,
          type: 'audio/mpeg',
          length: episode.fileSize || 0
        },
        custom_elements: [
          {'itunes:author': episode.author},
          {'itunes:subtitle': episode.description},
          {'itunes:duration': formatDuration(episode.duration)},
          {'itunes:summary': episode.content},
          {'itunes:episodeType': 'full'},
          {'itunes:explicit': 'no'}
        ]
      });
    });
    
    res.set('Content-Type', 'application/rss+xml');
    res.send(feed.xml());
    
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    res.status(500).json({ error: 'Failed to generate RSS feed' });
  }
});

// Get individual episode details
rssRouter.get('/episode/:id', async (req, res) => {
  try {
    const episodes = await getPodcastEpisodes();
    const episode = episodes.find(ep => ep.id === req.params.id);
    
    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }
    
    res.json(episode);
  } catch (error) {
    console.error('Error fetching episode:', error);
    res.status(500).json({ error: 'Failed to fetch episode' });
  }
});

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}