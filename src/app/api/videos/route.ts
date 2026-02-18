import { NextResponse } from 'next/server';

export const runtime = 'edge';

const videos: Array<{ filename: string; url: string; createdAt: string; size: number }> = [];

export async function GET() {
  return NextResponse.json({ videos });
}

export async function POST(request: Request) {
  try {
    const { filename, url, size = 0 } = await request.json();
    
    const video = {
      filename,
      url,
      createdAt: new Date().toISOString(),
      size,
    };
    
    videos.unshift(video);
    
    if (videos.length > 50) {
      videos.pop();
    }
    
    return NextResponse.json({ success: true, video });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save video' },
      { status: 500 }
    );
  }
}
