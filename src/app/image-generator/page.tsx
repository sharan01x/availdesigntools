'use client';

import { useState } from 'react';
import Link from 'next/link';
import ImagePreview from '@/components/ImagePreview';

type ImageSizeOption = 'square_500' | 'square_1000' | 'landscape_hd' | 'portrait_hd';

const IMAGE_PREVIEW_ASPECT: Record<ImageSizeOption, string> = {
  square_500: 'aspect-square',
  square_1000: 'aspect-square',
  landscape_hd: 'aspect-[16/9]',
  portrait_hd: 'aspect-[9/16]',
};

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

export default function ImageGeneratorPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [purpose, setPurpose] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBranded, setIsBranded] = useState(true);
  const [imageSize, setImageSize] = useState<ImageSizeOption>('square_500');

  const handleGeneratePrompt = async () => {
    if (!purpose.trim() || isGeneratingPrompt) {
      return;
    }

    setIsGeneratingPrompt(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-image-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: purpose.trim() }),
      });

      const data = await parseApiResponse(response);

      if (!response.ok || !data.success) {
        throw new Error((data.error as string) || 'Failed to generate prompt');
      }

      if (!data.prompt || typeof data.prompt !== 'string') {
        throw new Error('Prompt generation returned an invalid response');
      }

      setPrompt(data.prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim() || isGeneratingImage) {
      return;
    }

    setIsGeneratingImage(true);
    setError(null);
    setImageUrl(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          branded: isBranded,
          imageSize,
        }),
      });

      const data = await parseApiResponse(response);

      if (!response.ok || !data.success) {
        throw new Error((data.error as string) || 'Failed to generate image');
      }

      if (!data.imageUrl) {
        throw new Error('Missing image URL from generation response');
      }

      const generatedImageUrl = data.imageUrl as string;
      setImageUrl(generatedImageUrl);

      await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: `image-${Date.now()}.webp`,
          url: generatedImageUrl,
          size: 0,
        }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGeneratingImage(false);
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
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Generate Images</h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Start with creating a prompt for the image you want to generate or go directly to providing an image generation prompt.
          </p>
        </div>

        <div className="space-y-8">
          <div className="w-full max-w-2xl mx-auto space-y-4">
            <div className="space-y-2">
              <label htmlFor="purpose" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Purpose
              </label>
              <textarea
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Describe what this image is for (e.g., a homepage hero, ad creative, social post)..."
                maxLength={500}
                className="brand-focus w-full h-24 p-4 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGeneratePrompt}
                  disabled={!purpose.trim() || isGeneratingPrompt}
                  className="brand-button px-6 py-3 disabled:bg-zinc-400 disabled:cursor-not-allowed font-medium rounded-lg"
                >
                  {isGeneratingPrompt ? 'Generating Prompt...' : 'Generate Prompt'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="prompt" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Prompt for image composition will appear here, or type your own..."
                maxLength={1000}
                className="brand-focus w-full h-32 p-4 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 resize-none"
              />
            </div>

            <label htmlFor="purpose" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Parameters
            </label>
            <div className="space-y-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Branded</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isBranded}
                  onClick={() => setIsBranded((prev) => !prev)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    isBranded ? 'brand-toggle-on' : 'bg-zinc-400 dark:bg-zinc-600'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      isBranded ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label htmlFor="image-size" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Output Size
                </label>
                <select
                  id="image-size"
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value as ImageSizeOption)}
                  className="brand-focus w-56 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="square_500">Square (500x500)</option>
                  <option value="square_1000">Square (1000x1000)</option>
                  <option value="landscape_hd">Landscape (1920x1080)</option>
                  <option value="portrait_hd">Portrait (1080x1920)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-500">{prompt.length}/1000 characters</span>
              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={!prompt.trim() || isGeneratingImage}
                className="brand-button px-6 py-3 disabled:bg-zinc-400 disabled:cursor-not-allowed font-medium rounded-lg"
              >
                {isGeneratingImage ? 'Generating...' : 'Generate Image'}
              </button>
            </div>
          </div>

          {error && (
            <div className="max-w-2xl mx-auto p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <ImagePreview
            imageUrl={imageUrl}
            isLoading={isGeneratingImage}
            aspectRatioClass={IMAGE_PREVIEW_ASPECT[imageSize]}
          />
        </div>
      </main>
    </div>
  );
}
