import { NextResponse } from 'next/server';
import { refineStrategy } from '@/lib/ai';
import { getProjectById, saveProject, addChatMessage } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { enforceRateLimit } from '@/lib/rate-limit';

// Refines ONLY the Strategy/Analysis JSON produced by the analyze stage.
// Deliberately separate from /api/refine (blueprint + code) and
// /api/build (blueprint + file generation) — three distinct, clearly-scoped
// AI calls, even though they share helpers in lib/groq.ts.
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const limited = enforceRateLimit(user.id, 'strategy-refine', 20, 60_000);
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
    if (!project.analysis) {
      return NextResponse.json(
        { error: 'Strategy analysis not found. Please analyze a website first.' },
        { status: 404 }
      );
    }

    // Use the persisted conversation as context, not client-supplied history —
    // single source of truth, and it's what actually survives a page reload.
    const chatHistory = (project.strategyChatHistory || []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    await addChatMessage(projectId, 'user', message, 'strategy', user.id);

    const result = await refineStrategy(project.analysis, message, chatHistory);

    await addChatMessage(projectId, 'assistant', result.assistantMessage, 'strategy', user.id);

    // Only persist the analysis change when the assistant actually applied
    // one — a clarifying question/answer shouldn't trigger a write.
    if (result.applied) {
      await saveProject({ id: projectId, analysis: result.updatedAnalysis });
    }

    return NextResponse.json({
      success: true,
      projectId,
      analysis: result.updatedAnalysis,
      assistantMessage: result.assistantMessage,
      applied: result.applied,
    });
  } catch (err: any) {
    console.error('API /api/strategy/refine error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to refine strategy.' },
      { status: 500 }
    );
  }
}
