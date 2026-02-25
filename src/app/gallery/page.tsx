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

interface Image {
  filename: string;
  url: string;
  createdAt: string;
  size: number;
}

export default function Gallery() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const [videosResponse, imagesResponse] = await Promise.all([
        fetch('/api/videos'),
        fetch('/api/images'),
      ]);

      const [videosData, imagesData] = await Promise.all([
        videosResponse.json(),
        imagesResponse.json(),
      ]);

      setVideos(videosData.videos || []);
      setImages(imagesData.images || []);
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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Avail Design Tools Gallery
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              All Tools
            </Link>
            <Link
              href="/video-generator"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Video Generator
            </Link>
            <Link
              href="/image-generator"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Image Generator
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
                Generated Videos
              </h2>

              {videos.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-lg">
                  <p className="text-zinc-600 dark:text-zinc-400">
                    No videos generated yet.
                  </p>
                  <Link
                    href="/video-generator"
                    className="inline-block mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400"
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
                          className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
                Generated Images
              </h2>

              {images.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-lg">
                  <p className="text-zinc-600 dark:text-zinc-400">
                    No images generated yet.
                  </p>
                  <Link
                    href="/image-generator"
                    className="inline-block mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Generate your first image →
                  </Link>
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
                          className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
