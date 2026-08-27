import { NextResponse } from 'next/server';
import { buildFiles } from '@/lib/ai';
import { getProjectById, saveProject } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { GroqRateLimitError, GroqGenerationError } from '@/lib/groq';
import { ProjectFile } from '@/types';

// Writes real code for the files in the FINALIZED file directory
// (project.fileDirectory) — the exact file list the user already reviewed
// on the Strategy page. Optionally scoped to a single `category`
// (frontend/backend/config/database) so the client can call this once per
// category and show real, incremental build progress instead of one long
// opaque wait.
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // Generous — the client issues one call per file category (plus cooldown
    // retries) during a single build. This only trips on genuine abuse.
    const limited = enforceRateLimit(user.id, 'build', 60, 60_000);
    if (limited) return limited;

    const body = await request.json();
    const { projectId, category } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required.' }, { status: 400 });
    }

    const project = await getProjectById(projectId, user.id);
    if (!project || project.userId !== user.id) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }
    if (!project.blueprint) {
      return NextResponse.json(
        { error: 'Product blueprint not found. Generate the file directory first.' },
        { status: 404 }
      );
    }
    if (!project.fileDirectory || project.fileDirectory.files.length === 0) {
      return NextResponse.json(
        { error: 'File directory not found. Generate the file directory first.' },
        { status: 404 }
      );
    }

    const plannedFiles = category
      ? project.fileDirectory.files.filter((f) => f.type === category)
      : project.fileDirectory.files;

    if (plannedFiles.length === 0) {
      return NextResponse.json({
        success: true,
        category: category || null,
        files: [],
        generatedFiles: project.generatedFiles || [],
      });
    }

    // Stub out the exact files the file directory planned — Build never
    // invents a different file list than what was shown for review.
    const stubFiles: ProjectFile[] = plannedFiles.map((f) => ({
      path: f.path,
      name: f.name,
      type: f.type,
      language: f.language,
      content: `// Placeholder generated for ${f.path}`,
    }));

    let generatedForCategory: ProjectFile[];
    try {
      generatedForCategory = await buildFiles(project.blueprint, stubFiles);
    } catch (err: any) {
      if (err instanceof GroqRateLimitError) {
        return NextResponse.json(
          {
            error: 'Rate limited by Groq. Please retry in about a minute.',
            rateLimited: true,
          },
          { status: 429 }
        );
      }
      if (err instanceof GroqGenerationError) {
        // Generation failed — return an error and DO NOT save anything, so the
        // category isn't persisted as blank placeholder files.
        return NextResponse.json(
          { error: err.message || 'Code generation failed. No files were saved.', generationFailed: true },
          { status: 502 }
        );
      }
      throw err;
    }

    // Merge into the project's existing generatedFiles (replace matching
    // paths from this category, keep files from other already-built categories).
    const existingFiles = project.generatedFiles || [];
    const byPath = new Map(existingFiles.map((f) => [f.path, f]));
    for (const f of generatedForCategory) {
      byPath.set(f.path, f);
    }
    const mergedFiles = Array.from(byPath.values());

    const updatedProject = await saveProject({
      id: projectId,
      generatedFiles: mergedFiles,
    });

    return NextResponse.json({
      success: true,
      category: category || null,
      files: generatedForCategory,
      generatedFiles: updatedProject.generatedFiles,
    });
  } catch (err: any) {
    console.error('API /api/build error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate code.' },
      { status: 500 }
    );
  }
}
