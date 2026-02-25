import { NextResponse } from 'next/server';

export const runtime = 'edge';

const images: Array<{ filename: string; url: string; createdAt: string; size: number }> = [];

export async function GET() {
  return NextResponse.json({ images });
}

export async function POST(request: Request) {
  try {
    const { filename, url, size = 0 } = await request.json();

    const image = {
      filename,
      url,
      createdAt: new Date().toISOString(),
      size,
    };

    images.unshift(image);

    if (images.length > 50) {
      images.pop();
    }

    return NextResponse.json({ success: true, image });
  } catch {
    return NextResponse.json({ error: 'Failed to save image' }, { status: 500 });
  }
}
