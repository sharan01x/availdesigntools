import { NextResponse } from 'next/server';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

type GalleryImage = {
  filename: string;
  url: string;
  createdAt: string;
  size: number;
};

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'generated-images');
const DATA_DIR = path.join(process.cwd(), 'data');
const METADATA_PATH = path.join(DATA_DIR, 'images.json');

async function ensureStoragePaths(): Promise<void> {
  await Promise.all([
    mkdir(OUTPUT_DIR, { recursive: true }),
    mkdir(DATA_DIR, { recursive: true }),
  ]);
}

async function readGalleryImages(): Promise<GalleryImage[]> {
  try {
    const raw = await readFile(METADATA_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is GalleryImage => {
        if (typeof item !== 'object' || item === null) return false;
        const candidate = item as Partial<GalleryImage>;
        return (
          typeof candidate.filename === 'string'
          && typeof candidate.url === 'string'
          && typeof candidate.createdAt === 'string'
          && typeof candidate.size === 'number'
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

async function writeGalleryImages(images: GalleryImage[]): Promise<void> {
  await writeFile(METADATA_PATH, JSON.stringify(images, null, 2), 'utf-8');
}

function safeBaseName(filename: string): string {
  return path
    .basename(filename)
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^_+/, '');
}

function extensionForMimeType(mimeType: string): string {
  switch (mimeType.toLowerCase()) {
    case 'image/png':
      return '.png';
    case 'image/jpeg':
    case 'image/jpg':
      return '.jpg';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    default:
      return '.webp';
  }
}

function withGuaranteedExtension(filename: string, ext: string): string {
  const parsed = path.parse(filename);
  return parsed.ext ? filename : `${parsed.name}${ext}`;
}

export async function GET() {
  await ensureStoragePaths();
  const images = await readGalleryImages();
  return NextResponse.json({ images });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { filename?: unknown; url?: unknown; size?: unknown };
    const incomingUrl = typeof payload.url === 'string' ? payload.url.trim() : '';

    if (!incomingUrl) {
      return NextResponse.json({ success: false, error: 'Image URL is required' }, { status: 400 });
    }

    await ensureStoragePaths();

    const requestedFilename = typeof payload.filename === 'string' && payload.filename.trim()
      ? payload.filename.trim()
      : `image-${Date.now()}.webp`;

    let bytes: Buffer;
    let extension = '.webp';

    if (incomingUrl.startsWith('data:image/')) {
      const match = incomingUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

      if (!match) {
        return NextResponse.json({ success: false, error: 'Invalid data URL for image save' }, { status: 400 });
      }

      extension = extensionForMimeType(match[1]);
      bytes = Buffer.from(match[2], 'base64');
    } else {
      const response = await fetch(incomingUrl);

      if (!response.ok) {
        return NextResponse.json({ success: false, error: 'Failed to fetch image for saving' }, { status: 400 });
      }

      const mimeType = response.headers.get('content-type') || 'image/webp';
      extension = extensionForMimeType(mimeType);
      bytes = Buffer.from(await response.arrayBuffer());
    }

    const safeFilename = withGuaranteedExtension(safeBaseName(requestedFilename), extension);
    const uniqueFilename = `${path.parse(safeFilename).name}-${Date.now()}${path.extname(safeFilename)}`;
    const outputPath = path.join(OUTPUT_DIR, uniqueFilename);
    await writeFile(outputPath, bytes);

    const persistedUrl = `/generated-images/${uniqueFilename}`;
    const computedSize = bytes.byteLength;
    const declaredSize = typeof payload.size === 'number' && Number.isFinite(payload.size) ? payload.size : 0;

    const image = {
      filename: uniqueFilename,
      url: persistedUrl,
      createdAt: new Date().toISOString(),
      size: declaredSize > 0 ? declaredSize : computedSize,
    };

    const existing = await readGalleryImages();
    const images = [image, ...existing].slice(0, 50);

    await writeGalleryImages(images);

    return NextResponse.json({ success: true, image });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save image' },
      { status: 500 }
    );
  }
}
