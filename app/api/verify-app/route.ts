import { NextResponse } from 'next/server';
import { refineProduct } from '@/lib/ai';
import { getProjectById, saveProject } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/auth-server';

// This endpoint only exists to health-check a locally running dev server for
// the CLI-exported project, so we hard-restrict it to loopback addresses —
// otherwise a client-supplied `url` would let the server fetch arbitrary
// internal/external hosts (SSRF).
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, url } = body;

    const checkUrl = url || 'http://localhost:3000';

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(checkUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL.' }, { status: 400 });
    }
    if (!LOOPBACK_HOSTS.has(parsedUrl.hostname.toLowerCase())) {
      return NextResponse.json(
        { error: 'Only localhost URLs may be verified.' },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required.' }, { status: 400 });
    }

    const project = await getProjectById(projectId);
    if (!project || project.userId !== user.id) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }
    if (!project.blueprint) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    let isRunning = false;
    let statusCode = 0;
    let errorMessage = '';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(checkUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      statusCode = res.status;
      if (res.ok) {
        isRunning = true;
      } else {
        errorMessage = `HTTP Server responded with status ${res.status}`;
      }
    } catch (err: any) {
      errorMessage = err?.message || 'Connection refused to target port.';
    }

    // If server is running cleanly, return success
    if (isRunning) {
      return NextResponse.json({
        success: true,
        healthy: true,
        statusCode,
        url: checkUrl,
        message: 'Application verified and running cleanly on target port.',
      });
    }

    // Self-Healing Phase: Call Coding Agent to rewrite & patch code if error detected
    let healed = false;
    let updatedCode = project.uiCode || '';
    let healSummary = '';

    if (project.blueprint) {
      const healResult = await refineProduct(
        project.blueprint,
        updatedCode,
        `SELF-HEALING AGENT BUGFIX: System verification failed with error (${errorMessage}). Fix syntax, JSX errors, and missing imports so the app compiles cleanly.`,
        []
      );

      updatedCode = healResult.updatedCode;
      healSummary = healResult.assistantMessage;
      healed = true;

      // Save updated healed code
      await saveProject({
        id: projectId,
        uiCode: updatedCode,
      });
    }

    return NextResponse.json({
      success: true,
      healthy: false,
      healed,
      statusCode,
      url: checkUrl,
      errorDetected: errorMessage,
      healSummary,
      updatedCode,
      message: 'Self-Healing Agent diagnosed error, rewritten code, and updated live preview.',
    });
  } catch (err: any) {
    console.error('API /api/verify-app error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to verify application.' },
      { status: 500 }
    );
  }
}
