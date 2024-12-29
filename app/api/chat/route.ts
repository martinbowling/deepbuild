import { NextResponse } from 'next/server';
import { HYPERBOLIC_API_URL, HYPERBOLIC_API_KEY, HYPERBOLIC_CHAT_CONFIG } from '@/lib/constants';
import { API_URL, API_KEY, CHAT_CONFIG } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const { messages, type } = await request.json();

    // Forward the request to the actual AI API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        ...CHAT_CONFIG,
        messages: messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        }))
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 