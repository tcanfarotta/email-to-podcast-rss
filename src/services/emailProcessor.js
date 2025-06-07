import { spawn } from 'child_process';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { addPodcastEpisode } from './podcastStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function processEmail(email) {
  try {
    console.log('Processing email:', email.subject);
    
    // Generate unique ID for this episode
    const episodeId = uuidv4();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Prepare content for Podcastfy
    const content = prepareEmailContent(email);
    
    // Create temporary file for the email content
    const tempDir = join(dirname(dirname(__dirname)), 'temp');
    await mkdir(tempDir, { recursive: true });
    const tempFile = join(tempDir, `email-${episodeId}.txt`);
    await writeFile(tempFile, content);
    
    // Generate podcast using Podcastfy
    const outputFile = join(dirname(dirname(__dirname)), 'storage', 'podcasts', `podcast-${episodeId}.mp3`);
    await generatePodcast(tempFile, outputFile, email.subject);
    
    // Create episode metadata
    const episode = {
      id: episodeId,
      title: email.subject || 'Untitled Email',
      description: `Email from ${email.from} received on ${new Date(email.date).toLocaleDateString()}`,
      content: content.substring(0, 500) + '...',
      audioFile: `podcast-${episodeId}.mp3`,
      audioUrl: `${process.env.PUBLIC_URL || 'http://localhost:3000'}/podcasts/podcast-${episodeId}.mp3`,
      date: new Date(email.date),
      duration: await getAudioDuration(outputFile),
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
    
    // Clean up temp file
    await unlink(tempFile).catch(() => {});
    
    return episode;
    
  } catch (error) {
    console.error('Error processing email:', error);
    throw error;
  }
}

function prepareEmailContent(email) {
  let content = `Email from ${email.from}\n`;
  content += `Subject: ${email.subject}\n`;
  content += `Date: ${new Date(email.date).toLocaleDateString()}\n\n`;
  
  // Use text body if available, otherwise strip HTML
  if (email.textBody) {
    content += email.textBody;
  } else if (email.htmlBody) {
    // Basic HTML stripping (you might want to use a proper HTML parser)
    content += email.htmlBody
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  return content;
}

async function generatePodcast(inputFile, outputFile, title) {
  return new Promise((resolve, reject) => {
    const pythonPath = process.env.PYTHON_PATH || 'python3';
    const wrapperPath = join(dirname(__dirname), 'services', 'podcastfy-wrapper.py');
    
    const python = spawn(pythonPath, [wrapperPath, inputFile, outputFile, title]);
    
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        console.error('Podcastfy stderr:', stderr);
        reject(new Error(`Podcastfy failed: ${stderr}`));
      } else {
        try {
          const result = JSON.parse(stdout);
          if (result.success) {
            resolve();
          } else {
            reject(new Error(result.error || 'Unknown error'));
          }
        } catch (e) {
          // Fallback for non-JSON output
          resolve();
        }
      }
    });
    
    python.on('error', (error) => {
      reject(error);
    });
  });
}

async function getAudioDuration(filePath) {
  // For now, return a placeholder duration
  // You could use ffprobe or another tool to get actual duration
  return 300; // 5 minutes placeholder
}

import { unlink } from 'fs/promises';