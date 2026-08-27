import { NextResponse } from 'next/server';
import { fetchAndExtractWebsiteContent } from '@/lib/scraper';
import { analyzeWebsite } from '@/lib/ai';
import { saveProject } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { cached } from '@/lib/ai-cache';
import type { ProductAnalysis, ScrapedContent } from '@/types';

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
  if (r.includes('no readable content') || r.includes('not an html page'))
    return 'We reached that URL but couldn’t read any content from it. Make sure it’s a public web page.';
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

    const targetCust = targetCustomer || 'Small business owners';

    // Steps 1 + 2 (scrape + Groq analysis) behind an input-keyed cache: an
    // identical {url, description, targetCustomer} returns the stored result
    // and skips both the scraper and the LLM. A scrape failure is thrown, not
    // cached — a site being down is transient.
    let analysis: ProductAnalysis;
    let scraped: ScrapedContent;
    try {
      const result = await cached<{ analysis: ProductAnalysis; scraped: ScrapedContent }>(
        'analyze',
        { url: rawUrl.toLowerCase(), description, targetCustomer: targetCust },
        async () => {
          const s: ScrapedContent = rawUrl
            ? await fetchAndExtractWebsiteContent(rawUrl)
            : {
                url: '',
                title: 'Idea-only project (no source website)',
                description: String(description).slice(0, 240),
                headings: [],
                mainText: String(description),
                success: true,
              };

          // Don't feed the LLM a synthesized fallback and pass it off as a
          // real analysis — surface the error instead.
          if (rawUrl && !s.success) {
            const e = new Error(scrapeErrorMessage(s.error)) as Error & {
              unreachable?: boolean;
              detail?: string | null;
            };
            e.unreachable = true;
            e.detail = s.error || null;
            throw e;
          }

          const a = await analyzeWebsite(rawUrl, s, description, targetCust);
          return { analysis: a, scraped: s };
        }
      );
      analysis = result.analysis;
      scraped = result.scraped;
    } catch (e: any) {
      if (e?.unreachable) {
        return NextResponse.json(
          { error: e.message, unreachable: true, detail: e.detail ?? null },
          { status: 422 }
        );
      }
      throw e;
    }

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
      targetCustomer: targetCust,
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
