import { NextRequest, NextResponse } from 'next/server';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { put, head } from '@vercel/blob';

export const runtime = 'nodejs';

const isProduction = process.env.VERCEL === '1';

interface Shot {
  id: number;
  title: string;
  description: string;
  visualPrompt: string;
  imageUrl?: string;
  videoUrl?: string;
}

interface Storyboard {
  id: string;
  title: string;
  concept: string;
  shots: Shot[];
  createdAt: string;
  updatedAt: string;
}

const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_STORYBOARDS_PATH = path.join(LOCAL_DATA_DIR, 'storyboards.json');

async function ensureLocalStoragePaths(): Promise<void> {
  await mkdir(LOCAL_DATA_DIR, { recursive: true });
}

async function readStoryboards(): Promise<Storyboard[]> {
  try {
    let raw: string;

    if (isProduction) {
      const blobInfo = await head('storyboards.json');
      if (!blobInfo) {
        return [];
      }
      const response = await fetch(blobInfo.url);
      raw = await response.text();
    } else {
      await ensureLocalStoragePaths();
      raw = await readFile(LOCAL_STORYBOARDS_PATH, 'utf-8');
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is Storyboard => {
        if (typeof item !== 'object' || item === null) return false;
        const candidate = item as Partial<Storyboard>;
        return (
          typeof candidate.id === 'string' &&
          typeof candidate.title === 'string' &&
          typeof candidate.concept === 'string' &&
          Array.isArray(candidate.shots) &&
          typeof candidate.createdAt === 'string' &&
          typeof candidate.updatedAt === 'string'
        );
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch {
    return [];
  }
}

async function writeStoryboards(storyboards: Storyboard[]): Promise<void> {
  const content = JSON.stringify(storyboards, null, 2);

  if (isProduction) {
    await put('storyboards.json', content, {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
    });
  } else {
    await ensureLocalStoragePaths();
    await writeFile(LOCAL_STORYBOARDS_PATH, content, 'utf-8');
  }
}

function generateId(): string {
  return `storyboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function GET(request: NextRequest) {
  try {
    const storyboards = await readStoryboards();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const storyboard = storyboards.find(s => s.id === id);
      if (!storyboard) {
        return NextResponse.json({ success: false, error: 'Storyboard not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, storyboard });
    }

    const listItems = storyboards.map(({ id, title, concept, createdAt, updatedAt, shots }) => ({
      id,
      title,
      concept,
      createdAt,
      updatedAt,
      shotCount: shots.length,
    }));

    return NextResponse.json({ success: true, storyboards: listItems });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch storyboards' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { title?: unknown; concept?: unknown; shots?: unknown };

    const title = typeof body.title === 'string' && body.title.trim()
      ? body.title.trim()
      : `Storyboard ${new Date().toLocaleDateString()}`;
    const concept = typeof body.concept === 'string' ? body.concept : '';
    const shots = Array.isArray(body.shots) ? body.shots : [];

    const now = new Date().toISOString();
    const newStoryboard: Storyboard = {
      id: generateId(),
      title,
      concept,
      shots: shots.map((shot, index) => ({
        id: typeof shot.id === 'number' ? shot.id : index + 1,
        title: typeof shot.title === 'string' ? shot.title : `Shot ${index + 1}`,
        description: typeof shot.description === 'string' ? shot.description : '',
        visualPrompt: typeof shot.visualPrompt === 'string' ? shot.visualPrompt : '',
        imageUrl: typeof shot.imageUrl === 'string' ? shot.imageUrl : undefined,
        videoUrl: typeof shot.videoUrl === 'string' ? shot.videoUrl : undefined,
      })),
      createdAt: now,
      updatedAt: now,
    };

    const existing = await readStoryboards();
    const storyboards = [newStoryboard, ...existing];

    await writeStoryboards(storyboards);

    return NextResponse.json({ success: true, storyboard: newStoryboard });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save storyboard' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as { id?: unknown; title?: unknown; concept?: unknown; shots?: unknown };

    if (typeof body.id !== 'string') {
      return NextResponse.json({ success: false, error: 'Storyboard ID is required' }, { status: 400 });
    }

    const storyboards = await readStoryboards();
    const index = storyboards.findIndex(s => s.id === body.id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Storyboard not found' }, { status: 404 });
    }

    const existing = storyboards[index];
    const updated: Storyboard = {
      ...existing,
      title: typeof body.title === 'string' && body.title.trim() ? body.title.trim() : existing.title,
      concept: typeof body.concept === 'string' ? body.concept : existing.concept,
      shots: Array.isArray(body.shots)
        ? body.shots.map((shot, i) => ({
            id: typeof shot.id === 'number' ? shot.id : i + 1,
            title: typeof shot.title === 'string' ? shot.title : `Shot ${i + 1}`,
            description: typeof shot.description === 'string' ? shot.description : '',
            visualPrompt: typeof shot.visualPrompt === 'string' ? shot.visualPrompt : '',
            imageUrl: typeof shot.imageUrl === 'string' ? shot.imageUrl : undefined,
            videoUrl: typeof shot.videoUrl === 'string' ? shot.videoUrl : undefined,
          }))
        : existing.shots,
      updatedAt: new Date().toISOString(),
    };

    storyboards[index] = updated;
    await writeStoryboards(storyboards);

    return NextResponse.json({ success: true, storyboard: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update storyboard' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Storyboard ID is required' }, { status: 400 });
    }

    const storyboards = await readStoryboards();
    const filtered = storyboards.filter(s => s.id !== id);

    if (filtered.length === storyboards.length) {
      return NextResponse.json({ success: false, error: 'Storyboard not found' }, { status: 404 });
    }

    await writeStoryboards(filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete storyboard' },
      { status: 500 }
    );
  }
}
