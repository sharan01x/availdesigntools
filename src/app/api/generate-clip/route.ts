import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { downloadAndStoreMedia } from '@/lib/media-storage';

export const runtime = 'nodejs';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY || '',
});

const MODEL = 'prunaai/p-video';

async function extractVideoUrl(output: unknown): Promise<string | null> {
  if (typeof output === 'string') {
    return output;
  }

  if (output instanceof URL) {
    return output.toString();
  }

  if (Array.isArray(output)) {
    for (const item of output) {
      const extracted = await extractVideoUrl(item);
      if (extracted) {
        return extracted;
      }
    }
  }

  if (typeof output === 'object' && output !== null) {
    const candidate = output as { url?: unknown; toString?: () => string };

    if (typeof candidate.url === 'string') {
      return candidate.url;
    }

    if (candidate.url instanceof URL) {
      return candidate.url.toString();
    }

    if (typeof candidate.toString === 'function') {
      const asString = candidate.toString();
      if (asString.startsWith('http://') || asString.startsWith('https://')) {
        return asString;
      }
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, imageUrl, draft = true, duration = 5 } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    const input: Record<string, unknown> = {
      prompt: prompt.trim(),
      draft: draft === true,
      duration: Math.min(Math.max(duration, 1), 10),
      aspect_ratio: '16:9',
      resolution: '720p',
      fps: 24,
      prompt_upsampling: true,
    };

    if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
      input.image = imageUrl;
    }

    const output = await replicate.run(MODEL, { input });

    const videoUrl = await extractVideoUrl(output);

    if (!videoUrl) {
      const outputShape =
        typeof output === 'object' && output !== null
          ? { type: output.constructor?.name, keys: Object.keys(output as Record<string, unknown>) }
          : { type: typeof output };

      console.error('Video generated but URL extraction failed:', outputShape);

      return NextResponse.json(
        { success: false, error: 'Video generated but output URL was missing' },
        { status: 500 }
      );
    }

    const localUrl = await downloadAndStoreMedia(videoUrl, 'video');

    return NextResponse.json({ success: true, videoUrl: localUrl });
  } catch (error) {
    console.error('Error generating clip:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
