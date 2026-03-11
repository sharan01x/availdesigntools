import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

export const MEDIA_DIR = path.join(process.cwd(), 'data', 'media');
export const IMAGES_DIR = path.join(MEDIA_DIR, 'images');
export const VIDEOS_DIR = path.join(MEDIA_DIR, 'videos');

export async function ensureMediaDirs(): Promise<void> {
  await mkdir(IMAGES_DIR, { recursive: true });
  await mkdir(VIDEOS_DIR, { recursive: true });
}

export function generateMediaId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function downloadAndStoreMedia(
  url: string,
  type: 'image' | 'video',
  extension: string = ''
): Promise<string> {
  await ensureMediaDirs();
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch media from ${url}: ${response.status}`);
  }
  
  // Determine extension from content-type or URL if not provided
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
      // Default extensions
      extension = type === 'image' ? 'jpg' : 'mp4';
    }
  }
  
  const mediaId = generateMediaId();
  const filename = `${mediaId}.${extension}`;
  const dir = type === 'image' ? IMAGES_DIR : VIDEOS_DIR;
  const filePath = path.join(dir, filename);
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  await writeFile(filePath, buffer);
  
  // Return the API path to access this media
  return `/api/media/${type}/${filename}`;
}

export async function getMediaPath(
  filename: string,
  type: 'image' | 'video'
): Promise<string | null> {
  const dir = type === 'image' ? IMAGES_DIR : VIDEOS_DIR;
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
  const dir = type === 'image' ? IMAGES_DIR : VIDEOS_DIR;
  const filePath = path.join(dir, filename);
  
  try {
    if (existsSync(filePath)) {
      await unlink(filePath);
      return true;
    }
  } catch {
    // Ignore deletion errors
  }
  
  return false;
}

export function extractFilenameFromPath(mediaPath: string): string | null {
  // Extract filename from paths like "/api/media/image/filename.jpg"
  const match = mediaPath.match(/\/api\/media\/(image|video)\/([^/]+)$/);
  return match ? match[2] : null;
}
