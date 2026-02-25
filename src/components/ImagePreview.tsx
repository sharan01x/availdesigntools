'use client';

import Image from 'next/image';

interface ImagePreviewProps {
  imageUrl: string | null;
  isLoading: boolean;
  aspectRatioClass?: string;
}

export default function ImagePreview({
  imageUrl,
  isLoading,
  aspectRatioClass = 'aspect-square',
}: ImagePreviewProps) {
  if (isLoading) {
    return (
      <div className={`w-full max-w-2xl mx-auto ${aspectRatioClass} bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-600 dark:text-zinc-400">Generating your image...</p>
          <p className="text-sm text-zinc-500">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={`w-full max-w-2xl mx-auto ${aspectRatioClass} bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center`}>
        <p className="text-zinc-500">Your generated image will appear here</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className={`relative w-full ${aspectRatioClass} rounded-lg shadow-lg overflow-hidden`}>
        <Image
          src={imageUrl}
          alt="Generated result"
          fill
          unoptimized
          className="object-cover"
        />
      </div>
    </div>
  );
}
