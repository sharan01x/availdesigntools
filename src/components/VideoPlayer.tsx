'use client';

interface VideoPlayerProps {
  videoUrl: string | null;
  isLoading: boolean;
}

export default function VideoPlayer({ videoUrl, isLoading }: VideoPlayerProps) {
  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-600 dark:text-zinc-400">Generating your video...</p>
          <p className="text-sm text-zinc-500">This may take a few minutes</p>
        </div>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="w-full max-w-2xl mx-auto aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
        <p className="text-zinc-500">Your generated video will appear here</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <video
        src={videoUrl}
        controls
        className="w-full rounded-lg shadow-lg"
        autoPlay
      />
    </div>
  );
}
