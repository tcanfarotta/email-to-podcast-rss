import { writeFile, readFile, mkdir, readdir, unlink } from 'fs/promises';
import { createReadStream, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class LocalStorageAdapter {
  constructor() {
    this.baseDir = join(dirname(dirname(dirname(__dirname))), 'storage');
    this.publicUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
  }

  async ensureDir(dir) {
    try {
      await mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory exists
    }
  }

  async saveAudio(filename, buffer, metadata = {}) {
    const audioDir = join(this.baseDir, 'podcasts');
    await this.ensureDir(audioDir);
    
    const filePath = join(audioDir, filename);
    await writeFile(filePath, buffer);
    
    return {
      filename,
      url: `${this.publicUrl}/podcasts/${filename}`,
      size: buffer.length
    };
  }

  async saveMetadata(episodeId, metadata) {
    const metadataDir = join(this.baseDir, 'metadata');
    await this.ensureDir(metadataDir);
    
    const filePath = join(metadataDir, `${episodeId}.json`);
    await writeFile(filePath, JSON.stringify(metadata, null, 2));
  }

  async getMetadata(episodeId) {
    try {
      const filePath = join(this.baseDir, 'metadata', `${episodeId}.json`);
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async listEpisodes() {
    const metadataDir = join(this.baseDir, 'metadata');
    await this.ensureDir(metadataDir);
    
    try {
      const files = await readdir(metadataDir);
      const episodes = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const episodeId = file.replace('.json', '');
          const metadata = await this.getMetadata(episodeId);
          
          if (metadata) {
            episodes.push({
              id: episodeId,
              title: metadata.title,
              description: metadata.description,
              date: metadata.date,
              audioUrl: metadata.audioUrl,
              size: metadata.size,
              duration: metadata.duration
            });
          }
        }
      }
      
      return episodes;
    } catch (error) {
      return [];
    }
  }

  async getAudioStream(filename) {
    const filePath = join(this.baseDir, 'podcasts', filename);
    
    try {
      const stats = statSync(filePath);
      const stream = createReadStream(filePath);
      
      return {
        stream,
        contentType: 'audio/mpeg',
        contentLength: stats.size
      };
    } catch (error) {
      throw new Error('File not found');
    }
  }

  async deleteEpisode(episodeId) {
    try {
      // Delete metadata
      const metadataPath = join(this.baseDir, 'metadata', `${episodeId}.json`);
      await unlink(metadataPath);
      
      // Get metadata to find audio file
      const metadata = await this.getMetadata(episodeId);
      if (metadata && metadata.audioUrl) {
        const filename = metadata.audioUrl.split('/').pop();
        const audioPath = join(this.baseDir, 'podcasts', filename);
        await unlink(audioPath);
      }
    } catch (error) {
      throw new Error(`Failed to delete episode: ${error.message}`);
    }
  }
}