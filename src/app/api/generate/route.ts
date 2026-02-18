import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export const runtime = 'edge';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY || '',
});

const MODEL = 'google/veo-3';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const prediction = await replicate.predictions.create({
      model: MODEL,
      input: {
        prompt: prompt,
      },
    });

    const videoUrl = await pollForCompletion(prediction.id);

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Video generation timed out or failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      videoUrl,
      predictionId: prediction.id,
    });
  } catch (error) {
    console.error('Error generating video:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}

async function pollForCompletion(predictionId: string): Promise<string | null> {
  const maxAttempts = 120;
  const interval = 5000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const prediction = await replicate.predictions.get(predictionId);
    
    if (prediction.status === 'succeeded') {
      const output = prediction.output;
      if (typeof output === 'string') {
        return output;
      }
      if (Array.isArray(output) && output.length > 0) {
        return output[0];
      }
      return null;
    }
    
    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      return null;
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  return null;
}
