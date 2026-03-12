import { NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile, listMedia } from '@/lib/blob-storage';

export const runtime = 'nodejs';

type GalleryVideo = {
  filename: string;
  url: string;
  createdAt: string;
  size: number;
};

const GALLERY_FILE = 'gallery-videos.json';

export async function GET() {
  try {
    const videos = await readJsonFile<GalleryVideo[]>(GALLERY_FILE);
    
    if (videos) {
      const sorted = videos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return NextResponse.json({ videos: sorted });
    }

    if (process.env.VERCEL === '1') {
      const mediaList = await listMedia('video');
      const galleryVideos: GalleryVideo[] = mediaList.map(item => ({
        filename: item.url.split('/').pop() || 'unknown',
        url: item.url,
        createdAt: item.uploadedAt.toISOString(),
        size: item.size,
      }));
      
      await writeJsonFile(GALLERY_FILE, galleryVideos);
      
      return NextResponse.json({ videos: galleryVideos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
    }

    return NextResponse.json({ videos: [] });
  } catch (error) {
    console.error('Error fetching gallery videos:', error);
    return NextResponse.json({ videos: [] });
  }
}

export async function POST(request: Request) {
  try {
    const { filename, url, size = 0 } = await request.json() as { filename?: string; url?: string; size?: number };
    
    if (!url) {
      return NextResponse.json({ success: false, error: 'Video URL is required' }, { status: 400 });
    }
    
    const video: GalleryVideo = {
      filename: filename || url.split('/').pop() || `video-${Date.now()}.mp4`,
      url,
      createdAt: new Date().toISOString(),
      size: typeof size === 'number' ? size : 0,
    };
    
    const existing = await readJsonFile<GalleryVideo[]>(GALLERY_FILE) || [];
    const videos = [video, ...existing].slice(0, 100);
    
    await writeJsonFile(GALLERY_FILE, videos);
    
    return NextResponse.json({ success: true, video });
  } catch (error) {
    console.error('Error saving video to gallery:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save video' },
      { status: 500 }
    );
  }
}
