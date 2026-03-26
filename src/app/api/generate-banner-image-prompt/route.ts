import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export const runtime = 'edge';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY || '',
});

const MODEL = 'anthropic/claude-3.5-haiku';

const BANNER_IMAGE_PROMPT_INSTRUCTIONS = `You are an expert visual designer for social media banners. Your task is to generate a detailed image generation prompt for a supporting image that will appear on the right side of a banner.

Given the banner's heading and body copy, create a visual prompt that:
1. Complements the message without duplicating text
2. Is visually striking and relevant to the content
3. Works well as a single, impactful image (not a collage or multi-scene)
4. Avoids including text, logos, or watermarks in the image itself
5. Is suitable for a professional social media banner

Return ONLY a concise image generation prompt (1-3 sentences). Do not include any explanation, markdown, or additional text.

Example inputs and outputs:
- Input: Heading: "Grow Your DeFi Protocol", Body: "Access global liquidity across chains"
  Output: "A futuristic visualization of interconnected blockchain networks with glowing nodes and pathways, representing cross-chain liquidity flow, professional tech illustration style"

- Input: Heading: "Build on Arbitrum", Body: "Fast, cheap, and scalable L2 solutions"
  Output: "Sleek abstract representation of speed and scalability with flowing digital streams and geometric shapes in blue and purple tones, modern tech aesthetic"`;

function extractTextOutput(output: unknown): string {
  if (typeof output === 'string') {
    return output.trim();
  }

  if (Array.isArray(output)) {
    return output
      .map((item) => (typeof item === 'string' ? item : ''))
      .join('')
      .trim();
  }

  if (typeof output === 'object' && output !== null) {
    const candidate = output as { text?: unknown; output_text?: unknown };

    if (typeof candidate.text === 'string') {
      return candidate.text.trim();
    }

    if (typeof candidate.output_text === 'string') {
      return candidate.output_text.trim();
    }
  }

  return '';
}

export async function POST(request: NextRequest) {
  try {
    const { heading, bodyCopy } = await request.json();

    if (!heading && !bodyCopy) {
      return NextResponse.json(
        { success: false, error: 'At least heading or bodyCopy is required' },
        { status: 400 }
      );
    }

    const prompt = `Generate a supporting image prompt for a banner with:
${heading ? `Heading: "${heading.trim()}"` : ''}
${bodyCopy ? `Body: "${bodyCopy.trim()}"` : ''}`;

    const output = await replicate.run(MODEL, {
      input: {
        prompt: prompt,
        system_prompt: BANNER_IMAGE_PROMPT_INSTRUCTIONS,
        max_tokens: 512,
      },
    });

    const generatedPrompt = extractTextOutput(output);

    if (!generatedPrompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt generation succeeded but returned empty output' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, prompt: generatedPrompt });
  } catch (error) {
    console.error('Error generating banner image prompt:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
