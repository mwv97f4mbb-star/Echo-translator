import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

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

    // ПУЛЕНЕПРОБИВАЕМЫЙ СТРИМИНГ ДЛЯ ПРОДАКШЕНА
    // Вручную конвертируем текст в байты (Uint8Array), как требует сервер Vercel
    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const textChunk of result.textStream) {
            controller.enqueue(encoder.encode(textChunk));
          }
        } catch (err) {
          console.error('Stream reading error:', err);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(customStream, {
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