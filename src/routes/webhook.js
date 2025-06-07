import { Router } from 'express';
import { processEmail } from '../services/emailProcessor.js';
import { verifyPostmarkWebhook } from '../utils/postmark.js';

export const webhookRouter = Router();

webhookRouter.post('/postmark', async (req, res) => {
  try {
    // Verify webhook token if configured
    if (process.env.POSTMARK_WEBHOOK_TOKEN) {
      const isValid = verifyPostmarkWebhook(req);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid webhook token' });
      }
    }

    const emailData = req.body;
    
    // Extract email details
    const email = {
      from: emailData.From || emailData.FromFull?.Email,
      to: emailData.To,
      subject: emailData.Subject,
      textBody: emailData.TextBody,
      htmlBody: emailData.HtmlBody,
      date: emailData.Date || new Date().toISOString(),
      messageId: emailData.MessageID,
      attachments: emailData.Attachments || []
    };

    console.log(`Received email from ${email.from} with subject: ${email.subject}`);

    // Process the email asynchronously
    processEmail(email).catch(error => {
      console.error('Error processing email:', error);
    });

    // Respond immediately to Postmark
    res.status(200).json({ message: 'Email received and queued for processing' });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});