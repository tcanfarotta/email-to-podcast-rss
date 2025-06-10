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
    console.log('R2: Saving audio file:', filename, 'Size:', buffer.length);
    try {
      const key = `podcasts/${filename}`;
      console.log('R2: Uploading to bucket:', this.bucket, 'Key:', key);
      
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: 'audio/mpeg',
          Metadata: {
            ...metadata,
            uploadDate: new Date().toISOString()
          }
        }
      });

      await upload.done();
      console.log('R2: Upload complete');
      
      // Use PUBLIC_URL for the podcast URL since R2 bucket is private
      const publicUrl = process.env.PUBLIC_URL || this.publicUrl;
      console.log('R2: URL generation:', {
        PUBLIC_URL: process.env.PUBLIC_URL,
        thisPublicUrl: this.publicUrl,
        finalUrl: publicUrl,
        generatedUrl: `${publicUrl}/podcasts/${filename}`
      });
      return {
        filename,
        url: `${publicUrl}/podcasts/${filename}`,
        size: buffer.length
      };
    } catch (error) {
      console.error('R2 upload error:', error);
      console.error('R2 error details:', {
        name: error.name,
        code: error.Code,
        statusCode: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId
      });
      throw new Error(`Failed to upload to R2: ${error.message}`);
    }
  }

  async saveMetadata(episodeId, metadata) {
    console.log('R2: Saving metadata for episode:', episodeId);
    try {
      const key = `metadata/${episodeId}.json`;
      const params = {
        Bucket: this.bucket,
        Key: key,
        Body: JSON.stringify(metadata, null, 2),
        ContentType: 'application/json'
      };
      
      console.log('R2: Saving metadata to:', key);
      await this.client.send(new PutObjectCommand(params));
      console.log('R2: Metadata saved successfully');
    } catch (error) {
      console.error('R2 metadata save error:', error);
      throw new Error(`Failed to save metadata: ${error.message}`);
    }
  }

  async getMetadata(episodeId) {
    console.log('R2: Getting metadata for episode:', episodeId);
    try {
      const params = {
        Bucket: this.bucket,
        Key: `metadata/${episodeId}.json`
      };

      const response = await this.client.send(new GetObjectCommand(params));
      const body = await response.Body.transformToString();
      const metadata = JSON.parse(body);
      console.log('R2: Retrieved metadata:', {
        id: episodeId,
        hasEmail: !!metadata.email,
        emailFrom: metadata.email?.from
      });
      return metadata;
    } catch (error) {
      console.error('R2: Error getting metadata:', error.name);
      if (error.name === 'NoSuchKey') {
        return null;
      }
      throw error;
    }
  }

  async listEpisodes() {
    console.log('R2: Listing episodes from bucket:', this.bucket);
    try {
      const params = {
        Bucket: this.bucket,
        Prefix: 'metadata/',
        MaxKeys: 1000
      };

      const response = await this.client.send(new ListObjectsV2Command(params));
      console.log('R2: Found', response.Contents?.length || 0, 'metadata files');
      
      if (!response.Contents || response.Contents.length === 0) {
        return [];
      }

      const episodes = [];
      
      for (const item of response.Contents) {
        const episodeId = item.Key.replace('metadata/', '').replace('.json', '');
        console.log('R2: Processing metadata for episode:', episodeId);
        const metadata = await this.getMetadata(episodeId);
        
        if (metadata) {
          console.log('R2: Episode metadata:', {
            id: episodeId,
            title: metadata.title,
            audioUrl: metadata.audioUrl
          });
          episodes.push({
            id: episodeId,
            title: metadata.title,
            description: metadata.description,
            date: metadata.date,
            audioUrl: metadata.audioUrl,
            size: metadata.size,
            duration: metadata.duration,
            email: metadata.email  // Include email metadata for filtering
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
    console.log('R2: Getting audio stream for:', filename);
    try {
      const params = {
        Bucket: this.bucket,
        Key: `podcasts/${filename}`
      };
      console.log('R2: Fetching from bucket:', this.bucket, 'Key:', params.Key);

      // Get object metadata first
      const headResponse = await this.client.send(new HeadObjectCommand(params));
      
      // Get the actual object
      const response = await this.client.send(new GetObjectCommand(params));
      console.log('R2: Got audio stream, content length:', headResponse.ContentLength);
      
      return {
        stream: response.Body,
        contentType: headResponse.ContentType || 'audio/mpeg',
        contentLength: headResponse.ContentLength
      };
    } catch (error) {
      console.error('R2: Error getting audio stream:', error);
      console.error('R2: Error details:', {
        name: error.name,
        code: error.Code,
        statusCode: error.$metadata?.httpStatusCode
      });
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