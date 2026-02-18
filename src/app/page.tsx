'use client';

import { useState } from 'react';
import Link from 'next/link';
import PromptInput from '@/components/PromptInput';
import VideoPlayer from '@/components/VideoPlayer';

export default function Home() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate video');
      }

      setVideoUrl(data.videoUrl);
      
      await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: `video-${Date.now()}.mp4`,
          url: data.videoUrl,
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
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Video Generator
          </h1>
          <Link
            href="/gallery"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View Gallery →
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Generate AI Videos
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Enter a prompt and let AI create a video for you. 
            Videos are generated using Replicate AI models.
          </p>
        </div>

        <div className="space-y-8">
          <PromptInput onSubmit={handleGenerate} isLoading={isLoading} />

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
