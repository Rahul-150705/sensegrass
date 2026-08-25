import { NextResponse } from 'next/server';
import { getAllProjects } from '@/lib/store';
import { verifyJWT } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);

    // Full JWT cryptographic verification via Supabase admin client
    const verified = await verifyJWT(token);
    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please log in again.' },
        { status: 401 }
      );
    }

    const projects = await getAllProjects(verified.id);
    return NextResponse.json({ success: true, projects });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch projects.' },
      { status: 500 }
    );
  }
}
