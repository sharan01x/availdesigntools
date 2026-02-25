import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY || '',
});

const MODEL = 'black-forest-labs/flux-2-pro';
const DEFAULT_REFERENCE_IMAGE_PATH = 'reference/sample-image.jpg';
const PROMPT_STYLE_GUIDE =
  'Styling: A minimalist, two‑tone halftone print in the style of vintage screen‑printed posters. Use only a flat, highly saturated royal blue background and pure white for the subject and any effects. The subject is rendered entirely with circular halftone dots that vary in size to indicate shading and form, with no smooth gradients and no additional colors. Dots are dense in the mid‑tones and shadows and become smaller and more sparse toward lit areas, creating a soft fade into the blue background where details disappear. No outlines, no line art, no black ink, no texture other than the halftone dots. The background is a completely flat blue field with large areas of empty space. Very clean, crisp edges, bold, high‑contrast, print‑ready look.';

type ImageSizeOption = 'square_500' | 'square_1000' | 'landscape_hd' | 'portrait_hd';

const IMAGE_SIZE_PRESETS: Record<ImageSizeOption, { aspectRatio: string; resolution: string }> = {
  square_500: { aspectRatio: '1:1', resolution: '0.25 MP' },
  square_1000: { aspectRatio: '1:1', resolution: '1 MP' },
  landscape_hd: { aspectRatio: '16:9', resolution: '2 MP' },
  portrait_hd: { aspectRatio: '9:16', resolution: '2 MP' },
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
  const envReferenceUrl = process.env.FLUX_REFERENCE_IMAGE_URL?.trim();

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
      `Reference image not found. Add a file at public/${DEFAULT_REFERENCE_IMAGE_PATH} or set FLUX_REFERENCE_IMAGE_URL.`
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

    const inputImages = shouldApplyBranding ? [await buildReferenceImageInput()] : [];

    const output = await replicate.run(MODEL, {
      input: {
        prompt: finalPrompt,
        resolution: selectedSize.resolution,
        aspect_ratio: selectedSize.aspectRatio,
        input_images: inputImages,
        output_format: 'webp',
        output_quality: 80,
        safety_tolerance: 2,
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
