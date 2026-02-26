import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export const runtime = 'edge';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY || '',
});

const MODEL = 'deepseek-ai/deepseek-v3.1';

const PROMPT_GENERATOR_SYSTEM_INSTRUCTIONS = `You are an expert visual prompt writer.
Given a short purpose statement or the text that the image needs to represent, produce one high-quality image generation prompt that would serve as a good representation of the core idea. It should include the following:
- Composition details that include the camera angle which is directly in front and flat
- A description of the image elements, making sure that the image is not too busy
- A description of the image lighting as it needs to be cinematic
Return only the final prompt text with no markdown, no labels, and no explanation.`;

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
    const { purpose } = await request.json();

    if (!purpose || typeof purpose !== 'string') {
      return NextResponse.json({ success: false, error: 'Purpose is required' }, { status: 400 });
    }

    const llmPrompt = `${PROMPT_GENERATOR_SYSTEM_INSTRUCTIONS}\n\nPurpose:\n${purpose.trim()}`;

    const output = await replicate.run(MODEL, {
      input: {
        prompt: llmPrompt,
        max_tokens: 220,
        temperature: 0.4,
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
    console.error('Error generating prompt:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
