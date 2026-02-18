import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export const runtime = 'edge';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY || '',
});

// Using a placeholder model - user will configure their preferred model
// This uses Stability AI's Stable Video Diffusion as an example
const MODEL = "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Replicate API key not configured' },
        { status: 500 }
      );
    }

    // Create prediction
    const prediction = await replicate.predictions.create({
      version: MODEL.split(':')[1],
      input: {
        image: prompt, // SVD takes an image, but we'll adapt for text-to-video later
      },
    });

    // Poll for completion
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
  const maxAttempts = 60; // 5 minutes max (60 * 5 seconds)
  const interval = 5000; // 5 seconds

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const prediction = await replicate.predictions.get(predictionId);
    
    if (prediction.status === 'succeeded') {
      // Handle both string and array outputs
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
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  return null; // Timeout
}
