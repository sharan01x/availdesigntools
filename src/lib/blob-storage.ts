import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { put, del, head, list } from '@vercel/blob';

const isProduction = process.env.VERCEL === '1';

export const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');
export const LOCAL_MEDIA_DIR = path.join(LOCAL_DATA_DIR, 'media');
export const LOCAL_IMAGES_DIR = path.join(LOCAL_MEDIA_DIR, 'images');
export const LOCAL_VIDEOS_DIR = path.join(LOCAL_MEDIA_DIR, 'videos');

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function ensureLocalDirs(): Promise<void> {
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

  const mediaId = generateId();
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
    await ensureLocalDirs();
    
    const dir = type === 'image' ? LOCAL_IMAGES_DIR : LOCAL_VIDEOS_DIR;
    const filePath = path.join(dir, filename);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await writeFile(filePath, buffer);

    return `/api/media/${type}/${filename}`;
  }
}

export async function storeBuffer(
  buffer: Buffer,
  type: 'image' | 'video',
  extension: string
): Promise<string> {
  const mediaId = generateId();
  const filename = `${mediaId}.${extension}`;

  if (isProduction) {
    const blob = await put(`media/${type}/${filename}`, buffer, {
      access: 'public',
      contentType: type === 'image' 
        ? (extension === 'png' ? 'image/png' : extension === 'gif' ? 'image/gif' : extension === 'webp' ? 'image/webp' : 'image/jpeg')
        : (extension === 'webm' ? 'video/webm' : 'video/mp4'),
    });

    return blob.url;
  } else {
    await ensureLocalDirs();
    
    const dir = type === 'image' ? LOCAL_IMAGES_DIR : LOCAL_VIDEOS_DIR;
    const filePath = path.join(dir, filename);

    await writeFile(filePath, buffer);

    return `/api/media/${type}/${filename}`;
  }
}

export async function getLocalMediaPath(
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
  url: string
): Promise<boolean> {
  if (isProduction) {
    try {
      await del(url);
      return true;
    } catch {
      return false;
    }
  }

  const filename = extractFilenameFromUrl(url);
  const type = url.includes('/image/') ? 'image' : 'video';
  
  if (!filename) return false;

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

export async function readJsonFile<T>(filename: string): Promise<T | null> {
  if (isProduction) {
    try {
      const blobInfo = await head(filename);
      if (!blobInfo) {
        return null;
      }
      const response = await fetch(blobInfo.url);
      const text = await response.text();
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  } else {
    try {
      await mkdir(LOCAL_DATA_DIR, { recursive: true });
      const filePath = path.join(LOCAL_DATA_DIR, filename);
      if (!existsSync(filePath)) {
        return null;
      }
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }
}

export async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  const content = JSON.stringify(data, null, 2);

  if (isProduction) {
    await put(filename, content, {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
    });
  } else {
    await mkdir(LOCAL_DATA_DIR, { recursive: true });
    const filePath = path.join(LOCAL_DATA_DIR, filename);
    await writeFile(filePath, content, 'utf-8');
  }
}

export async function listMedia(type: 'image' | 'video'): Promise<Array<{ url: string; size: number; uploadedAt: Date }>> {
  if (!isProduction) {
    return [];
  }

  try {
    const { blobs } = await list({
      prefix: `media/${type}/`,
    });

    return blobs.map(blob => ({
      url: blob.url,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    }));
  } catch {
    return [];
  }
}

export function extractFilenameFromPath(mediaPath: string): string | null {
  const match = mediaPath.match(/\/api\/media\/(image|video)\/([^/]+)$/);
  return match ? match[2] : null;
}

export function extractFilenameFromUrl(url: string): string | null {
  const match = url.match(/\/media\/(image|video)\/([^/?]+)(?:\?|$)/);
  return match ? match[2] : null;
}

export const isProductionEnv = isProduction;
