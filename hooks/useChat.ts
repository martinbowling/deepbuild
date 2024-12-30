import { useState, useEffect, useCallback } from 'react';
import { sendChatMessage } from '@/lib/api';
import { BRIEF_SYSTEM_PROMPT, IMPLEMENTATION_SYSTEM_PROMPT } from '@/lib/constants';
import { ChatMessage as APIChatMessage } from '@/lib/types';
import { getConfig } from '@/lib/config';

interface StoredChatMessage {
  content: string;
  timestamp: number;
  projectId: string;
}

export function useChat() {
  const [messages, setMessages] = useState<StoredChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load messages from localStorage on initial mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chat_messages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chat_messages', JSON.stringify(messages));
  }, [messages]);

  const sendMessage = useCallback(async (message: string, type: 'brief' | 'implementation' = 'implementation') => {
    setIsLoading(true);
    try {
      const systemPrompt = type === 'brief' ? BRIEF_SYSTEM_PROMPT : IMPLEMENTATION_SYSTEM_PROMPT;
      const apiMessages: APIChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ];

      const response = await sendChatMessage(apiMessages);
      console.log('Raw API Response:', response);
      
      // Try to find JSON within final_json tags
      const match = response.match(/<final_json>([^]*?)<\/final_json>/);
      let parsedResponse = null;
      
      if (match) {
        console.log('Found JSON in final_json tags:', match[1]);
        try {
          parsedResponse = JSON.parse(match[1].trim());
          console.log('Parsed Response:', parsedResponse);
        } catch (parseError) {
          console.error('Error parsing JSON from tags:', parseError);
        }
      } else {
        // If no tags found, try to parse the entire response as JSON
        console.log('No final_json tags found, trying to parse entire response');
        try {
          parsedResponse = JSON.parse(response);
          console.log('Parsed entire response as JSON:', parsedResponse);
        } catch (parseError) {
          console.error('Error parsing entire response as JSON:', parseError);
        }
      }

      if (!parsedResponse) {
        console.error('Failed to parse response as JSON:', response);
        return {
          message: response,
          response: null
        };
      }

      return {
        message: response,
        response: parsedResponse
      };
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getProjectMessages = (projectId: string) => {
    return messages.filter(msg => msg.projectId === projectId);
  };

  const addMessage = (content: string, projectId: string) => {
    const newMessage = {
      content,
      timestamp: Date.now(),
      projectId
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const clearProjectMessages = (projectId: string) => {
    setMessages(prev => prev.filter(msg => msg.projectId !== projectId));
  };

  return {
    sendMessage,
    getProjectMessages,
    addMessage,
    clearProjectMessages,
    isLoading
  };
}