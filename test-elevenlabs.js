import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testElevenLabsAPI() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  console.log('Testing ElevenLabs API key:', apiKey?.substring(0, 20) + '...');
  
  try {
    // Test the API key by getting user info
    const response = await axios.get('https://api.elevenlabs.io/v1/user', {
      headers: {
        'xi-api-key': apiKey
      }
    });
    
    console.log('\n✅ API Key is valid!');
    console.log('User info:', JSON.stringify(response.data, null, 2));
    
    // Check subscription
    const subResponse = await axios.get('https://api.elevenlabs.io/v1/user/subscription', {
      headers: {
        'xi-api-key': apiKey
      }
    });
    
    console.log('\nSubscription info:', JSON.stringify(subResponse.data, null, 2));
    
  } catch (error) {
    console.error('\n❌ API Key test failed!');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
  }
}

testElevenLabsAPI();