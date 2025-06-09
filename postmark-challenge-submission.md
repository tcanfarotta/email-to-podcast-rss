# 🎙️ Email-to-Podcast RSS Feed Generator using Node.js, OpenAI & Postmark

#devchallenge #postmarkchallenge #webdev #api #podcast

A submission for the Postmark Challenge: Inbox Innovators

## 💡 What I Built

Hey dev community! 👋

I built an **Email-to-Podcast RSS Service** that automatically converts emails into podcast episodes! Simply forward any email to the service, and within minutes you'll get a professionally produced podcast episode delivered to your personal RSS feed 🎧.

Here's the magic workflow:

User forwards email ➝ Postmark receives it ➝ Webhook extracts content ➝ 
AI fetches full articles from links ➝ OpenAI writes podcast script ➝ 
ElevenLabs generates natural speech ➝ Episode added to RSS feed ➝
User gets email with podcast links 🎉

![Email to Podcast Flow](https://via.placeholder.com/800x400?text=Email+to+Podcast+Flow)

## 🎥 Live Demo

📧 **Try it yourself:**
Forward any email (newsletter, article, etc.) to your Postmark inbound address
Within 60-90 seconds, you'll receive:
- Direct MP3 download link
- Your personal RSS feed URL
- Subscribe in any podcast app!

![Demo Screenshot](https://via.placeholder.com/800x600?text=Demo+Screenshot)

## 💻 Code Repository

The project is open-source and available on GitHub:
🔗 https://github.com/yourusername/email-to-podcast-rss

Key components:
- `src/routes/webhook.js`: Postmark webhook handler
- `src/services/emailProcessor.js`: AI-powered content processing
- `src/routes/rss.js`: Dynamic RSS feed generation

### Core Webhook Handler
```javascript
// src/routes/webhook.js
webhookRouter.post('/postmark', async (req, res) => {
  const email = {
    from: emailData.From,
    subject: emailData.Subject,
    textBody: emailData.TextBody,
    htmlBody: emailData.HtmlBody
  };

  // Process asynchronously - don't block Postmark
  processEmail(email).catch(error => {
    console.error('Error processing email:', error);
  });

  res.status(200).json({ message: 'Email received' });
});
```

### AI-Powered Processing
```javascript
// src/services/emailProcessor.js
async function processEmail(email) {
  // Extract content, including from "Continue Reading" links
  const content = await prepareEmailContent(email);
  
  // Generate podcast script with OpenAI
  const aiResponse = await generatePodcastDialogue(content, email.subject);
  
  // Convert to speech with ElevenLabs
  await generateAudio(podcastScript, outputFile);
  
  // Add to RSS feed
  await addPodcastEpisode(episode);
  
  // Send email with podcast links
  await sendEmailReply(email.from, episodeTitle, rssUrl);
}
```

## 🛠️ How I Built It

This project was an exciting journey combining email automation, AI, and podcast technology!

### 🧠 The AI Stack

I needed fast, reliable AI services for two tasks:

**Script Generation:**
- ✅ **OpenAI GPT-4o** - Creates natural, conversational podcast scripts
- Transforms dry email content into engaging monologues
- Generates catchy episode titles automatically

**Text-to-Speech:**
- ✅ **ElevenLabs Turbo v2.5** - Natural, expressive voices
- Handles emotions and pacing beautifully
- Fast generation (usually < 30 seconds)

### 🔗 Smart Content Extraction

The coolest feature? **Automatic article fetching!**

Many newsletters just have teasers with "Continue Reading" links. My service:
1. Detects these links intelligently
2. Fetches the full article content
3. Converts it into the podcast script

```javascript
// Intelligent link detection
const readMoreRegex = /(continue\s+reading|read\s+more|view\s+article)[\s\S]{0,200}(https?:\/\/[^\s]+)/gi;

// Fetch and extract main content
const webContent = await WebFetch(link, 'Extract the main article content');
```

### 📻 Personal RSS Feeds

Each email sender gets their own unique RSS feed:
- `https://yoursite.com/rss/feed/{unique-id}`
- Contains only their converted podcasts
- Compatible with all major podcast apps

### 🚀 Production Setup

**Node.js + Express:**
- Modular architecture with separate routers
- Async processing to handle webhooks quickly
- File-based storage for simplicity

**Deployment considerations:**
- Static file serving for MP3s
- Proper CORS headers for RSS feeds
- Error handling with retries for AI services

### 💸 Cost Optimization

To keep costs manageable:
- Implemented caching for repeated content
- Limited script length to ~1500 characters
- Added retry logic with exponential backoff
- File size limits on stored podcasts

### 🔧 Challenges & Solutions

**Challenge 1: Email Loop Prevention**
Initially worried about email loops when sending replies!

**Solution:**
```javascript
// Only process emails TO the service, not FROM it
if (email.from === process.env.POSTMARK_FROM_EMAIL) {
  return; // Skip processing
}
```

**Challenge 2: Content Extraction**
HTML emails are messy - scripts, ads, footers everywhere.

**Solution:**
Built a robust HTML-to-text converter that:
- Preserves link context
- Removes signatures and forwards
- Cleans up email artifacts

**Challenge 3: Rate Limits**
Both OpenAI and ElevenLabs have rate limits.

**Solution:**
```javascript
// Retry with exponential backoff
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    // Make API call
  } catch (error) {
    if (error.response?.status === 429) {
      await new Promise(resolve => 
        setTimeout(resolve, attempt * 2000)
      );
      continue;
    }
  }
}
```

## 🎯 Use Cases

This tool is perfect for:
- 📰 Converting newsletters to podcasts for commutes
- 📚 Making long articles accessible while exercising
- 🎧 Building a personal audio library from emails
- ♿ Accessibility for vision-impaired users

## 🙌 Final Thoughts

This project combines the best of email automation and AI to solve a real problem - we get SO much great content via email but not enough time to read it all!

Big thanks to **Postmark** for their reliable email infrastructure and **Dev.to** for organizing this challenge! 

The magic happens when you combine:
- 📧 Postmark's instant webhooks
- 🤖 OpenAI's creative writing
- 🎙️ ElevenLabs' natural voices
- 📻 RSS for universal distribution

### Try it out!
1. Set up your own instance using the GitHub repo
2. Configure Postmark inbound processing
3. Forward any email and enjoy your podcast!

If you found this interesting, please ⭐ the repo and share your thoughts! 

Have you built something cool with Postmark? I'd love to hear about it in the comments! 💬

---

*Built with ❤️ for the Postmark Inbox Innovators Challenge*