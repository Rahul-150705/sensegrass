import { NextResponse } from 'next/server';
import { generateBlueprint } from '@/lib/ai';
import { getProjectById, saveProject } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/auth-server';

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

    const existingProject = await getProjectById(projectId);
    if (!existingProject || existingProject.userId !== user.id) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }
    if (!existingProject.analysis) {
      return NextResponse.json(
        { error: 'Project analysis not found. Please analyze first.' },
        { status: 404 }
      );
    }

    // Step 2 & 3: Generate Blueprint (Groq API) + Fullstack File Code (Claude Code Agent)
    const blueprint = await generateBlueprint(
      existingProject.analysis,
      existingProject.description,
      existingProject.targetCustomer
    );

    // Save updated project
    const updatedProject = await saveProject({
      id: projectId,
      name: blueprint.productName || existingProject.name,
      blueprint,
      generatedFiles: blueprint.generatedFiles || existingProject.generatedFiles,
    });

    return NextResponse.json({
      success: true,
      projectId: updatedProject.id,
      blueprint: updatedProject.blueprint,
      generatedFiles: updatedProject.generatedFiles,
    });
  } catch (err: any) {
    console.error('API /api/build error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate product blueprint.' },
      { status: 500 }
    );
  }
}
