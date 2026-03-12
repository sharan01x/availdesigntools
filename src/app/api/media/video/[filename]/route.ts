import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { getLocalMediaPath } from '@/lib/blob-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const filePath = await getLocalMediaPath(filename, 'video');
    
    if (!filePath) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    
    const fileBuffer = await readFile(filePath);
    
    const ext = filename.split('.').pop()?.toLowerCase() || 'mp4';
    const contentType = ext === 'webm' ? 'video/webm' : 'video/mp4';
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving video:', error);
    return NextResponse.json({ error: 'Failed to serve video' }, { status: 500 });
  }
}
