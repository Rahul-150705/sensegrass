import { NextResponse } from 'next/server';
import { generateRunInstructions } from '@/lib/ai';
import { getProjectById } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { scaffoldFiles } from '@/lib/scaffold';
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

    // Same scaffold the zip ships, so the instructions match what you download.
    const slug =
      (project.blueprint.productName || project.name || 'recast-app')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'recast-app';
    const have = new Set(files.map((f) => f.path.replace(/^\/+/, '')));
    const merged: ProjectFile[] = [...files];
    for (const [path, content] of Object.entries(scaffoldFiles(slug))) {
      if (!have.has(path)) {
        merged.push({ path, name: path.split('/').pop() || path, type: 'config', language: path.endsWith('.json') ? 'json' : 'typescript', content });
      }
    }

    const instructions = await generateRunInstructions(project.blueprint, merged);
    return NextResponse.json({ success: true, instructions });
  } catch (err: any) {
    console.error('API /api/run-instructions error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate run instructions.' },
      { status: 500 }
    );
  }
}
