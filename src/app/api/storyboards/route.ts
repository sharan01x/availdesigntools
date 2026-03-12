import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile, generateId } from '@/lib/blob-storage';

export const runtime = 'nodejs';

interface ClipVersion {
  url: string;
  createdAt: string;
}

interface Shot {
  id: number;
  title: string;
  description: string;
  visualPrompt: string;
  imageUrl?: string;
  clipUrls?: ClipVersion[];
  selectedClipIndex?: number;
}

interface Storyboard {
  id: string;
  title: string;
  concept: string;
  shots: Shot[];
  videoStylePrompt?: string;
  createdAt: string;
  updatedAt: string;
}

const STORYBOARDS_FILE = 'storyboards.json';

async function readStoryboards(): Promise<Storyboard[]> {
  const storyboards = await readJsonFile<Storyboard[]>(STORYBOARDS_FILE);
  
  if (!storyboards) {
    return [];
  }

  return storyboards.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

async function writeStoryboards(storyboards: Storyboard[]): Promise<void> {
  await writeJsonFile(STORYBOARDS_FILE, storyboards);
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
    const body = await request.json() as { title?: unknown; concept?: unknown; shots?: unknown; videoStylePrompt?: unknown };

    const title = typeof body.title === 'string' && body.title.trim()
      ? body.title.trim()
      : `Storyboard ${new Date().toLocaleDateString()}`;
    const concept = typeof body.concept === 'string' ? body.concept : '';
    const shots = Array.isArray(body.shots) ? body.shots : [];
    const videoStylePrompt = typeof body.videoStylePrompt === 'string' ? body.videoStylePrompt : undefined;

    const now = new Date().toISOString();
    const newStoryboard: Storyboard = {
      id: `storyboard-${generateId()}`,
      title,
      concept,
      shots: shots.map((shot, index) => ({
        id: typeof shot.id === 'number' ? shot.id : index + 1,
        title: typeof shot.title === 'string' ? shot.title : `Shot ${index + 1}`,
        description: typeof shot.description === 'string' ? shot.description : '',
        visualPrompt: typeof shot.visualPrompt === 'string' ? shot.visualPrompt : '',
        imageUrl: typeof shot.imageUrl === 'string' ? shot.imageUrl : undefined,
        clipUrls: Array.isArray(shot.clipUrls) ? shot.clipUrls : undefined,
        selectedClipIndex: typeof shot.selectedClipIndex === 'number' ? shot.selectedClipIndex : undefined,
      })),
      videoStylePrompt,
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
    const body = await request.json() as { id?: unknown; title?: unknown; concept?: unknown; shots?: unknown; videoStylePrompt?: unknown };

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
            clipUrls: Array.isArray(shot.clipUrls) ? shot.clipUrls : undefined,
            selectedClipIndex: typeof shot.selectedClipIndex === 'number' ? shot.selectedClipIndex : undefined,
          }))
        : existing.shots,
      videoStylePrompt: typeof body.videoStylePrompt === 'string' ? body.videoStylePrompt : existing.videoStylePrompt,
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

    await writeJsonFile(STORYBOARDS_FILE, filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete storyboard' },
      { status: 500 }
    );
  }
}
