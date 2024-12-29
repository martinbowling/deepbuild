import { useState, useCallback } from 'react';
import { sendChatMessage } from '@/lib/api';
import { BRIEF_SYSTEM_PROMPT, IMPLEMENTATION_SYSTEM_PROMPT } from '@/lib/constants';
import type { ChatMessage } from '@/lib/types';

export function useChat() {
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (message: string, type: 'brief' | 'implementation' = 'implementation') => {
    setIsLoading(true);
    try {
      const systemPrompt = type === 'brief' ? BRIEF_SYSTEM_PROMPT : IMPLEMENTATION_SYSTEM_PROMPT;
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ];

      const response = await sendChatMessage(messages);
      return response;
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sendMessage,
    isLoading
  };
}