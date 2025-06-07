#!/usr/bin/env node

import axios from 'axios';

const webhookUrl = 'http://localhost:3000/webhook/postmark';

const testEmail = {
  From: 'test@example.com',
  FromFull: {
    Email: 'test@example.com',
    Name: 'Test Sender'
  },
  To: 'podcast@yourdomain.com',
  Subject: 'Test Email for Podcast Generation',
  TextBody: `This is a test email that will be converted into a podcast.

The email to podcast service should process this content and generate an audio file.

Here are some key points to discuss:
1. This is an automated test
2. The service uses Podcastfy for text-to-speech
3. The generated podcast will be available via RSS feed

Thank you for testing the email to podcast service!`,
  Date: new Date().toISOString(),
  MessageID: `test-${Date.now()}`
};

async function sendTestWebhook() {
  try {
    console.log('Sending test webhook to:', webhookUrl);
    
    const response = await axios.post(webhookUrl, testEmail, {
      headers: {
        'Content-Type': 'application/json',
        'X-Postmark-Token': process.env.POSTMARK_WEBHOOK_TOKEN || 'test-token'
      }
    });
    
    console.log('Response:', response.status, response.data);
    console.log('\nCheck the RSS feed at: http://localhost:3000/rss/feed.xml');
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

sendTestWebhook();