import { ChatMessage } from './types';
import { API_URL, API_KEY, CHAT_CONFIG } from './constants';

export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  try {
    // Log the request payload
    console.log('API Request Payload:', {
      messages
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        messages,
        ...CHAT_CONFIG
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        headers: Object.fromEntries(response.headers.entries())
      });
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid API Response:', data);
      throw new Error('Invalid response format from API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Chat API error:', error);
    throw error;
  }
}