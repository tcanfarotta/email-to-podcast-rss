import { getStorageAdapter } from '../src/services/storage/adapter.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple security check
  const { key } = req.query;
  if (key !== 'migrate-urls-2025') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    console.log('=== STARTING URL MIGRATION ===');
    const storage = getStorageAdapter();
    const episodes = await storage.listEpisodes();
    
    console.log(`Found ${episodes.length} episodes to check`);
    
    const publicUrl = process.env.PUBLIC_URL || 'https://email-to-podcast.vercel.app';
    let updated = 0;
    
    for (const episode of episodes) {
      const metadata = await storage.getMetadata(episode.id);
      if (!metadata) continue;
      
      let needsUpdate = false;
      const oldUrl = metadata.audioUrl;
      
      // Check if URL needs updating
      if (metadata.audioUrl && !metadata.audioUrl.startsWith(publicUrl)) {
        // Extract filename from old URL
        const filename = metadata.audioUrl.split('/').pop();
        metadata.audioUrl = `${publicUrl}/podcasts/${filename}`;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log(`Updating episode ${episode.id}:`);
        console.log(`  Old URL: ${oldUrl}`);
        console.log(`  New URL: ${metadata.audioUrl}`);
        
        await storage.saveMetadata(episode.id, metadata);
        updated++;
      }
    }
    
    console.log(`Migration complete. Updated ${updated} episodes.`);
    
    res.status(200).json({
      success: true,
      message: `Migration complete. Updated ${updated} out of ${episodes.length} episodes.`,
      publicUrl
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
}