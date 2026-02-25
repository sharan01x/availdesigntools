import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export const runtime = 'edge';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY || '',
});

const MODEL = 'google/veo-3';

function extractVideoUrl(output: unknown): string | null {
  if (typeof output === 'string') {
    return output;
  }

  if (Array.isArray(output) && output.length > 0 && typeof output[0] === 'string') {
    return output[0];
  }

  return null;
}

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

    return NextResponse.json({
      success: true,
      predictionId: prediction.id,
      status: prediction.status,
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

export async function GET(request: NextRequest) {
  const predictionId = request.nextUrl.searchParams.get('predictionId');

  if (!predictionId) {
    return NextResponse.json(
      { success: false, error: 'predictionId is required' },
      { status: 400 }
    );
  }

  try {
    const prediction = await replicate.predictions.get(predictionId);

    if (prediction.status === 'succeeded') {
      const videoUrl = extractVideoUrl(prediction.output);

      if (!videoUrl) {
        return NextResponse.json(
          { success: false, error: 'Video generated but output URL was missing' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        status: prediction.status,
        videoUrl,
        predictionId,
      });
    }

    if (prediction.status === 'failed') {
      return NextResponse.json(
        {
          success: false,
          status: prediction.status,
          error: prediction.error || 'Video generation failed',
          predictionId,
        },
        { status: 500 }
      );
    }

    if (prediction.status === 'canceled') {
      return NextResponse.json(
        {
          success: false,
          status: prediction.status,
          error: 'Video generation was canceled',
          predictionId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: prediction.status,
      predictionId,
    });
  } catch (error) {
    console.error('Error checking prediction status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
