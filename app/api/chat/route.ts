import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    const config = getConfig();
    
    // Get the appropriate API URL and key based on selected model
    const apiUrl = config.selectedModel === 'deepseek' 
      ? `${config.apiBase.deepseek}/chat/completions`
      : `${config.apiBase.hyperbolic}/chat/completions`;
    
    const apiKey = config.selectedModel === 'deepseek' 
      ? config.deepseekKey 
      : config.hyperbolicKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: `No API key configured for ${config.selectedModel}` },
        { status: 401 }
      );
    }

    // Get the appropriate chat configuration
    const chatConfig = config.selectedModel === 'deepseek' 
      ? config.deepseekConfig 
      : config.hyperbolicConfig;

    // Set up request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.advanced.requestTimeout);

    // Forward the request to the selected API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        })),
        ...chatConfig
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        provider: config.selectedModel,
        headers: Object.fromEntries(response.headers.entries())
      });
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache the response if enabled
    if (config.advanced.cacheEnabled) {
      // TODO: Implement caching logic
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('API request failed') ? 502 : 500 }
    );
  }
} 