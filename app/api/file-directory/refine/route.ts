import { NextResponse } from 'next/server';
import { refineFileDirectory } from '@/lib/ai';
import { getProjectById, saveProject, addChatMessage } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { enforceRateLimit } from '@/lib/rate-limit';

// Refines ONLY the Product File Directory JSON (file tree, routes,
// components, data entities, integrations). Deliberately separate from
// /api/strategy/refine (analysis JSON) and /api/refine (blueprint + code) —
// three distinct, clearly-scoped AI calls sharing helpers in lib/groq.ts.
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const limited = enforceRateLimit(user.id, 'file-directory-refine', 20, 60_000);
    if (limited) return limited;

    const body = await request.json();
    const { projectId, message } = body;

    if (!projectId || !message) {
      return NextResponse.json(
        { error: 'Project ID and message are required.' },
        { status: 400 }
      );
    }

    const project = await getProjectById(projectId, user.id);
    if (!project || project.userId !== user.id) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }
    if (!project.fileDirectory) {
      return NextResponse.json(
        { error: 'File directory not found. Generate it first.' },
        { status: 404 }
      );
    }

    const chatHistory = (project.fileDirectoryChatHistory || []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    await addChatMessage(projectId, 'user', message, 'fileDirectory', user.id);

    const result = await refineFileDirectory(project.fileDirectory, message, chatHistory);

    await addChatMessage(projectId, 'assistant', result.assistantMessage, 'fileDirectory', user.id);

    if (result.applied) {
      await saveProject({ id: projectId, fileDirectory: result.updatedFileDirectory });
    }

    return NextResponse.json({
      success: true,
      projectId,
      fileDirectory: result.updatedFileDirectory,
      assistantMessage: result.assistantMessage,
      applied: result.applied,
    });
  } catch (err: any) {
    console.error('API /api/file-directory/refine error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to refine the file directory.' },
      { status: 500 }
    );
  }
}
