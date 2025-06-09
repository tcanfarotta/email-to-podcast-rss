import axios from 'axios';

export async function WebFetch(url, prompt) {
  try {
    // Fetch the webpage
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EmailPodcastBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 10000, // 10 second timeout
      maxRedirects: 5,
      responseType: 'text'
    });
    
    // Check content type
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }
    
    const html = response.data;
    
    // Basic HTML to text conversion
    let text = html
      // Remove script and style elements
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // Remove HTML tags
      .replace(/<[^>]+>/g, ' ')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();
    
    // Limit text length to avoid overwhelming the AI
    if (text.length > 5000) {
      text = text.substring(0, 5000) + '...';
    }
    
    return text;
  } catch (error) {
    console.error('WebFetch error:', error.message);
    throw error;
  }
}