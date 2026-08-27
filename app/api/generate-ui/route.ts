import { NextResponse } from 'next/server';
import { generateStarterUI } from '@/lib/ai';
import { getProjectById, saveProject } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { enforceRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const limited = enforceRateLimit(user.id, 'generate-ui', 10, 60_000);
    if (limited) return limited;

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required.' }, { status: 400 });
    }

    const project = await getProjectById(projectId, user.id);
    if (!project || project.userId !== user.id) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }
    if (!project.blueprint) {
      return NextResponse.json(
        { error: 'Product blueprint not found. Build product blueprint first.' },
        { status: 404 }
      );
    }

    // Generate starter React UI code with the Groq code agent
    const uiCode = await generateStarterUI(project.blueprint);

    // Save in Supabase / Store
    const updated = await saveProject({
      id: projectId,
      uiCode,
    });

    return NextResponse.json({
      success: true,
      projectId: updated.id,
      uiCode: updated.uiCode,
    });
  } catch (err: any) {
    console.error('API /api/generate-ui error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate starter UI code.' },
      { status: 500 }
    );
  }
}
