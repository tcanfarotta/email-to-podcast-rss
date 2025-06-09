import { Router } from 'express';
import { processEmail } from '../services/emailProcessor.js';
import { verifyPostmarkWebhook } from '../utils/postmark.js';

export const webhookRouter = Router();

webhookRouter.post('/postmark', async (req, res) => {
  try {
    // Authentication removed for testing
    const emailData = req.body;
    
    // Log the raw webhook body
    console.log('\n========== WEBHOOK RECEIVED ==========');
    console.log('Raw webhook body:', JSON.stringify(emailData, null, 2));
    
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

    console.log('\n========== EXTRACTED EMAIL ==========');
    console.log(`From: ${email.from}`);
    console.log(`To: ${email.to}`);
    console.log(`Subject: ${email.subject}`);
    console.log(`Date: ${email.date}`);
    console.log(`Has text body: ${!!email.textBody}`);
    console.log(`Has HTML body: ${!!email.htmlBody}`);
    console.log(`Text body preview: ${email.textBody?.substring(0, 200)}...`);

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