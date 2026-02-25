import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export const runtime = 'edge';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY || '',
});

const MODEL = 'google/gemini-3.1-pro';

const PROMPT_GENERATOR_SYSTEM_INSTRUCTIONS = `You are an expert visual prompt writer.
Given a short purpose statement, produce one high-quality image generation prompt.
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
