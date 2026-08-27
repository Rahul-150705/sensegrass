import { NextResponse } from 'next/server';
import { getProjectById, clearChatMessages } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/auth-server';

// Clears only the File Directory Assistant conversation for a project —
// leaves the strategy chat, studio chat, and the file directory itself untouched.
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required.' }, { status: 400 });
    }

    const project = await getProjectById(projectId, user.id);
    if (!project || project.userId !== user.id) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    await clearChatMessages(projectId, 'fileDirectory');

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API /api/file-directory/clear error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to clear file directory chat.' },
      { status: 500 }
    );
  }
}
