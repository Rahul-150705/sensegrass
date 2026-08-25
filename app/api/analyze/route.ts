import { NextResponse } from 'next/server';
import { fetchAndExtractWebsiteContent } from '@/lib/scraper';
import { analyzeWebsite } from '@/lib/ai';
import { saveProject } from '@/lib/store';
import { verifyJWT } from '@/lib/supabase-admin';

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

    // Extract and verify JWT token
    const authHeader = request.headers.get('Authorization');
    let userId: string | undefined = undefined;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const verified = await verifyJWT(token);
      if (verified) {
        userId = verified.id;
      }
    }

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
      userId: userId,
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
