import { NextResponse } from 'next/server';
import { refineProduct } from '@/lib/ai';
import { getDefaultStarterUICode } from '@/lib/openai';
import { getProjectById, saveProject, addChatMessage } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { enforceRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const limited = enforceRateLimit(user.id, 'refine', 20, 60_000);
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
    if (!project.blueprint) {
      return NextResponse.json(
        { error: 'Project blueprint not found.' },
        { status: 404 }
      );
    }

    // Record user chat message
    await addChatMessage(projectId, 'user', message, 'studio', user.id);

    const chatHistory = (project.chatHistory || []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const currentCode =
      project.uiCode ||
      getDefaultStarterUICode(project.blueprint.productName, project.blueprint.tagline);

    // Refine blueprint + code + files with the Groq code agent
    const { updatedBlueprint, updatedCode, updatedFiles, assistantMessage } = await refineProduct(
      project.blueprint,
      currentCode,
      message,
      chatHistory,
      project.generatedFiles || project.blueprint.generatedFiles || undefined
    );

    // Save assistant response message
    await addChatMessage(projectId, 'assistant', assistantMessage, 'studio', user.id);

    // Save updated project blueprint and code
    const updatedProject = await saveProject({
      id: projectId,
      name: updatedBlueprint.productName,
      blueprint: updatedBlueprint,
      uiCode: updatedCode,
      generatedFiles: updatedFiles || project.generatedFiles,
    });

    return NextResponse.json({
      success: true,
      projectId: updatedProject.id,
      blueprint: updatedProject.blueprint,
      uiCode: updatedProject.uiCode,
      generatedFiles: updatedProject.generatedFiles,
      assistantMessage,
    });
  } catch (err: any) {
    console.error('API /api/refine error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to refine product blueprint.' },
      { status: 500 }
    );
  }
}
