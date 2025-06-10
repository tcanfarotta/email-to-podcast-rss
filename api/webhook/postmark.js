import { processEmail } from '../src/services/emailProcessor.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  console.log('=== WEBHOOK RECEIVED ===');
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body preview:', JSON.stringify(req.body).substring(0, 500));
  
  if (req.method !== 'POST') {
    console.log('ERROR: Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Skip webhook token validation for now
  // TODO: Re-enable once Postmark is configured to send the token

  try {
    const emailData = req.body;
    console.log('Email data received:', {
      from: emailData.FromFull?.Email || emailData.From,
      to: emailData.To,
      subject: emailData.Subject,
      hasTextBody: !!emailData.TextBody,
      hasHtmlBody: !!emailData.HtmlBody,
      date: emailData.Date
    });
    
    if (!emailData.FromFull || !emailData.Subject || !emailData.TextBody) {
      console.log('ERROR: Missing required fields:', {
        hasFromFull: !!emailData.FromFull,
        hasSubject: !!emailData.Subject,
        hasTextBody: !!emailData.TextBody
      });
      return res.status(400).json({ error: 'Invalid email data' });
    }

    console.log('Processing email...');
    const result = await processEmail(emailData);
    console.log('Email processed successfully:', result);
    
    res.status(200).json({ 
      success: true, 
      message: 'Email processed successfully',
      episodeId: result.id
    });
  } catch (error) {
    console.error('=== WEBHOOK ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', JSON.stringify(error, null, 2));
    res.status(500).json({ 
      error: 'Failed to process email',
      details: error.message 
    });
  }
}