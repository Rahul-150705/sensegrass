import { NextResponse } from 'next/server';
import { generateStarterUI } from '@/lib/ai';
import { getProjectById, saveProject } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required.' }, { status: 400 });
    }

    const project = await getProjectById(projectId);
    if (!project || !project.blueprint) {
      return NextResponse.json(
        { error: 'Product blueprint not found. Build product blueprint first.' },
        { status: 404 }
      );
    }

    // Generate starter React UI code with Claude Agent
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
