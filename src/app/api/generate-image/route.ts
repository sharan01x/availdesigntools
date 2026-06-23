import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { downloadAndStoreMedia, storeBuffer } from '@/lib/blob-storage';

export const runtime = 'nodejs';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY || '',
});

const MODEL = 'black-forest-labs/flux-2-pro';

const PROMPT_STYLE_GUIDE =
  'Photorealistic subject detail with strict graphic tonal rendering. Duotone image using only white and #006BF4. Transparent background - subject isolated on alpha channel. All shadows and midtones must be created exclusively using clearly visible halftone dot patterns in #006BF4 over white. No smooth gradients. No soft tonal blending. No airbrushing. No grayscale shading. Large, visible circular dot matrix with variable dot size to create depth (newspaper-style screen print effect). High-contrast lighting. Crisp edges. Sharp focus. Modern bold photographic poster aesthetic with mandatory halftone dithering.';

const STORYBOARD_STYLE_GUIDE =
  'Pencil sketch illustration style with soft pastel colors. Hand-drawn appearance with visible pencil strokes and cross-hatching. Light, delicate linework with gentle shading. Subtle pastel color accents (soft pinks, blues, yellows, greens) applied with a light touch. Cream or off-white paper background texture. Artistic, storyboard concept art aesthetic. Loose, expressive style rather than photorealistic. Warm, inviting feel suitable for visual storytelling.';

type ImageSizeOption = 'square_min' | 'landscape_hd' | 'portrait_hd';

const ASPECT_RATIOS: Record<ImageSizeOption, string> = {
  square_min: '1:1',
  landscape_hd: '16:9',
  portrait_hd: '9:16',
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
    const body = await request.json();
    const { prompt, branded = true, imageSize = 'square_min', storyboard = false, referenceImage } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    const aspectRatio =
      typeof imageSize === 'string' && imageSize in ASPECT_RATIOS
        ? ASPECT_RATIOS[imageSize as ImageSizeOption]
        : ASPECT_RATIOS.square_min;

    let styleGuide: string | null = null;
    if (storyboard) {
      styleGuide = STORYBOARD_STYLE_GUIDE;
    } else if (branded !== false) {
      styleGuide = PROMPT_STYLE_GUIDE;
    }

    const finalPrompt = [
      prompt.trim(),
      styleGuide ? `Style instructions: ${styleGuide}` : null,
    ].filter(Boolean).join('\n\n');

    // Handle reference image: convert data URL to stored URL if needed
    let referenceImageUrl: string | undefined;

    if (referenceImage && typeof referenceImage === 'string') {
      if (referenceImage.startsWith('data:')) {
        // Data URL — convert to buffer and store
        const matches = referenceImage.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
          const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          referenceImageUrl = await storeBuffer(buffer, 'image', extension);
        } else {
          return NextResponse.json(
            { success: false, error: 'Invalid data URL format for reference image' },
            { status: 400 }
          );
        }
      } else if (referenceImage.startsWith('http://') || referenceImage.startsWith('https://')) {
        // Already a URL — pass directly
        referenceImageUrl = referenceImage;
      }
    }

    // Build input for Replicate
    const input: Record<string, unknown> = {
      prompt: finalPrompt,
      aspect_ratio: aspectRatio,
    };

    if (referenceImageUrl) {
      input.image = referenceImageUrl;
    }

    const output = await replicate.run(MODEL, { input });

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

    const localUrl = await downloadAndStoreMedia(imageUrl, 'image');

    return NextResponse.json({ success: true, imageUrl: localUrl });
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