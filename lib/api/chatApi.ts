import { Message, ChatResponse, AIResponse } from '@/lib/types';
import { API_URL, API_KEY, CHAT_CONFIG } from '@/lib/constants';

export class ChatApiError extends Error {
  constructor(message: string, public readonly details?: any) {
    super(message);
    this.name = 'ChatApiError';
  }
}

export async function sendChatMessage(messages: Message[]): Promise<AIResponse> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        messages: messages.map(({ role, content }) => ({ role, content })),
        model: CHAT_CONFIG.model,
        max_tokens: CHAT_CONFIG.max_tokens,
        temperature: CHAT_CONFIG.temperature,
        top_p: CHAT_CONFIG.top_p,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ChatApiError(`API request failed: ${response.statusText}`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
    }

    const data: ChatResponse = await response.json();
    
    // For now, just return the message content since we're not parsing file operations yet
    return {
      assistantReply: data.choices[0].message.content,
      filesToCreate: [],
      filesToEdit: []
    };
  } catch (error) {
    console.error('Chat API error:', error);
    if (error instanceof ChatApiError) {
      throw error;
    }
    throw new ChatApiError('Chat API error', error);
  }
}