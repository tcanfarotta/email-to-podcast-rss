import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const METADATA_FILE = join(dirname(dirname(__dirname)), 'storage', 'metadata.json');

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