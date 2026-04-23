import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

// ВАЖНО: Edge Runtime гарантирует отсутствие буферизации (настоящий стриминг)
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
    });

    // Отдаем чистый поток без кэширования
    return new Response(result.textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(error.message || 'Server Error', { status: 500 });
  }
}