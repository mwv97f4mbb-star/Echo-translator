import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

// ВАЖНО: Возвращаем Edge Runtime. Именно он отключает буферизацию на Vercel!
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { prompt, targetLang } = await req.json();

    if (!prompt) {
      return new Response('Missing parameters', { status: 400 });
    }

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: `You are a real-time translator. Translate to ${targetLang}. Return strictly the translation.`,
      prompt: prompt,
      temperature: 0.2,
    });

    // На Edge-сервере этот метод автоматически разбивает текст на байты и стримит
    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(error.message || 'Server Error', { status: 500 });
  }
}