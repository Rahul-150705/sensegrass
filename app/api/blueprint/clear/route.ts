import { NextResponse } from 'next/server';
import { getProjectById, clearChatMessages } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/auth-server';

// Clears only the Product Blueprint Assistant conversation for a project —
// leaves the strategy chat, file directory chat, studio chat, and the
// blueprint itself untouched.
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

    await clearChatMessages(projectId, 'blueprint');

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API /api/blueprint/clear error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to clear blueprint chat.' },
      { status: 500 }
    );
  }
}
