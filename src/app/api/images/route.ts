import { NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile, storeBuffer, listMedia, isProductionEnv } from '@/lib/blob-storage';

export const runtime = 'nodejs';

type GalleryImage = {
  filename: string;
  url: string;
  createdAt: string;
  size: number;
};

const GALLERY_FILE = 'gallery-images.json';

function extensionForMimeType(mimeType: string): string {
  switch (mimeType.toLowerCase()) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'webp';
  }
}

export async function GET() {
  try {
    const images = await readJsonFile<GalleryImage[]>(GALLERY_FILE);
    
    if (images) {
      const sorted = images.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return NextResponse.json({ images: sorted });
    }

    if (isProductionEnv) {
      const mediaList = await listMedia('image');
      const galleryImages: GalleryImage[] = mediaList.map(item => ({
        filename: item.url.split('/').pop() || 'unknown',
        url: item.url,
        createdAt: item.uploadedAt.toISOString(),
        size: item.size,
      }));
      
      await writeJsonFile(GALLERY_FILE, galleryImages);
      
      return NextResponse.json({ images: galleryImages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
    }

    return NextResponse.json({ images: [] });
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    return NextResponse.json({ images: [] });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { filename?: unknown; url?: unknown; size?: unknown };
    const incomingUrl = typeof payload.url === 'string' ? payload.url.trim() : '';

    if (!incomingUrl) {
      return NextResponse.json({ success: false, error: 'Image URL is required' }, { status: 400 });
    }

    let buffer: Buffer;
    let extension = 'webp';

    if (incomingUrl.startsWith('data:image/')) {
      const match = incomingUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

      if (!match) {
        return NextResponse.json({ success: false, error: 'Invalid data URL for image save' }, { status: 400 });
      }

      extension = extensionForMimeType(match[1]);
      buffer = Buffer.from(match[2], 'base64');
    } else {
      const response = await fetch(incomingUrl);

      if (!response.ok) {
        return NextResponse.json({ success: false, error: 'Failed to fetch image for saving' }, { status: 400 });
      }

      const mimeType = response.headers.get('content-type') || 'image/webp';
      extension = extensionForMimeType(mimeType);
      buffer = Buffer.from(await response.arrayBuffer());
    }

    const storedUrl = await storeBuffer(buffer, 'image', extension);
    const filename = storedUrl.split('/').pop() || `image.${extension}`;
    const computedSize = buffer.byteLength;
    const declaredSize = typeof payload.size === 'number' && Number.isFinite(payload.size) ? payload.size : 0;

    const image: GalleryImage = {
      filename,
      url: storedUrl,
      createdAt: new Date().toISOString(),
      size: declaredSize > 0 ? declaredSize : computedSize,
    };

    const existing = await readJsonFile<GalleryImage[]>(GALLERY_FILE) || [];
    const images = [image, ...existing].slice(0, 100);

    await writeJsonFile(GALLERY_FILE, images);

    return NextResponse.json({ success: true, image });
  } catch (error) {
    console.error('Error saving image to gallery:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save image' },
      { status: 500 }
    );
  }
}
