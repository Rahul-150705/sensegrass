import { NextResponse } from 'next/server';
import { refineProductPlan } from '@/lib/ai';
import { getProjectById, saveProject, addChatMessage } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { ChatMessage } from '@/types';

// One assistant for the whole product plan — the blueprint AND the file
// directory. Replaces the two separate /api/blueprint/refine and
// /api/file-directory/refine conversations with a single one. The transcript
// is stored under stage 'blueprint'; on read the studio merges in any legacy
// 'fileDirectory' messages so nothing is lost.
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const limited = enforceRateLimit(user.id, 'product-refine', 20, 60_000);
    if (limited) return limited;

    const body = await request.json();
    const { projectId, message } = body;
    if (!projectId || !message) {
      return NextResponse.json({ error: 'Project ID and message are required.' }, { status: 400 });
    }

    const project = await getProjectById(projectId, user.id);
    if (!project || project.userId !== user.id) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }
    if (!project.blueprint || !project.fileDirectory) {
      return NextResponse.json(
        { error: 'Product plan not found. Generate the blueprint and file directory first.' },
        { status: 404 }
      );
    }

    // Context = the merged blueprint + file-directory conversation, oldest first.
    const chatHistory = [
      ...(project.blueprintChatHistory || []),
      ...(project.fileDirectoryChatHistory || []),
    ]
      .sort((a: ChatMessage, b: ChatMessage) => a.createdAt.localeCompare(b.createdAt))
      .map((m) => ({ role: m.role, content: m.content }));

    await addChatMessage(projectId, 'user', message, 'blueprint', user.id);

    const result = await refineProductPlan(project.blueprint, project.fileDirectory, message, chatHistory);

    await addChatMessage(projectId, 'assistant', result.assistantMessage, 'blueprint', user.id);

    if (result.applied) {
      await saveProject({
        id: projectId,
        name: result.updatedBlueprint.productName || project.name,
        blueprint: result.updatedBlueprint,
        fileDirectory: result.updatedFileDirectory,
      });
    }

    return NextResponse.json({
      success: true,
      projectId,
      applied: result.applied,
      assistantMessage: result.assistantMessage,
      blueprint: result.updatedBlueprint,
      fileDirectory: result.updatedFileDirectory,
    });
  } catch (err: any) {
    console.error('API /api/product/refine error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to refine the product plan.' },
      { status: 500 }
    );
  }
}
