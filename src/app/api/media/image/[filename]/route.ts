import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { getLocalMediaPath } from '@/lib/blob-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const filePath = await getLocalMediaPath(filename, 'image');
    
    if (!filePath) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    
    const fileBuffer = await readFile(filePath);
    
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const contentType = ext === 'png' ? 'image/png' 
      : ext === 'gif' ? 'image/gif'
      : ext === 'webp' ? 'image/webp'
      : 'image/jpeg';
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
}
