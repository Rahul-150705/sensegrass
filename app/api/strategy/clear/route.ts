import { NextResponse } from 'next/server';
import { getProjectById, clearChatMessages } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/auth-server';

// Clears only the Strategy Assistant conversation for a project — leaves the
// Blueprint/Code Copilot chat (stage 'studio') and the analysis itself untouched.
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

    await clearChatMessages(projectId, 'strategy');

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API /api/strategy/clear error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to clear strategy chat.' },
      { status: 500 }
    );
  }
}
