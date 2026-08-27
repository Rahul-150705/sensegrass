import { NextResponse } from 'next/server';
import { generateRunInstructions } from '@/lib/ai';
import { getProjectById } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { ProjectFile } from '@/types';

// Groq-generated "how to run this locally" instructions for the generated code.
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });

    const limited = enforceRateLimit(user.id, 'run-instructions', 10, 60_000);
    if (limited) return limited;

    const { projectId } = await request.json();
    if (!projectId) return NextResponse.json({ error: 'Project ID is required.' }, { status: 400 });

    const project = await getProjectById(projectId, user.id);
    if (!project || project.userId !== user.id) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const files: ProjectFile[] = project.generatedFiles || project.blueprint?.generatedFiles || [];
    if (!project.blueprint || files.length === 0) {
      return NextResponse.json({ error: 'Nothing generated yet. Build the product first.' }, { status: 404 });
    }

    const instructions = await generateRunInstructions(project.blueprint, files);
    return NextResponse.json({ success: true, instructions });
  } catch (err: any) {
    console.error('API /api/run-instructions error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate run instructions.' },
      { status: 500 }
    );
  }
}
