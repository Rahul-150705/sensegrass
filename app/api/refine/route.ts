import { NextResponse } from 'next/server';
import { refineProduct } from '@/lib/ai';
import { getDefaultStarterUICode } from '@/lib/openai';
import { getProjectById, saveProject, addChatMessage } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, message } = body;

    if (!projectId || !message) {
      return NextResponse.json(
        { error: 'Project ID and message are required.' },
        { status: 400 }
      );
    }

    const project = await getProjectById(projectId);
    if (!project || !project.blueprint) {
      return NextResponse.json(
        { error: 'Project blueprint not found.' },
        { status: 404 }
      );
    }

    // Record user chat message
    await addChatMessage(projectId, 'user', message);

    const chatHistory = (project.chatHistory || []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const currentCode =
      project.uiCode ||
      getDefaultStarterUICode(project.blueprint.productName, project.blueprint.tagline);

    // Refine blueprint + code + files with Claude Agent
    const { updatedBlueprint, updatedCode, updatedFiles, assistantMessage } = await refineProduct(
      project.blueprint,
      currentCode,
      message,
      chatHistory,
      project.generatedFiles || project.blueprint.generatedFiles || undefined
    );

    // Save assistant response message
    await addChatMessage(projectId, 'assistant', assistantMessage);

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
