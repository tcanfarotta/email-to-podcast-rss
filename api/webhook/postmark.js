import { processEmail } from '../../src/services/emailProcessor.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const emailData = req.body;
    
    if (!emailData.FromFull || !emailData.Subject || !emailData.TextBody) {
      return res.status(400).json({ error: 'Invalid email data' });
    }

    const result = await processEmail(emailData);
    
    res.status(200).json({ 
      success: true, 
      message: 'Email processed successfully',
      episodeId: result.episodeId
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process email',
      details: error.message 
    });
  }
}