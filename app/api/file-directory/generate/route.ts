import { NextResponse } from 'next/server';
import { generateBlueprint, generateFileDirectory } from '@/lib/ai';
import { getProjectById, saveProject } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { enforceRateLimit } from '@/lib/rate-limit';

// Generates the product blueprint (metadata) + the file directory (the
// concrete, reviewable build plan) from the FINALIZED strategy analysis.
// No code is written here — that only happens at /api/build, once the user
// has reviewed/refined this plan and explicitly clicks "Build Product".
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const limited = enforceRateLimit(user.id, 'file-directory-generate', 10, 60_000);
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
    if (!project.analysis) {
      return NextResponse.json(
        { error: 'Strategy analysis not found. Please analyze first.' },
        { status: 404 }
      );
    }

    const [blueprint, fileDirectory] = await Promise.all([
      generateBlueprint(project.analysis, project.description, project.targetCustomer),
      generateFileDirectory(project.analysis, project.description, project.targetCustomer),
    ]);

    const updatedProject = await saveProject({
      id: projectId,
      name: blueprint.productName || project.name,
      blueprint,
      fileDirectory,
    });

    return NextResponse.json({
      success: true,
      projectId: updatedProject.id,
      blueprint: updatedProject.blueprint,
      fileDirectory: updatedProject.fileDirectory,
    });
  } catch (err: any) {
    console.error('API /api/file-directory/generate error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate the product file directory.' },
      { status: 500 }
    );
  }
}
