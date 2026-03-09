'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import JSZip from 'jszip';

interface Shot {
  id: number;
  title: string;
  description: string;
  visualPrompt: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
}

interface StoryboardListItem {
  id: string;
  title: string;
  concept: string;
  createdAt: string;
  updatedAt: string;
  shotCount: number;
}

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

function VideoGeneratorContent() {
  const searchParams = useSearchParams();
  const [concept, setConcept] = useState('');
  const [shots, setShots] = useState<Shot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStoryboardId, setCurrentStoryboardId] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedStoryboards, setSavedStoryboards] = useState<StoryboardListItem[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  useEffect(() => {
    if (showLoadModal) {
      fetchSavedStoryboards();
    }
  }, [showLoadModal]);

  const fetchSavedStoryboards = async () => {
    setIsLoadingSaved(true);
    try {
      const response = await fetch('/api/storyboards');
      const data = await parseApiResponse(response);
      if (data.success) {
        setSavedStoryboards(data.storyboards as StoryboardListItem[]);
      }
    } catch (err) {
      console.error('Failed to fetch storyboards:', err);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleGenerateStoryboard = async () => {
    if (!concept.trim()) return;

    setIsLoading(true);
    setError(null);
    setShots([]);
    setCurrentStoryboardId(null);

    try {
      const response = await fetch('/api/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept: concept.trim() }),
      });

      const data = await parseApiResponse(response);

      if (!response.ok || !data.success) {
        throw new Error((data.error as string) || 'Failed to generate storyboard');
      }

      setShots(data.shots as Shot[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteShot = (shotId: number) => {
    setShots(shots.filter((shot) => shot.id !== shotId));
  };

  const handleUpdateDescription = (shotId: number, newDescription: string) => {
    setShots(
      shots.map((shot) =>
        shot.id === shotId ? { ...shot, description: newDescription } : shot
      )
    );
  };

  const handleGenerateImage = async (shotId: number) => {
    const shot = shots.find((s) => s.id === shotId);
    if (!shot) return;

    setShots(
      shots.map((s) =>
        s.id === shotId ? { ...s, isGeneratingImage: true } : s
      )
    );

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: shot.visualPrompt,
          storyboard: true,
          imageSize: 'landscape_hd',
        }),
      });

      const data = await parseApiResponse(response);

      if (!response.ok || !data.success) {
        throw new Error((data.error as string) || 'Failed to generate image');
      }

      setShots(
        shots.map((s) =>
          s.id === shotId
            ? { ...s, imageUrl: data.imageUrl as string, isGeneratingImage: false }
            : s
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
      setShots(
        shots.map((s) =>
          s.id === shotId ? { ...s, isGeneratingImage: false } : s
        )
      );
    }
  };

  const handleSave = async () => {
    if (shots.length === 0) return;

    setIsSaving(true);
    try {
      const url = '/api/storyboards';
      const method = currentStoryboardId ? 'PUT' : 'POST';
      const body = currentStoryboardId
        ? { id: currentStoryboardId, title: currentTitle, concept, shots }
        : { title: currentTitle, concept, shots };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await parseApiResponse(response);

      if (!response.ok || !data.success) {
        throw new Error((data.error as string) || 'Failed to save storyboard');
      }

      const saved = data.storyboard as { id: string; title: string };
      setCurrentStoryboardId(saved.id);
      setCurrentTitle(saved.title);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save storyboard');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = async (id: string) => {
    setIsLoading(true);
    setShowLoadModal(false);
    try {
      const response = await fetch(`/api/storyboards?id=${id}`);
      const data = await parseApiResponse(response);

      if (!response.ok || !data.success) {
        throw new Error((data.error as string) || 'Failed to load storyboard');
      }

      const storyboard = data.storyboard as { id: string; title: string; concept: string; shots: Shot[] };
      setCurrentStoryboardId(storyboard.id);
      setCurrentTitle(storyboard.title);
      setConcept(storyboard.concept);
      setShots(storyboard.shots);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load storyboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadId = searchParams.get('load');
    if (loadId && !isLoading && shots.length === 0) {
      handleLoad(loadId);
    }
  }, [searchParams, isLoading, shots.length]);

  const handleDownload = async () => {
    if (shots.length === 0) return;

    setIsDownloading(true);
    try {
      const zip = new JSZip();

      const storyboardText = `Storyboard: ${currentTitle || 'Untitled'}
Concept: ${concept}

${shots.map((shot, index) => `
--- Shot ${index + 1}: ${shot.title} ---
Description: ${shot.description}
Visual Prompt: ${shot.visualPrompt}
Image URL: ${shot.imageUrl || 'No image generated'}
`).join('\n')}`;

      zip.file('storyboard.txt', storyboardText);

      const imagePromises = shots.map(async (shot, index) => {
        if (shot.imageUrl) {
          try {
            const response = await fetch(shot.imageUrl);
            const blob = await response.blob();
            const ext = shot.imageUrl.includes('.png') ? 'png' : shot.imageUrl.includes('.jpg') || shot.imageUrl.includes('.jpeg') ? 'jpg' : 'webp';
            zip.file(`shot-${String(index + 1).padStart(2, '0')}-${shot.title.replace(/[^a-zA-Z0-9]/g, '-')}.${ext}`, blob);
          } catch {
            console.error(`Failed to download image for shot ${index + 1}`);
          }
        }
      });

      await Promise.all(imagePromises);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(currentTitle || 'storyboard').replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download storyboard');
    } finally {
      setIsDownloading(false);
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
            <Link href="/" className="brand-link">
              All Tools
            </Link>
            <Link href="/gallery" className="brand-link">
              View Gallery →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Storyboard Generator</h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Enter your concept note below to generate a visual storyboard broken into individual shots.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-12">
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
            <label htmlFor="concept" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Concept Note
            </label>
            <textarea
              id="concept"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Describe your video concept... What story do you want to tell? What should happen? What's the mood and setting?"
              className="w-full h-40 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-zinc-500">
                {concept.length} characters
              </span>
              <button
                onClick={handleGenerateStoryboard}
                disabled={!concept.trim() || isLoading}
                className="brand-button px-6 py-3 disabled:bg-zinc-400 disabled:cursor-not-allowed font-medium rounded-lg"
              >
                {isLoading ? 'Generating Storyboard...' : 'Generate Storyboard'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="brand-spinner w-8 h-8"></div>
            <span className="ml-3 text-zinc-600 dark:text-zinc-400">Breaking down your concept into shots...</span>
          </div>
        )}

        {shots.length > 0 && (
          <div className="mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Your Storyboard
              </h3>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                  placeholder="Storyboard title..."
                  className="px-3 py-2 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSave}
                  disabled={isSaving || shots.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-zinc-400 disabled:cursor-not-allowed rounded transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setShowLoadModal(true)}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded transition-colors"
                >
                  Load
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isDownloading || shots.length === 0}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? 'Downloading...' : 'Download ZIP'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shots.map((shot, index) => (
                <div
                  key={shot.id}
                  className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative"
                >
                  <button
                    onClick={() => handleDeleteShot(shot.id)}
                    className="absolute top-2 right-2 z-10 w-8 h-8 bg-red-500/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete shot"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>

                  <div className="relative">
                    <div className="aspect-video bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center overflow-hidden">
                      {shot.imageUrl ? (
                        <img
                          src={shot.imageUrl}
                          alt={shot.title}
                          className="w-full h-full object-cover"
                        />
                      ) : shot.isGeneratingImage ? (
                        <div className="text-center p-4">
                          <div className="brand-spinner w-8 h-8 mx-auto mb-2"></div>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">
                            Generating image...
                          </p>
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center">
                            <span className="text-2xl font-bold text-zinc-400 dark:text-zinc-500">
                              {index + 1}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                            Shot {index + 1}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {shot.title}
                    </div>
                  </div>

                  <div className="p-4">
                    <textarea
                      value={shot.description}
                      onChange={(e) => {
                        handleUpdateDescription(shot.id, e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      className="w-full text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed bg-transparent border-none resize-none focus:outline-none focus:ring-0 p-0 overflow-hidden auto-resize-textarea"
                    />
                    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700">
                      <button
                        onClick={() => handleGenerateImage(shot.id)}
                        disabled={shot.isGeneratingImage}
                        className="w-full text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed py-2 px-3 rounded border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                      >
                        {shot.isGeneratingImage
                          ? 'Generating...'
                          : shot.imageUrl
                          ? 'Regenerate Image'
                          : 'Generate Image'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Load Storyboard</h3>
              <button
                onClick={() => setShowLoadModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {isLoadingSaved ? (
                <div className="flex justify-center py-8">
                  <div className="brand-spinner w-6 h-6"></div>
                </div>
              ) : savedStoryboards.length === 0 ? (
                <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">
                  No saved storyboards found.
                </p>
              ) : (
                <div className="space-y-2">
                  {savedStoryboards.map((sb) => (
                    <button
                      key={sb.id}
                      onClick={() => handleLoad(sb.id)}
                      className="w-full text-left p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                    >
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{sb.title}</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{sb.concept}</div>
                      <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                        {sb.shotCount} shots • Updated {new Date(sb.updatedAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .brand-spinner {
          border: 3px solid #e5e7eb;
          border-top-color: #3271f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .auto-resize-textarea {
          field-sizing: content;
          min-height: 60px;
        }
      `}</style>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
      <div className="brand-spinner w-8 h-8"></div>
    </div>
  );
}

export default function VideoGeneratorPageWrapper() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <VideoGeneratorContent />
    </Suspense>
  );
}
