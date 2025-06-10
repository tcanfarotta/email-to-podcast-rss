#!/usr/bin/env node

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

let webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/webhook/postmark';

// Postmark webhook format
const testEmail = {
  FromName: 'Test User',
  MessageStream: 'inbound',
  From: 'test@example.com',
  FromFull: {
    Email: 'test@example.com',
    Name: 'Test User',
    MailboxHash: ''
  },
  To: '79d1a0d6395468ed886f0294764d99ca@inbound.postmarkapp.com',
  ToFull: [{
    Email: '79d1a0d6395468ed886f0294764d99ca@inbound.postmarkapp.com',
    Name: '',
    MailboxHash: ''
  }],
  Cc: '',
  CcFull: [],
  Bcc: '',
  BccFull: [],
  OriginalRecipient: '79d1a0d6395468ed886f0294764d99ca@inbound.postmarkapp.com',
  Subject: 'Test: My Amazing Podcast Episode',
  MessageID: 'test-' + Date.now(),
  Date: new Date().toISOString(),
  TextBody: `This is a test email for local development.

Here's an interesting topic for today's podcast:

The rapid advancement of AI technology is transforming how we work and live. From ChatGPT to autonomous vehicles, artificial intelligence is becoming increasingly integrated into our daily lives. But what does this mean for the future of human creativity and employment?

Let's explore the opportunities and challenges that lie ahead as we navigate this new technological landscape.

This test email should be converted into a podcast episode using AI text-to-speech technology.`,
  HtmlBody: `<html><body>
<p>This is a test email for local development.</p>
<p>Here's an interesting topic for today's podcast:</p>
<p>The rapid advancement of AI technology is transforming how we work and live. From ChatGPT to autonomous vehicles, artificial intelligence is becoming increasingly integrated into our daily lives. But what does this mean for the future of human creativity and employment?</p>
<p>Let's explore the opportunities and challenges that lie ahead as we navigate this new technological landscape.</p>
<p>This test email should be converted into a podcast episode using AI text-to-speech technology.</p>
</body></html>`,
  Tag: '',
  Headers: [
    { Name: 'X-Spam-Status', Value: 'No' },
    { Name: 'X-Spam-Score', Value: '-0.1' }
  ],
  Attachments: []
};

async function sendTestWebhook() {
  try {
    console.log('Sending test webhook to:', webhookUrl);
    console.log('Email subject:', testEmail.Subject);
    console.log('From:', testEmail.From);
    
    const response = await axios.post(webhookUrl, testEmail, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Postmark'
      }
    });
    
    console.log('\n✅ Success! Response:', response.data);
    
    if (response.data.episodeId) {
      const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
      console.log('\n🎧 Your test podcast is ready!');
      console.log(`📱 RSS Feed: ${baseUrl}/rss/feed.xml`);
      console.log(`🎵 Direct MP3: ${baseUrl}/podcasts/podcast-${response.data.episodeId}.mp3`);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 500) {
      console.error('\nCheck the server logs for more details.');
    }
  }
}

// Add command line options
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(`
Email to Podcast - Test Webhook

Usage: npm run test:webhook [options]

Options:
  --help     Show this help message
  --prod     Send to production (uses PUBLIC_URL from env)
  
Environment variables:
  WEBHOOK_URL   Override the webhook URL
  PUBLIC_URL    Set the base URL for generated links
  
Examples:
  npm run test:webhook                    # Test locally
  npm run test:webhook --prod             # Test production
  WEBHOOK_URL=https://custom.com/webhook npm run test:webhook
  `);
  process.exit(0);
}

if (args.includes('--prod') && process.env.PUBLIC_URL) {
  webhookUrl = `${process.env.PUBLIC_URL}/webhook/postmark`;
  console.log('🚀 Testing production webhook...\n');
} else {
  console.log('🏠 Testing local webhook...\n');
}

sendTestWebhook();