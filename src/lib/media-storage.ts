import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { put, del, head } from '@vercel/blob';

const isProduction = process.env.VERCEL === '1';

export const LOCAL_MEDIA_DIR = path.join(process.cwd(), 'data', 'media');
export const LOCAL_IMAGES_DIR = path.join(LOCAL_MEDIA_DIR, 'images');
export const LOCAL_VIDEOS_DIR = path.join(LOCAL_MEDIA_DIR, 'videos');

export function generateMediaId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function ensureLocalMediaDirs(): Promise<void> {
  await mkdir(LOCAL_IMAGES_DIR, { recursive: true });
  await mkdir(LOCAL_VIDEOS_DIR, { recursive: true });
}

export async function downloadAndStoreMedia(
  url: string,
  type: 'image' | 'video',
  extension: string = ''
): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch media from ${url}: ${response.status}`);
  }

  if (!extension) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('png')) {
      extension = 'png';
    } else if (contentType.includes('gif')) {
      extension = 'gif';
    } else if (contentType.includes('webp')) {
      extension = 'webp';
    } else if (contentType.includes('mp4')) {
      extension = 'mp4';
    } else if (contentType.includes('webm')) {
      extension = 'webm';
    } else {
      extension = type === 'image' ? 'jpg' : 'mp4';
    }
  }

  const mediaId = generateMediaId();
  const filename = `${mediaId}.${extension}`;

  if (isProduction) {
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const blob = await put(`media/${type}/${filename}`, buffer, {
      access: 'public',
      contentType: type === 'image' 
        ? (extension === 'png' ? 'image/png' : extension === 'gif' ? 'image/gif' : extension === 'webp' ? 'image/webp' : 'image/jpeg')
        : (extension === 'webm' ? 'video/webm' : 'video/mp4'),
    });

    return blob.url;
  } else {
    await ensureLocalMediaDirs();
    
    const dir = type === 'image' ? LOCAL_IMAGES_DIR : LOCAL_VIDEOS_DIR;
    const filePath = path.join(dir, filename);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await writeFile(filePath, buffer);

    return `/api/media/${type}/${filename}`;
  }
}

export async function getMediaPath(
  filename: string,
  type: 'image' | 'video'
): Promise<string | null> {
  if (isProduction) {
    return null;
  }

  const dir = type === 'image' ? LOCAL_IMAGES_DIR : LOCAL_VIDEOS_DIR;
  const filePath = path.join(dir, filename);

  if (existsSync(filePath)) {
    return filePath;
  }

  return null;
}

export async function deleteMedia(
  filename: string,
  type: 'image' | 'video'
): Promise<boolean> {
  if (isProduction) {
    try {
      const blobUrl = `https://${process.env.BLOB_READ_WRITE_TOKEN?.split('_')[0]}.blob.vercel-storage.com/media/${type}/${filename}`;
      await del(blobUrl);
      return true;
    } catch {
      return false;
    }
  }

  const dir = type === 'image' ? LOCAL_IMAGES_DIR : LOCAL_VIDEOS_DIR;
  const filePath = path.join(dir, filename);

  try {
    if (existsSync(filePath)) {
      await unlink(filePath);
      return true;
    }
  } catch {
  }

  return false;
}

export async function mediaExists(url: string): Promise<boolean> {
  if (url.startsWith('http')) {
    if (url.includes('blob.vercel-storage.com')) {
      try {
        const blobInfo = await head(url);
        return !!blobInfo;
      } catch {
        return false;
      }
    }
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  return false;
}

export function extractFilenameFromPath(mediaPath: string): string | null {
  const match = mediaPath.match(/\/api\/media\/(image|video)\/([^/]+)$/);
  return match ? match[2] : null;
}

export function extractFilenameFromUrl(url: string): string | null {
  const match = url.match(/\/media\/(image|video)\/([^/?]+)(?:\?|$)/);
  return match ? match[2] : null;
}
