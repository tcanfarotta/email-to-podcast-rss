import { writeFile, mkdir, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { addPodcastEpisode, getFeedIdForEmail } from './podcastStorage.js';
import OpenAI from 'openai';
import axios from 'axios';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let openai;

export async function processEmail(email) {
  try {
    console.log('Processing email:', email.subject);
    
    // Generate unique ID for this episode
    const episodeId = uuidv4();
    
    // Prepare content for OpenAI
    const content = await prepareEmailContent(email);
    
    console.log('\n========== CONTENT FOR OPENAI ===========');
    console.log('Prepared content length:', content.length);
    console.log('Content preview:', content.substring(0, 500) + '...');
    
    // Generate podcast dialogue using OpenAI
    console.log('\n========== CALLING OPENAI ==========');
    const aiResponse = await generatePodcastDialogue(content, email.subject);
    
    // Parse title and script from response
    const titleMatch = aiResponse.match(/TITLE:\s*(.+?)(?:\n|$)/);
    const scriptMatch = aiResponse.match(/SCRIPT:\s*([\s\S]+)/);
    
    let episodeTitle = titleMatch ? titleMatch[1].trim() : email.subject || 'Untitled Episode';
    // Remove "Fwd:" prefix from titles
    episodeTitle = episodeTitle.replace(/^Fwd:\s*/i, '').trim();
    const podcastScript = scriptMatch ? scriptMatch[1].trim() : aiResponse;
    
    console.log('\n========== OPENAI RESPONSE ==========');
    console.log('Episode Title:', episodeTitle);
    console.log('Script length:', podcastScript.length);
    console.log('Script preview:', podcastScript.substring(0, 500) + '...');
    
    // Generate audio using ElevenLabs
    console.log('Converting to speech with ElevenLabs...');
    const outputFile = join(dirname(dirname(__dirname)), 'storage', 'podcasts', `podcast-${episodeId}.mp3`);
    await generateAudio(podcastScript, outputFile);
    
    // Create episode metadata
    // Clean content for XML - remove binary data and control characters
    const cleanContent = content
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/[^\x20-\x7E\s]/g, '') // Keep only printable ASCII and whitespace
      .trim();
    
    const episode = {
      id: episodeId,
      title: episodeTitle,
      description: `Email from ${email.from} received on ${new Date(email.date).toLocaleDateString()}`,
      content: cleanContent.substring(0, 500) + '...',
      audioFile: `podcast-${episodeId}.mp3`,
      audioUrl: `${process.env.PUBLIC_URL || 'http://localhost:3000'}/podcasts/podcast-${episodeId}.mp3`,
      date: new Date(email.date),
      duration: 300, // Placeholder - you can calculate actual duration later
      author: email.from,
      email: {
        from: email.from,
        to: email.to,
        messageId: email.messageId
      }
    };
    
    // Store episode metadata
    await addPodcastEpisode(episode);
    
    console.log(`Podcast generated successfully: ${episode.audioFile}`);
    
    // Send email reply with RSS feed link
    try {
      const { sendEmailReply } = await import('../utils/emailSender.js');
      const feedId = await getFeedIdForEmail(email.from);
      const rssUrl = `${process.env.PUBLIC_URL || 'http://localhost:3000'}/rss/feed/${feedId}`;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Podcast is Ready! 🎧</h2>
          <p>Hi there,</p>
          <p>Your email "<strong>${episodeTitle}</strong>" has been converted into a podcast episode!</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Listen Now:</h3>
            <p>🎵 <a href="${episode.audioUrl}" style="color: #007bff;">Direct MP3 Link</a></p>
            <p>📱 <a href="${rssUrl}" style="color: #007bff;">Your Personal RSS Feed</a></p>
          </div>
          
          <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Subscribe to Your Personal Podcast Feed:</h3>
            <p>Add this RSS feed to your favorite podcast app:</p>
            <p style="font-family: monospace; background: white; padding: 10px; border-radius: 4px; word-break: break-all;">${rssUrl}</p>
            <p><small>This feed contains all podcasts generated from your emails.</small></p>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Powered by Email to Podcast<br>
            <em>Simply forward any email to this address to convert it into a podcast!</em>
          </p>
        </div>
      `;
      
      const textContent = `
Your Podcast is Ready!

Your email "${episodeTitle}" has been converted into a podcast episode!

Listen Now:
- Direct MP3: ${episode.audioUrl}
- Your RSS Feed: ${rssUrl}

Subscribe to your personal podcast feed in any podcast app using the RSS link above.

Powered by Email to Podcast
      `;
      
      await sendEmailReply(
        email.from,
        process.env.POSTMARK_FROM_EMAIL || 'noreply@yourdomain.com',
        `Re: ${email.subject} - Podcast Ready!`,
        htmlContent,
        textContent
      );
      
      console.log(`Email reply sent to ${email.from} with RSS feed link`);
    } catch (error) {
      console.error('Failed to send email reply:', error);
      // Don't fail the whole process if email sending fails
    }
    
    return episode;
    
  } catch (error) {
    console.error('Error processing email:', error);
    throw error;
  }
}

async function prepareEmailContent(email) {
  let content = '';
  let rawContent = '';
  
  // Get the raw content first
  if (email.htmlBody) {
    // Prefer HTML for better link extraction
    rawContent = email.htmlBody;
    // Convert button/link text to help identify them
    content = email.htmlBody
      // Preserve link context by adding text before removing tags
      .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, ' $2 [$1] ')
      .replace(/<button[^>]*>(.*?)<\/button>/gi, ' $1 ')
      // Then strip remaining HTML
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  } else if (email.textBody) {
    rawContent = email.textBody;
    content = email.textBody;
  }
  
  // Look for "Continue Reading" or "Read More" links specifically
  let contentLinks = [];
  
  // First, try to find links near "continue reading" or "read more" text
  const readMoreRegex = /(continue\s+reading|read\s+more|view\s+article|full\s+article|read\s+full|view\s+full|read\s+online|view\s+online|read\s+on\s+linkedin|keep\s+reading)[\s\S]{0,200}(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;
  let match;
  while ((match = readMoreRegex.exec(rawContent)) !== null) {
    contentLinks.push(match[2]);
  }
  
  // Also look for href links in anchor tags with these texts
  const anchorRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>[\s\S]*?(continue\s+reading|read\s+more|view\s+article|full\s+article|read\s+on\s+linkedin|keep\s+reading)[\s\S]*?<\/a>/gi;
  while ((match = anchorRegex.exec(rawContent)) !== null) {
    if (match[1].startsWith('http')) {
      contentLinks.push(match[1]);
    }
  }
  
  // Special handling for LinkedIn newsletter links (they often have /pulse/ in the URL)
  const linkedinRegex = /https?:\/\/[^\/]*linkedin\.com\/[^\/]*\/pulse\/[^\s<>"{}|\\^`\[\]]+/gi;
  const linkedinMatches = rawContent.match(linkedinRegex) || [];
  contentLinks.push(...linkedinMatches);
  
  // If no "read more" links found, fall back to all links
  if (contentLinks.length === 0) {
    const linkRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
    const allLinks = rawContent.match(linkRegex) || [];
    
    // Filter for article/content links (avoid unsubscribe, tracking, social media links)
    contentLinks = allLinks.filter(link => {
      const lowerLink = link.toLowerCase();
      return !lowerLink.includes('unsubscribe') &&
             !lowerLink.includes('twitter.com') &&
             !lowerLink.includes('facebook.com') &&
             !lowerLink.includes('linkedin.com') &&
             !lowerLink.includes('instagram.com') &&
             !lowerLink.includes('mailto:') &&
             !lowerLink.includes('preferences') &&
             !lowerLink.includes('email-settings') &&
             !lowerLink.includes('tracking') &&
             !lowerLink.includes('click.convertkit') &&
             !lowerLink.includes('list-manage.com') &&
             !lowerLink.includes('campaign-archive');
    });
  }
  
  // Remove duplicates and filter out image/tracking links
  contentLinks = [...new Set(contentLinks)].filter(link => {
    const lowerLink = link.toLowerCase();
    // Skip image files and tracking pixels
    return !lowerLink.endsWith('.png') &&
           !lowerLink.endsWith('.jpg') &&
           !lowerLink.endsWith('.jpeg') &&
           !lowerLink.endsWith('.gif') &&
           !lowerLink.endsWith('.webp') &&
           !lowerLink.includes('/track/') &&
           !lowerLink.includes('superhuman.com') &&
           !lowerLink.includes('pixel');
  });
  
  // If we found potential article links, fetch the content
  if (contentLinks.length > 0) {
    console.log(`\n========== FOUND ${contentLinks.length} CONTENT LINKS ==========`);
    console.log('Priority links (Continue Reading):', contentLinks.slice(0, 3)); // Show first 3
    
    try {
      // Fetch content from the first valid link
      for (const link of contentLinks.slice(0, 3)) { // Try first 3 links
        try {
          console.log(`Fetching content from: ${link}`);
          const { WebFetch } = await import('../utils/webFetch.js');
          const webContent = await WebFetch(link, 'Extract the main article content, ignore navigation, ads, and footers');
          
          // Check if we got actual text content, not binary data
          if (webContent && webContent.length > 500 && !webContent.includes('�PNG') && !webContent.includes('JFIF')) {
            console.log(`Successfully fetched ${webContent.length} characters from ${link}`);
            content = webContent;
            break;
          }
        } catch (error) {
          console.log(`Failed to fetch ${link}:`, error.message);
        }
      }
    } catch (error) {
      console.log('Error fetching web content:', error.message);
    }
  }
  
  // If no web content was fetched, use the email content
  if (!content || content.length < 100) {
    content = rawContent;
  }
  
  // Remove email signatures and forwarding artifacts
  content = content
    .replace(/^-+\s*Forwarded message\s*-+.*$/gm, '')
    .replace(/^From:.*$/gm, '')
    .replace(/^Date:.*$/gm, '')
    .replace(/^Subject:.*$/gm, '')
    .replace(/^To:.*$/gm, '')
    .trim();
  
  return content;
}

async function generatePodcastDialogue(content, subject) {
  // Initialize OpenAI client if not already done
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const messages = [
        {
          role: "system",
          content: `You are a friendly podcast host who converts email content into engaging solo podcast episodes.
          
          Your task:
          1. Create a catchy, descriptive podcast episode title (5-10 words max)
          2. Write the podcast script
          
          Your style:
          - Conversational and natural, like talking to a friend
          - Use casual language and contractions (it's, we're, that's)
          - Include natural pauses and transitions like "Now...", "So...", "Here's the thing..."
          - React naturally to content: "Oh wow!", "That's interesting!", "Let me tell you..."
          - NEVER mention who sent or forwarded the email
          - Focus only on the content and ideas
          
          Format your response EXACTLY like this:
          TITLE: [Your catchy episode title here]
          
          SCRIPT: [Your podcast script here]
          
          Keep the script under 1500 characters. Make it sound like you're having a coffee chat, not reading a script.`
        },
        {
          role: "user",
          content: `Please convert this email into a solo podcast monologue:\n\n${content}`
        }
      ];
      
      console.log('\n--- OpenAI Request Details ---');
      console.log('Model: gpt-4o');
      console.log('Temperature: 0.7');
      console.log('Max tokens: 1500');
      console.log('System prompt:', messages[0].content);
      console.log('User message length:', messages[1].content.length);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        temperature: 0.7,
        max_tokens: 1500
      });

      return response.choices[0].message.content;
    } catch (error) {
      lastError = error;
      console.error(`OpenAI API error (attempt ${attempt}/${maxRetries}):`, error.message);
      
      // Check if it's a rate limit or overload error
      if (error.response?.status === 429 || error.response?.status === 503 || error.message.includes('overloaded')) {
        // Exponential backoff: wait longer between retries
        const waitTime = attempt * 2000; // 2s, 4s, 6s
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // If it's not a retryable error, throw immediately
      throw error;
    }
  }
  
  throw new Error(`Failed to generate podcast dialogue after ${maxRetries} attempts: ${lastError.message}`);
}

async function generateAudio(text, outputFile) {
  const maxRetries = 3;
  let lastError;
  
  console.log(`\n--- ElevenLabs Request ---`);
  console.log(`Text length: ${text.length} characters`);
  
  // For now, use standard text-to-speech
  // The dialogue format will still work - ElevenLabs will read the emotions and speaker names
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID || 'ErXwobaYiN019PkySvjV'}`,
        {
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.5,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY
          },
          responseType: 'stream',
          timeout: 300000 // 5 minute timeout
        }
      );

      // Ensure directory exists
      await mkdir(dirname(outputFile), { recursive: true });

      // Save the audio file
      const writer = fs.createWriteStream(outputFile);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      lastError = error;
      console.error(`ElevenLabs API error (attempt ${attempt}/${maxRetries}):`, error.response?.data || error.message);
      if (error.response?.data) {
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
      
      // Check if it's a rate limit or overload error
      if (error.response?.status === 429 || error.response?.status === 503) {
        // Exponential backoff
        const waitTime = attempt * 3000; // 3s, 6s, 9s
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // If it's not a retryable error, throw immediately
      throw error;
    }
  }
  
  throw new Error(`Failed to generate audio after ${maxRetries} attempts: ${lastError.message}`);
}