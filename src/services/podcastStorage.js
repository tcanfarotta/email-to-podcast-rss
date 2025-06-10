import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const METADATA_FILE = join(dirname(dirname(__dirname)), 'storage', 'metadata.json');
const FEED_MAPPING_FILE = join(dirname(dirname(__dirname)), 'storage', 'feed-mappings.json');

export async function getPodcastEpisodes() {
  try {
    const data = await readFile(METADATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

export async function addPodcastEpisode(episode) {
  try {
    // Ensure storage directory exists
    const storageDir = dirname(METADATA_FILE);
    await mkdir(storageDir, { recursive: true });
    
    // Get existing episodes
    const episodes = await getPodcastEpisodes();
    
    // Calculate file size if not provided
    if (!episode.fileSize && episode.audioFile) {
      try {
        const audioPath = join(dirname(dirname(__dirname)), 'storage', 'podcasts', episode.audioFile);
        const { stat } = await import('fs/promises');
        const stats = await stat(audioPath);
        episode.fileSize = stats.size;
      } catch (error) {
        console.warn('Could not calculate file size:', error.message);
        episode.fileSize = 0;
      }
    }
    
    // Add new episode
    episodes.unshift(episode); // Add to beginning (newest first)
    
    // Keep only last 100 episodes (configurable)
    const maxEpisodes = parseInt(process.env.MAX_EPISODES || '100');
    if (episodes.length > maxEpisodes) {
      episodes.length = maxEpisodes;
    }
    
    // Save updated metadata
    await writeFile(METADATA_FILE, JSON.stringify(episodes, null, 2));
    
    return episode;
  } catch (error) {
    console.error('Error saving podcast episode:', error);
    throw error;
  }
}

export async function getPodcastEpisode(id) {
  const episodes = await getPodcastEpisodes();
  return episodes.find(ep => ep.id === id);
}

async function loadFeedMappings() {
  try {
    const data = await readFile(FEED_MAPPING_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty object
    return {};
  }
}

async function saveFeedMappings(mappings) {
  await writeFile(FEED_MAPPING_FILE, JSON.stringify(mappings, null, 2));
}

export async function getFeedIdForEmail(email) {
  // For Vercel deployment, we'll use a deterministic hash instead of storing mappings
  // This avoids the need for persistent file storage
  const crypto = await import('crypto');
  const hash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
  return hash.substring(0, 16); // Use first 16 chars as feed ID
}

export async function getEmailByFeedId(feedId) {
  const mappings = await loadFeedMappings();
  
  // Find email by feed ID
  for (const [email, id] of Object.entries(mappings)) {
    if (id === feedId) {
      return email;
    }
  }
  
  return null;
}