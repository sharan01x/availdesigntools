'use client';

import { useState } from 'react';
import Link from 'next/link';
import PromptInput from '@/components/PromptInput';
import VideoPlayer from '@/components/VideoPlayer';

async function parseApiResponse(response: Response): Promise<Record<string, unknown>> {
  const rawBody = await response.text();

  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    throw new Error(
      response.ok
        ? 'Received an unexpected response from the server. Please try again.'
        : rawBody
    );
  }
}

export default function VideoGeneratorPage() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollForVideo = async (predictionId: string): Promise<string> => {
    const maxAttempts = 120;
    const intervalMs = 5000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`/api/generate?predictionId=${predictionId}`, {
        method: 'GET',
      });

      const data = await parseApiResponse(response);

      if (!response.ok || !data.success) {
        throw new Error((data.error as string) || 'Failed to check video generation status');
      }

      if (data.status === 'succeeded' && data.videoUrl) {
        return data.videoUrl as string;
      }

      if (data.status === 'failed' || data.status === 'canceled') {
        throw new Error((data.error as string) || 'Video generation failed');
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error('Video generation timed out. Please try again.');
  };

  const handleGenerate = async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await parseApiResponse(response);

      if (!response.ok || !data.success) {
        throw new Error((data.error as string) || 'Failed to generate video');
      }

      if (!data.predictionId) {
        throw new Error('Missing prediction ID from generation response');
      }

      const generatedVideoUrl = await pollForVideo(data.predictionId as string);
      setVideoUrl(generatedVideoUrl);

      await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: `video-${Date.now()}.mp4`,
          url: generatedVideoUrl,
          size: 0,
        }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="https://availproject.org" target="_blank" rel="noopener noreferrer" aria-label="Visit Avail Project website">
            <img src="/images/AvailLogoWorkdmarkBlue.svg" alt="Avail Design Tools" className="h-8 w-auto" />
          </a>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="brand-link"
            >
              All Tools
            </Link>
            <Link
              href="/gallery"
              className="brand-link"
            >
              View Gallery →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Generate AI Videos</h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Enter a prompt and let AI create a video for you. Videos are generated using Replicate AI models.
          </p>
        </div>

        <div className="space-y-8">
          <PromptInput
            onSubmit={handleGenerate}
            isLoading={isLoading}
            placeholder="Describe the video you want to generate..."
            submitLabel="Generate Video"
          />

          {error && (
            <div className="max-w-2xl mx-auto p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <VideoPlayer videoUrl={videoUrl} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}
