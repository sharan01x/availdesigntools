import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export const runtime = 'nodejs';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY || '',
});

const MODEL = 'xai/grok-2-image';
const PROMPT_STYLE_GUIDE =
  'Photorealistic subject detail with strict graphic tonal rendering. Duotone image using only white and #006BF4. Solid flat #006BF4 background. All shadows and midtones must be created exclusively using clearly visible halftone dot patterns in #006BF4 over white. No smooth gradients. No soft tonal blending. No airbrushing. No grayscale shading. Large, visible circular dot matrix with variable dot size to create depth (newspaper-style screen print effect). High-contrast lighting. Crisp edges. Sharp focus. Modern bold photographic poster aesthetic with mandatory halftone dithering.';

type ImageSizeOption = 'square_min' | 'landscape_hd' | 'portrait_hd';

const IMAGE_SIZE_PRESETS: Record<ImageSizeOption, { promptHint: string }> = {
  square_min: { promptHint: 'Compose for a 1:1 square output (minimum square format).' },
  landscape_hd: { promptHint: 'Compose for a 16:9 HD landscape output (1920x1080).' },
  portrait_hd: { promptHint: 'Compose for a 9:16 HD portrait output (1080x1920).' },
};

async function extractImageUrl(output: unknown): Promise<string | null> {
  if (typeof output === 'string') {
    return output;
  }

  if (output instanceof URL) {
    return output.toString();
  }

  if (Array.isArray(output)) {
    for (const item of output) {
      const extracted = await extractImageUrl(item);
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

    if (typeof candidate.url === 'function') {
      const generatedUrl = await candidate.url();
      if (typeof generatedUrl === 'string') {
        return generatedUrl;
      }

      if (generatedUrl instanceof URL) {
        return generatedUrl.toString();
      }
    }

    if (typeof candidate.toString === 'function') {
      const asString = candidate.toString();
      if (asString.startsWith('http://') || asString.startsWith('https://') || asString.startsWith('data:')) {
        return asString;
      }
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, branded = true, imageSize = 'square_min' } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    const selectedSize =
      typeof imageSize === 'string' && imageSize in IMAGE_SIZE_PRESETS
        ? IMAGE_SIZE_PRESETS[imageSize as ImageSizeOption]
        : IMAGE_SIZE_PRESETS.square_min;

    const shouldApplyBranding = branded !== false;

    const finalPrompt = [
      prompt.trim(),
      shouldApplyBranding ? `Style instructions: ${PROMPT_STYLE_GUIDE}` : null,
      `Size instructions: ${selectedSize.promptHint}`,
      'Output format: PNG.',
    ].filter(Boolean).join('\n\n');

    const output = await replicate.run(MODEL, {
      input: {
        prompt: finalPrompt,
      },
    });

    const imageUrl = await extractImageUrl(output);

    if (!imageUrl) {
      const outputShape =
        typeof output === 'object' && output !== null
          ? { type: output.constructor?.name, keys: Object.keys(output as Record<string, unknown>) }
          : { type: typeof output };

      console.error('Image generated but URL extraction failed:', outputShape);

      return NextResponse.json(
        { success: false, error: 'Image generated but output URL was missing' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
