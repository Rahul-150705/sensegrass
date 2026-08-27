import { NextResponse } from 'next/server';
import { fetchAndExtractWebsiteContent } from '@/lib/scraper';
import { analyzeWebsite } from '@/lib/ai';
import { saveProject } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { enforceRateLimit } from '@/lib/rate-limit';

// Map a scrape failure reason to a message the user can act on.
function scrapeErrorMessage(reason?: string): string {
  const r = (reason || '').toLowerCase();
  if (r.includes('enotfound') || r.includes('resolve') || r.includes('getaddrinfo') || r.includes('dns'))
    return 'That domain could not be found. Check the spelling of the URL.';
  if (r.includes('abort') || r.includes('timeout') || r.includes('timed out'))
    return 'The website took too long to respond. It may be down.';
  if (r.includes('private') || r.includes('internal') || r.includes('localhost') || r.includes('not allowed'))
    return 'That address is not allowed. Enter a public website URL.';
  const status = r.match(/status\s*(\d{3})/)?.[1];
  if (status) return `The website returned an error (HTTP ${status}).`;
  if (r.includes('http/https')) return 'Only http:// and https:// URLs are supported.';
  return 'Could not reach that website. Check the URL, or leave it blank to build from an idea.';
}

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

    // If a URL was given but the site is unreachable / errored / disallowed,
    // stop here — do NOT feed the LLM a synthesized fallback and pass it off
    // as a real analysis. The user can fix the URL or build from an idea.
    if (rawUrl && !scraped.success) {
      return NextResponse.json(
        { error: scrapeErrorMessage(scraped.error), unreachable: true, detail: scraped.error || null },
        { status: 422 }
      );
    }

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
