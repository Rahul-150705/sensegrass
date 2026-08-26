import { NextResponse } from 'next/server';
import { getAllProjects } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/auth-server';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please log in again.' },
        { status: 401 }
      );
    }

    const projects = await getAllProjects(user.id);
    return NextResponse.json({ success: true, projects });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch projects.' },
      { status: 500 }
    );
  }
}
