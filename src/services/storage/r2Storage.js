import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

export class R2StorageAdapter {
  constructor() {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
      }
    });
    
    this.bucket = process.env.R2_BUCKET_NAME;
    this.publicUrl = process.env.R2_PUBLIC_URL || process.env.PUBLIC_URL;
  }

  async saveAudio(filename, buffer, metadata = {}) {
    try {
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.bucket,
          Key: `podcasts/${filename}`,
          Body: buffer,
          ContentType: 'audio/mpeg',
          Metadata: {
            ...metadata,
            uploadDate: new Date().toISOString()
          }
        }
      });

      await upload.done();
      
      return {
        filename,
        url: `${this.publicUrl}/podcasts/${filename}`,
        size: buffer.length
      };
    } catch (error) {
      console.error('R2 upload error:', error);
      throw new Error(`Failed to upload to R2: ${error.message}`);
    }
  }

  async saveMetadata(episodeId, metadata) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: `metadata/${episodeId}.json`,
        Body: JSON.stringify(metadata, null, 2),
        ContentType: 'application/json'
      };

      await this.client.send(new PutObjectCommand(params));
    } catch (error) {
      console.error('R2 metadata save error:', error);
      throw new Error(`Failed to save metadata: ${error.message}`);
    }
  }

  async getMetadata(episodeId) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: `metadata/${episodeId}.json`
      };

      const response = await this.client.send(new GetObjectCommand(params));
      const body = await response.Body.transformToString();
      return JSON.parse(body);
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return null;
      }
      throw error;
    }
  }

  async listEpisodes() {
    try {
      const params = {
        Bucket: this.bucket,
        Prefix: 'metadata/',
        MaxKeys: 1000
      };

      const response = await this.client.send(new ListObjectsV2Command(params));
      
      if (!response.Contents || response.Contents.length === 0) {
        return [];
      }

      const episodes = [];
      
      for (const item of response.Contents) {
        const episodeId = item.Key.replace('metadata/', '').replace('.json', '');
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

      return episodes;
    } catch (error) {
      console.error('R2 list episodes error:', error);
      throw new Error(`Failed to list episodes: ${error.message}`);
    }
  }

  async getAudioStream(filename) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: `podcasts/${filename}`
      };

      // Get object metadata first
      const headResponse = await this.client.send(new HeadObjectCommand(params));
      
      // Get the actual object
      const response = await this.client.send(new GetObjectCommand(params));
      
      return {
        stream: response.Body,
        contentType: headResponse.ContentType || 'audio/mpeg',
        contentLength: headResponse.ContentLength
      };
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        throw new Error('File not found');
      }
      throw error;
    }
  }

  async deleteEpisode(episodeId) {
    try {
      // Delete metadata
      await this.client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: `metadata/${episodeId}.json`
      }));

      // Get metadata to find audio file
      const metadata = await this.getMetadata(episodeId);
      if (metadata && metadata.audioUrl) {
        const filename = metadata.audioUrl.split('/').pop();
        await this.client.send(new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: `podcasts/${filename}`
        }));
      }
    } catch (error) {
      console.error('R2 delete error:', error);
      throw new Error(`Failed to delete episode: ${error.message}`);
    }
  }
}