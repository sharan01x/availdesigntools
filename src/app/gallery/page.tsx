'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Video {
  filename: string;
  url: string;
  createdAt: string;
  size: number;
}

interface GalleryImage {
  filename: string;
  url: string;
  createdAt: string;
  size: number;
}

interface Storyboard {
  id: string;
  title: string;
  concept: string;
  createdAt: string;
  updatedAt: string;
  shotCount: number;
}

export default function Gallery() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'storyboards' | 'videos' | 'images'>('storyboards');

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const [videosResponse, imagesResponse, storyboardsResponse] = await Promise.all([
        fetch('/api/videos'),
        fetch('/api/images'),
        fetch('/api/storyboards'),
      ]);

      const [videosData, imagesData, storyboardsData] = await Promise.all([
        videosResponse.json(),
        imagesResponse.json(),
        storyboardsResponse.json(),
      ]);

      setVideos(videosData.videos || []);
      setImages(imagesData.images || []);
      setStoryboards(storyboardsData.storyboards || []);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const handleDeleteStoryboard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this storyboard?')) return;
    
    try {
      const response = await fetch(`/api/storyboards?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setStoryboards(storyboards.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error('Error deleting storyboard:', error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="https://availproject.org" target="_blank" rel="noopener noreferrer" aria-label="Visit Avail Project website">
            <img src="/images/AvailLogoWorkdmarkBlue.svg" alt="Avail Design Tools" className="h-8 w-auto" />
          </a>
          <Link
            href="/"
            className="brand-link"
          >
            All Tools
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="brand-spinner w-8 h-8 border-4 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setActiveTab('storyboards')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'storyboards'
                    ? 'text-zinc-900 dark:text-zinc-100 border-[var(--brand-primary)]'
                    : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                Storyboards
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('videos')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'videos'
                    ? 'text-zinc-900 dark:text-zinc-100 border-[var(--brand-primary)]'
                    : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                Videos
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('images')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'images'
                    ? 'text-zinc-900 dark:text-zinc-100 border-[var(--brand-primary)]'
                    : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                Images
              </button>
            </div>

            {activeTab === 'storyboards' ? (
              storyboards.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-lg">
                  <p className="text-zinc-600 dark:text-zinc-400">
                    No storyboards saved yet.
                  </p>
                  <Link
                    href="/video-generator"
                    className="brand-link inline-block mt-4"
                  >
                    Create your first storyboard →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {storyboards.map((storyboard) => (
                    <div
                      key={storyboard.id}
                      className="bg-white dark:bg-zinc-800 rounded-lg overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-700 group relative"
                    >
                      <button
                        onClick={() => handleDeleteStoryboard(storyboard.id)}
                        className="absolute top-2 right-2 z-10 w-8 h-8 bg-red-500/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete storyboard"
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
                      <div className="p-4">
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                          {storyboard.title}
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-3">
                          {storyboard.concept}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-3">
                          {storyboard.shotCount} shots
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                          Updated {formatDate(storyboard.updatedAt)}
                        </p>
                        <Link
                          href={`/video-generator?load=${storyboard.id}`}
                          className="brand-link mt-3 inline-block text-sm"
                        >
                          Open →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : activeTab === 'videos' ? (
              videos.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-lg">
                  <p className="text-zinc-600 dark:text-zinc-400">
                    No videos generated yet.
                  </p>
                  <Link
                    href="/video-generator"
                    className="brand-link inline-block mt-4"
                  >
                    Generate your first video →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map((video) => (
                    <div
                      key={video.filename}
                      className="bg-white dark:bg-zinc-800 rounded-lg overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-700"
                    >
                      <video
                        src={video.url}
                        className="w-full aspect-video bg-zinc-100 dark:bg-zinc-900"
                        controls
                      />
                      <div className="p-4">
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                          {formatDate(video.createdAt)}
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300">
                          {formatSize(video.size)}
                        </p>
                        <a
                          href={video.url}
                          download={video.filename}
                          className="brand-link mt-3 inline-block text-sm"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : images.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-lg">
                <p className="text-zinc-600 dark:text-zinc-400">
                  No images generated yet.
                </p>
                <div className="flex gap-4 justify-center mt-4">
                  <Link
                    href="/image-generator"
                    className="brand-link"
                  >
                    Generate image →
                  </Link>
                  <span className="text-zinc-400">or</span>
                  <Link
                    href="/pixel-generator"
                    className="brand-link"
                  >
                    Create pixel icon →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((image) => (
                  <div
                    key={image.filename}
                    className="bg-white dark:bg-zinc-800 rounded-lg overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-700"
                  >
                    <div className="relative w-full aspect-square bg-zinc-100 dark:bg-zinc-900">
                      <Image
                        src={image.url}
                        alt={image.filename}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                        {formatDate(image.createdAt)}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300">
                        {formatSize(image.size)}
                      </p>
                      <a
                        href={image.url}
                        download={image.filename}
                        className="brand-link mt-3 inline-block text-sm"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
