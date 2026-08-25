import { NextResponse } from 'next/server';
import { getAllProjects } from '@/lib/store';

// Helper: extract userId from Bearer token (Supabase JWT sub claim)
function extractUserId(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    // JWT payload is the second segment (base64url encoded)
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString('utf8')
    );
    return payload?.sub || payload?.userId || null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const userId = extractUserId(authHeader);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to view your projects.' },
        { status: 401 }
      );
    }

    const projects = await getAllProjects(userId);
    return NextResponse.json({ success: true, projects });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch projects.' },
      { status: 500 }
    );
  }
}
