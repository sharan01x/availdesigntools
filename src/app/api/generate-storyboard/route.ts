import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export const runtime = 'edge';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY || '',
});

const MODEL = 'anthropic/claude-3.5-haiku';

const STORYBOARD_SYSTEM_INSTRUCTIONS = `You are an expert animator. You understand how to best deconstruct a story into the most interesting shots in order to tell the story. When provided a story, you can break it down scene-by-scene and then shot by shot and provide descriptions of what happens in each shot.

CRITICAL - CHARACTER/SUBJECT CONSISTENCY:
Before breaking down the story into shots, you MUST:
1. Identify ALL characters, animals, creatures, and significant objects that appear across multiple shots
2. For each one, create a DETAILED visual description that will be used consistently throughout
3. When a character/subject first appears in a shot, describe them in FULL DETAIL (appearance, colors, markings, clothing, distinctive features)
4. In ALL subsequent shots featuring that same character/subject, use THE EXACT SAME visual description

Example of consistency:
- Shot 1: "A golden retriever with floppy ears, a white chest patch, and a red collar sits by the door..."
- Shot 3: "The golden retriever with floppy ears, white chest patch, and red collar runs through the park..." (same description, different action)

Do NOT change descriptions between shots. A brown dog in shot 1 must remain a brown dog in shot 5.

For each shot, provide:
1. A short title (2-4 words)
2. A detailed visual description of what appears in the shot (camera angle, subject, action, setting, movement)
3. A concise image generation prompt that could be used to create a storyboard illustration for this shot

Return your response as a JSON array with this exact structure:
[
  {
    "title": "Shot Title",
    "description": "Detailed visual description of the shot...",
    "visualPrompt": "Concise prompt for generating a storyboard illustration..."
  }
]

Create between 4-8 shots depending on the complexity of the concept. Each shot should advance the narrative and capture key moments.
Make the visualPrompt suitable for a storyboard-style illustration (simple, clear, black and white sketch style).
Return ONLY the JSON array, no markdown, no explanation.`;

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

function parseShots(text: string): Array<{ title: string; description: string; visualPrompt: string }> {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }
    
    return parsed.map((shot, index) => ({
      id: index + 1,
      title: shot.title || `Shot ${index + 1}`,
      description: shot.description || '',
      visualPrompt: shot.visualPrompt || '',
    }));
  } catch (error) {
    console.error('Failed to parse shots:', error, 'Raw text:', text);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { concept } = await request.json();

    if (!concept || typeof concept !== 'string') {
      return NextResponse.json({ success: false, error: 'Concept is required' }, { status: 400 });
    }

    const output = await replicate.run(MODEL, {
      input: {
        prompt: `Break down this story concept into a storyboard:\n\n${concept.trim()}`,
        system_prompt: STORYBOARD_SYSTEM_INSTRUCTIONS,
        max_tokens: 4096,
      },
    });

    const generatedText = extractTextOutput(output);

    if (!generatedText) {
      return NextResponse.json(
        { success: false, error: 'Storyboard generation succeeded but returned empty output' },
        { status: 500 }
      );
    }

    const shots = parseShots(generatedText);

    if (shots.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to parse storyboard shots from generated text' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, shots });
  } catch (error) {
    console.error('Error generating storyboard:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
