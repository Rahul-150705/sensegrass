import { NextResponse } from 'next/server';
import { generateBlueprint } from '@/lib/ai';
import { getProjectById, saveProject } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required.' }, { status: 400 });
    }

    const existingProject = await getProjectById(projectId);
    if (!existingProject || !existingProject.analysis) {
      return NextResponse.json(
        { error: 'Project analysis not found. Please analyze first.' },
        { status: 404 }
      );
    }

    // Generate Product Blueprint with Claude Agent
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
    });

    return NextResponse.json({
      success: true,
      projectId: updatedProject.id,
      blueprint: updatedProject.blueprint,
    });
  } catch (err: any) {
    console.error('API /api/build error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate product blueprint.' },
      { status: 500 }
    );
  }
}
