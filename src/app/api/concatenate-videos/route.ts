import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { downloadAndStoreMedia } from '@/lib/blob-storage';

export const runtime = 'nodejs';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY || '',
});

const MODEL = 'bfirsh/concatenate-videos';

async function extractVideoUrl(output: unknown): Promise<string | null> {
  if (typeof output === 'string') {
    return output;
  }

  if (output instanceof URL) {
    return output.toString();
  }

  if (Array.isArray(output) && output.length > 0) {
    return extractVideoUrl(output[0]);
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
    const { videoUrls } = await request.json();

    if (!Array.isArray(videoUrls) || videoUrls.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 video URLs are required' },
        { status: 400 }
      );
    }

    const validUrls = videoUrls.filter(
      (url): url is string => typeof url === 'string' && url.startsWith('http')
    );

    if (validUrls.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 valid video URLs are required' },
        { status: 400 }
      );
    }

    const output = await replicate.run(MODEL, {
      input: {
        videos: validUrls,
      },
    });

    const videoUrl = await extractVideoUrl(output);

    if (!videoUrl) {
      console.error('Concatenation succeeded but URL extraction failed');
      return NextResponse.json(
        { success: false, error: 'Video concatenated but output URL was missing' },
        { status: 500 }
      );
    }

    const storedUrl = await downloadAndStoreMedia(videoUrl, 'video');

    return NextResponse.json({ success: true, videoUrl: storedUrl });
  } catch (error) {
    console.error('Error concatenating videos:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}