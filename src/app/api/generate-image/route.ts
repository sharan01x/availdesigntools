import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY || '',
});

const MODEL = 'xai/grok-imagine-image';
const DEFAULT_REFERENCE_IMAGE_PATH = 'reference/sample-image.jpg';
const PROMPT_STYLE_GUIDE =
  'Photorealistic subject detail with strict graphic tonal rendering. Duotone image using only white and #006BF4. Solid flat #006BF4 background. All shadows and midtones must be created exclusively using clearly visible halftone dot patterns in #006BF4 over white. No smooth gradients. No soft tonal blending. No airbrushing. No grayscale shading. Large, visible circular dot matrix with variable dot size to create depth (newspaper-style screen print effect). High-contrast lighting. Crisp edges. Sharp focus. Modern bold photographic poster aesthetic with mandatory halftone dithering.';

type ImageSizeOption = 'square_500' | 'square_1000' | 'landscape_hd' | 'portrait_hd';

const IMAGE_SIZE_PRESETS: Record<ImageSizeOption, { aspectRatio: string }> = {
  square_500: { aspectRatio: '1:1' },
  square_1000: { aspectRatio: '1:1' },
  landscape_hd: { aspectRatio: '16:9' },
  portrait_hd: { aspectRatio: '9:16' },
};

function getMimeTypeForReferenceImage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.jpeg':
    case '.jpg':
    default:
      return 'image/jpeg';
  }
}

async function buildReferenceImageInput(): Promise<string> {
  const envReferenceUrl = process.env.GROK_REFERENCE_IMAGE_URL?.trim() || process.env.FLUX_REFERENCE_IMAGE_URL?.trim();

  if (envReferenceUrl) {
    return envReferenceUrl;
  }

  const localReferencePath = path.join(process.cwd(), 'public', DEFAULT_REFERENCE_IMAGE_PATH);

  try {
    const imageBuffer = await readFile(localReferencePath);
    const mimeType = getMimeTypeForReferenceImage(localReferencePath);
    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
  } catch {
    throw new Error(
      `Reference image not found. Add a file at public/${DEFAULT_REFERENCE_IMAGE_PATH} or set GROK_REFERENCE_IMAGE_URL.`
    );
  }
}

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
    const { prompt, branded = true, imageSize = 'square_500' } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    const selectedSize =
      typeof imageSize === 'string' && imageSize in IMAGE_SIZE_PRESETS
        ? IMAGE_SIZE_PRESETS[imageSize as ImageSizeOption]
        : IMAGE_SIZE_PRESETS.square_500;

    const shouldApplyBranding = branded !== false;

    const finalPrompt = shouldApplyBranding
      ? `${prompt.trim()}\n\nStyle instructions: ${PROMPT_STYLE_GUIDE}`
      : prompt.trim();

    const referenceImageInput = shouldApplyBranding ? await buildReferenceImageInput() : undefined;

    const output = await replicate.run(MODEL, {
      input: {
        prompt: finalPrompt,
        aspect_ratio: selectedSize.aspectRatio,
        ...(referenceImageInput ? { image: referenceImageInput } : {}),
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
