import { NextResponse } from 'next/server';
import { refineBlueprint } from '@/lib/ai';
import { getProjectById, saveProject, addChatMessage } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { enforceRateLimit } from '@/lib/rate-limit';

// Refines ONLY the Product Blueprint metadata (name, tagline, description,
// features, navigation, pages, UI direction) from natural-language
// instructions like "make the design more premium", "add a dashboard",
// "remove the pricing page", "make it enterprise-ready". Deliberately separate
// from /api/strategy/refine (analysis JSON), /api/file-directory/refine
// (file tree), and /api/refine (blueprint + generated code).
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const limited = enforceRateLimit(user.id, 'blueprint-refine', 20, 60_000);
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
        { error: 'Product blueprint not found. Generate it first.' },
        { status: 404 }
      );
    }

    const chatHistory = (project.blueprintChatHistory || []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    await addChatMessage(projectId, 'user', message, 'blueprint', user.id);

    const result = await refineBlueprint(project.blueprint, message, chatHistory);

    await addChatMessage(projectId, 'assistant', result.assistantMessage, 'blueprint', user.id);

    // Only persist when the assistant actually applied a change — a clarifying
    // question/answer shouldn't trigger a write. Keep `name` in sync with the
    // product name so the dashboard/list stays accurate.
    if (result.applied) {
      await saveProject({
        id: projectId,
        name: result.updatedBlueprint.productName || project.name,
        blueprint: result.updatedBlueprint,
      });
    }

    return NextResponse.json({
      success: true,
      projectId,
      blueprint: result.updatedBlueprint,
      assistantMessage: result.assistantMessage,
      applied: result.applied,
    });
  } catch (err: any) {
    console.error('API /api/blueprint/refine error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to refine the product blueprint.' },
      { status: 500 }
    );
  }
}
