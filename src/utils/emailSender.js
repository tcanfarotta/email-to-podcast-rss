import axios from 'axios';

export async function sendEmailReply(toEmail, fromEmail, subject, htmlContent, textContent) {
  console.log('=== SENDING EMAIL REPLY ===');
  console.log('To:', toEmail);
  console.log('From:', fromEmail);
  console.log('Subject:', subject);
  console.log('Has server token:', !!process.env.POSTMARK_SERVER_TOKEN);
  
  try {
    // Check if we have Postmark server token
    if (!process.env.POSTMARK_SERVER_TOKEN) {
      console.log('WARNING: No POSTMARK_SERVER_TOKEN configured, skipping email reply');
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
    console.error('=== EMAIL SEND ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error response:', error.response?.data);
    console.error('Status code:', error.response?.status);
    throw error;
  }
}