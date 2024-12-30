import { ChatMessage } from './types';
import { getActiveApiKey, getSelectedModel, getActiveChatConfig } from './config';
import { DEEPSEEK_API_URL, HYPERBOLIC_API_URL } from './constants';

export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  const apiKey = getActiveApiKey();
  console.log('Config state:', {
    apiKey: apiKey ? '***' + apiKey.slice(-4) : null,
    model: getSelectedModel(),
    chatConfig: getActiveChatConfig()
  });

  if (!apiKey) {
    throw new Error('No API key configured. Please set up your API key in settings.');
  }

  const model = getSelectedModel();
  const API_URL = model === 'deepseek' ? DEEPSEEK_API_URL : HYPERBOLIC_API_URL;
  const chatConfig = getActiveChatConfig();

  try {
    // Log the request payload
    console.log('API Request:', {
      url: API_URL,
      model,
      config: chatConfig,
      messageCount: messages.length
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages,
        ...chatConfig
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