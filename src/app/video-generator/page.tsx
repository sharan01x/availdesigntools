'use client';

import { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import JSZip from 'jszip';

interface ClipVersion {
  url: string;
  createdAt: string;
}

interface Shot {
  id: number;
  title: string;
  description: string;
  visualPrompt: string;
  imageUrl?: string;
  clipUrls?: ClipVersion[];
  selectedClipIndex?: number;
  isGeneratingImage?: boolean;
  isGeneratingVideo?: boolean;
}

interface StoryboardListItem {
  id: string;
  title: string;
  concept: string;
  createdAt: string;
  updatedAt: string;
  shotCount: number;
}

const DEFAULT_VIDEO_STYLE_PROMPT = 'Cinematic style, smooth camera movements, professional lighting, high quality video production.';

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
  const [activeTab, setActiveTab] = useState<'storyboard' | 'clips'>('storyboard');

  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedStoryboards, setSavedStoryboards] = useState<StoryboardListItem[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  const [playAllMode, setPlayAllMode] = useState(false);
  const playAllVideoRef = useRef<HTMLVideoElement>(null);

  const [concatenatedVideoUrl, setConcatenatedVideoUrl] = useState<string | null>(null);
  const [isConcatenating, setIsConcatenating] = useState(false);

  const [videoStylePrompt, setVideoStylePrompt] = useState(DEFAULT_VIDEO_STYLE_PROMPT);
  const [showStyleGuideModal, setShowStyleGuideModal] = useState(false);
  const [showVideoLightbox, setShowVideoLightbox] = useState(false);
  const [lightboxVideoUrl, setLightboxVideoUrl] = useState<string | null>(null);
  const [lightboxVideoTitle, setLightboxVideoTitle] = useState<string>('');

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

  const handleGenerateClip = async (shotId: number) => {
    const shot = shots.find((s) => s.id === shotId);
    if (!shot) return;

    setShots(
      shots.map((s) =>
        s.id === shotId ? { ...s, isGeneratingVideo: true } : s
      )
    );

    try {
      const fullPrompt = `${shot.description}\n\nStyle: ${videoStylePrompt}`;

      const response = await fetch('/api/generate-clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          draft: true,
          duration: 5,
        }),
      });

      const data = await parseApiResponse(response);

      if (!response.ok || !data.success) {
        throw new Error((data.error as string) || 'Failed to generate clip');
      }

      const newClip: ClipVersion = {
        url: data.videoUrl as string,
        createdAt: new Date().toISOString(),
      };

      setShots(
        shots.map((s) => {
          if (s.id === shotId) {
            const existingClips = s.clipUrls || [];
            const newClipUrls = [...existingClips, newClip];
            return {
              ...s,
              clipUrls: newClipUrls,
              selectedClipIndex: newClipUrls.length - 1,
              isGeneratingVideo: false,
            };
          }
          return s;
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate clip');
      setShots(
        shots.map((s) =>
          s.id === shotId ? { ...s, isGeneratingVideo: false } : s
        )
      );
    }
  };

  const handleSelectClip = (shotId: number, clipIndex: number) => {
    setShots(
      shots.map((s) =>
        s.id === shotId ? { ...s, selectedClipIndex: clipIndex } : s
      )
    );
  };

  const handlePlayClip = (shot: Shot) => {
    const clipUrl = shot.clipUrls?.[shot.selectedClipIndex ?? 0]?.url;
    if (clipUrl) {
      setLightboxVideoUrl(clipUrl);
      setLightboxVideoTitle(shot.title);
      setShowVideoLightbox(true);
    }
  };

  const handleSave = async () => {
    if (shots.length === 0) return;

    setIsSaving(true);
    try {
      const url = '/api/storyboards';
      const method = currentStoryboardId ? 'PUT' : 'POST';
      const body = currentStoryboardId
        ? { id: currentStoryboardId, title: currentTitle, concept, shots, videoStylePrompt }
        : { title: currentTitle, concept, shots, videoStylePrompt };

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

      const storyboard = data.storyboard as { id: string; title: string; concept: string; shots: Shot[]; videoStylePrompt?: string };
      setCurrentStoryboardId(storyboard.id);
      setCurrentTitle(storyboard.title);
      setConcept(storyboard.concept);
      setShots(storyboard.shots);
      if (storyboard.videoStylePrompt) {
        setVideoStylePrompt(storyboard.videoStylePrompt);
      }
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
Video Style Prompt: ${videoStylePrompt}

${shots.map((shot, index) => `
--- Shot ${index + 1}: ${shot.title} ---
Description: ${shot.description}
Visual Prompt: ${shot.visualPrompt}
Image URL: ${shot.imageUrl || 'No image generated'}
Clip URLs: ${shot.clipUrls?.map(c => c.url).join(', ') || 'No clips generated'}
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

      const videoPromises = shots.map(async (shot, index) => {
        const clipUrl = shot.clipUrls?.[shot.selectedClipIndex ?? 0]?.url;
        if (clipUrl) {
          try {
            const response = await fetch(clipUrl);
            const blob = await response.blob();
            zip.file(`clip-${String(index + 1).padStart(2, '0')}-${shot.title.replace(/[^a-zA-Z0-9]/g, '-')}.mp4`, blob);
          } catch {
            console.error(`Failed to download video for shot ${index + 1}`);
          }
        }
      });

      await Promise.all([...imagePromises, ...videoPromises]);

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

  const shotsWithClips = shots.filter(s => s.clipUrls && s.clipUrls.length > 0);
  const allClipsGenerated = shots.length > 0 && shots.every(s => s.clipUrls && s.clipUrls.length > 0);

  const handlePlayAll = async () => {
    if (shotsWithClips.length === 0) return;

    const clipUrls = shotsWithClips
      .map(shot => shot.clipUrls?.[shot.selectedClipIndex ?? 0]?.url)
      .filter((url): url is string => typeof url === 'string');

    if (clipUrls.length < 2) {
      return;
    }

    setIsConcatenating(true);
    setError(null);

    try {
      const response = await fetch('/api/concatenate-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrls: clipUrls }),
      });

      const data = await parseApiResponse(response);

      if (!response.ok || !data.success) {
        throw new Error((data.error as string) || 'Failed to concatenate videos');
      }

      setConcatenatedVideoUrl(data.videoUrl as string);
      setPlayAllMode(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to concatenate videos');
    } finally {
      setIsConcatenating(false);
    }
  };

  const getCurrentClipUrl = (shot: Shot): string | undefined => {
    return shot.clipUrls?.[shot.selectedClipIndex ?? 0]?.url;
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
              <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setActiveTab('storyboard')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'storyboard'
                      ? 'text-zinc-900 dark:text-zinc-100 border-[var(--brand-primary)]'
                      : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  Storyboard
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('clips')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'clips'
                      ? 'text-zinc-900 dark:text-zinc-100 border-[var(--brand-primary)]'
                      : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  Clips {shotsWithClips.length > 0 && `(${shotsWithClips.length})`}
                </button>
              </div>
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
                  className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <button
                  onClick={() => setShowStyleGuideModal(true)}
                  className="px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded transition-colors flex items-center gap-1"
                  title="Edit video style guide"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715l.815 2.846a4.5 4.5 0 003.09 3.09L24 12l-2.846.813a4.5 4.5 0 00-3.09 3.09L18.259 15.75l-.815-2.846a4.5 4.5 0 00-3.09-3.09L12 8.25l2.846.813a4.5 4.5 0 003.09 3.09z" />
                  </svg>
                </button>
              </div>
            </div>

            {activeTab === 'storyboard' ? (
              <div className="space-y-6">
                {shotsWithClips.length > 0 && (
                  <div className="flex justify-end">
                    <button
                      onClick={handlePlayAll}
                      disabled={isConcatenating}
                      className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isConcatenating ? (
                        <>
                          <div className="brand-spinner w-4 h-4"></div>
                          Concatenating...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                          </svg>
                          Play All
                        </>
                      )}
                    </button>
                  </div>
                )}

                {playAllMode && concatenatedVideoUrl && (
                  <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm">
                    <div className="relative">
                      <video
                        ref={playAllVideoRef}
                        src={concatenatedVideoUrl}
                        className="w-full aspect-video bg-zinc-100 dark:bg-zinc-900"
                        controls
                        autoPlay
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Playing all {shotsWithClips.length} clips concatenated
                      </p>
                      <button
                        onClick={() => {
                          setPlayAllMode(false);
                          setConcatenatedVideoUrl(null);
                        }}
                        className="mt-3 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {shots.map((shot, index) => (
                    <div
                      key={shot.id}
                      className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative flex flex-col"
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
                        {shot.clipUrls && shot.clipUrls.length > 0 && (
                          <button
                            onClick={() => handlePlayClip(shot)}
                            className="absolute bottom-2 right-2 w-10 h-10 bg-blue-500/90 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
                            title="Play clip"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                            </svg>
                          </button>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col">
                        <textarea
                          value={shot.description}
                          onChange={(e) => {
                            handleUpdateDescription(shot.id, e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          className="w-full text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed bg-transparent border-none resize-none focus:outline-none focus:ring-0 p-0 overflow-hidden auto-resize-textarea flex-1"
                        />
                        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700 space-y-2">
                          <button
                            onClick={() => handleGenerateImage(shot.id)}
                            disabled={shot.isGeneratingImage}
                            className="w-full px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {shot.isGeneratingImage
                              ? 'Generating...'
                              : shot.imageUrl
                              ? 'Regenerate Image'
                              : 'Generate Image'}
                          </button>
                          <button
                            onClick={() => handleGenerateClip(shot.id)}
                            disabled={shot.isGeneratingVideo}
                            className="w-full px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {shot.isGeneratingVideo
                              ? 'Creating Clip...'
                              : 'Create Clip'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {shotsWithClips.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-zinc-400 dark:text-zinc-500 mb-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
                    </svg>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                      No clips generated yet.
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-500">
                      Click `Create Clip` on each shot in the Storyboard tab to generate video clips.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-8">
                  {shots.map((shot) => {
                    const clips = shot.clipUrls || [];
                    if (clips.length === 0) return null;

                    return (
                      <div
                        key={shot.id}
                        className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden"
                      >
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{shot.title}</h3>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">{shot.description}</p>
                        </div>
                        <div className="p-4">
                          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3">
                            Select a clip version to use for this shot:
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {clips.map((clip, clipIndex) => (
                              <button
                                key={clipIndex}
                                onClick={() => handleSelectClip(shot.id, clipIndex)}
                                className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                                  shot.selectedClipIndex === clipIndex
                                    ? 'border-blue-500 ring-2 ring-blue-500/30'
                                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                                }`}
                              >
                                <video
                                  src={clip.url}
                                  className="w-full aspect-video bg-zinc-100 dark:bg-zinc-900 object-cover"
                                  muted
                                />
                                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                  v{clipIndex + 1}
                                </div>
                                {shot.selectedClipIndex === clipIndex && (
                                  <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                                    Selected
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                    </div>
                  </>
                )}
              </div>
            )}
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

      {showStyleGuideModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Video Style Guide</h3>
              <button
                onClick={() => setShowStyleGuideModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                This style guide will be appended to each clip generation prompt to define the visual style of your videos.
              </p>
              <textarea
                value={videoStylePrompt}
                onChange={(e) => setVideoStylePrompt(e.target.value)}
                className="w-full h-48 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your video style guide..."
              />
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 flex justify-end gap-2">
              <button
                onClick={() => {
                  setVideoStylePrompt(DEFAULT_VIDEO_STYLE_PROMPT);
                }}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded transition-colors"
              >
                Reset to Default
              </button>
              <button
                onClick={() => setShowStyleGuideModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showVideoLightbox && lightboxVideoUrl && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="max-w-5xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">{lightboxVideoTitle}</h3>
              <button
                onClick={() => {
                  setShowVideoLightbox(false);
                  setLightboxVideoUrl(null);
                }}
                className="text-white/70 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <video
              src={lightboxVideoUrl}
              className="w-full aspect-video bg-black rounded-lg"
              controls
              autoPlay
            />
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
