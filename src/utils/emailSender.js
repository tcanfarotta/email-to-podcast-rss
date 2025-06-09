import axios from 'axios';

export async function sendEmailReply(toEmail, fromEmail, subject, htmlContent, textContent) {
  try {
    // Check if we have Postmark server token
    if (!process.env.POSTMARK_SERVER_TOKEN) {
      console.log('No POSTMARK_SERVER_TOKEN configured, skipping email reply');
      return;
    }
    
    const response = await axios.post(
      'https://api.postmarkapp.com/email',
      {
        From: fromEmail,
        To: toEmail,
        Subject: subject,
        HtmlBody: htmlContent,
        TextBody: textContent,
        ReplyTo: fromEmail,
        MessageStream: 'outbound'
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': process.env.POSTMARK_SERVER_TOKEN
        }
      }
    );
    
    console.log(`Email reply sent to ${toEmail}:`, response.data);
    return response.data;
    
  } catch (error) {
    console.error('Failed to send email reply:', error.response?.data || error.message);
    throw error;
  }
}