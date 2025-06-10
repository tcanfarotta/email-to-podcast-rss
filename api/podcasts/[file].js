import { getStorageAdapter } from '../src/services/storage/adapter.js';

export default async function handler(req, res) {
  console.log('=== PODCAST FILE REQUEST ===');
  console.log('Method:', req.method);
  console.log('Query:', req.query);
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { file } = req.query;
    console.log('Requested file:', file);
    
    if (!file) {
      return res.status(400).json({ error: 'File parameter required' });
    }

    console.log('Getting storage adapter...');
    const storage = getStorageAdapter();
    console.log('Fetching audio stream for:', file);
    const { stream, contentType, contentLength } = await storage.getAudioStream(file);
    console.log('Stream obtained:', { contentType, contentLength });
    
    res.setHeader('Content-Type', contentType || 'audio/mpeg');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    stream.pipe(res);
  } catch (error) {
    console.error('=== AUDIO STREAMING ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('File requested:', req.query.file);
    
    if (error.message === 'File not found') {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to stream audio',
      details: error.message 
    });
  }
}