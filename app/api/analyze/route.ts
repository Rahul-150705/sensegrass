import { NextResponse } from 'next/server';
import { fetchAndExtractWebsiteContent } from '@/lib/scraper';
import { analyzeWebsite } from '@/lib/ai';
import { saveProject } from '@/lib/store';

// Helper: extract userId from Bearer token (Supabase JWT sub claim)
function extractUserId(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString('utf8')
    );
    return payload?.sub || payload?.userId || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { websiteUrl, description, targetCustomer } = body;

    if (!websiteUrl || !description) {
      return NextResponse.json(
        { error: 'Website URL and description are required.' },
        { status: 400 }
      );
    }

    // Extract userId from session token so projects are owned by the user
    const authHeader = request.headers.get('Authorization');
    const userId = extractUserId(authHeader);

    // Step 1: Extract webpage content server-side
    const scraped = await fetchAndExtractWebsiteContent(websiteUrl);

    // Step 2: Send extracted text + prompt to Groq AI Agent
    const analysis = await analyzeWebsite(
      websiteUrl,
      scraped,
      description,
      targetCustomer || 'Small business owners'
    );

    // Generate project name from URL
    const domain = websiteUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const cleanDomain = domain.split('.')[0] || 'Project';
    const projectName = cleanDomain.charAt(0).toUpperCase() + cleanDomain.slice(1) + ' SaaS';
    const projectId = crypto.randomUUID();

    // Step 3: Save project tagged to the authenticated user
    const project = await saveProject({
      id: projectId,
      userId: userId || undefined,
      name: projectName,
      websiteUrl,
      description,
      targetCustomer: targetCustomer || 'Small business owners',
      analysis,
      scrapedInfo: scraped,
    });

    return NextResponse.json({
      success: true,
      projectId: project.id,
      analysis: project.analysis,
      scrapedInfo: scraped,
    });
  } catch (err: any) {
    console.error('API /api/analyze error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to analyze website.' },
      { status: 500 }
    );
  }
}
