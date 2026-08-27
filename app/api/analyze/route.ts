import { NextResponse } from 'next/server';
import { fetchAndExtractWebsiteContent } from '@/lib/scraper';
import { analyzeWebsite } from '@/lib/ai';
import { saveProject } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { enforceRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const limited = enforceRateLimit(user.id, 'analyze', 10, 60_000);
    if (limited) return limited;

    const body = await request.json();
    const rawUrl = typeof body.websiteUrl === 'string' ? body.websiteUrl.trim() : '';
    const { description, targetCustomer } = body;

    // A website URL is optional — "Build from Idea" starts with just a description.
    if (!description) {
      return NextResponse.json(
        { error: 'A product description is required.' },
        { status: 400 }
      );
    }

    // Step 1: extract webpage content server-side, or synthesize an idea-only
    // context when no URL was given.
    const scraped = rawUrl
      ? await fetchAndExtractWebsiteContent(rawUrl)
      : {
          url: '',
          title: 'Idea-only project (no source website)',
          description: String(description).slice(0, 240),
          headings: [],
          mainText: String(description),
          success: true,
        };

    // Step 2: Send extracted text + prompt to Groq AI Agent
    const analysis = await analyzeWebsite(
      rawUrl,
      scraped,
      description,
      targetCustomer || 'Small business owners'
    );

    // Generate a project name — from the domain when there's a URL, otherwise
    // from the first few words of the description.
    let projectName: string;
    if (rawUrl) {
      const domain = rawUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const cleanDomain = domain.split('.')[0] || 'Project';
      projectName = cleanDomain.charAt(0).toUpperCase() + cleanDomain.slice(1) + ' SaaS';
    } else {
      const words = String(description).trim().split(/\s+/).slice(0, 6).join(' ');
      projectName = (words.charAt(0).toUpperCase() + words.slice(1)).slice(0, 48) || 'New SaaS Project';
    }
    const projectId = crypto.randomUUID();

    // Step 3: Save project tagged to the authenticated user
    const project = await saveProject({
      id: projectId,
      userId: user.id,
      name: projectName,
      websiteUrl: rawUrl,
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
