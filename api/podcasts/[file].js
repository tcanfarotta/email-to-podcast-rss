import { getStorageAdapter } from '../../src/services/storage/adapter.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { file } = req.query;
    
    if (!file) {
      return res.status(400).json({ error: 'File parameter required' });
    }

    const storage = getStorageAdapter();
    const { stream, contentType, contentLength } = await storage.getAudioStream(file);
    
    res.setHeader('Content-Type', contentType || 'audio/mpeg');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    stream.pipe(res);
  } catch (error) {
    console.error('Audio streaming error:', error);
    
    if (error.message === 'File not found') {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to stream audio',
      details: error.message 
    });
  }
}