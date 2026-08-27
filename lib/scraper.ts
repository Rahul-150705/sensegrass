import * as cheerio from 'cheerio';
import dns from 'node:dns';
import { Agent } from 'undici';
import { assertPublicHostname, isDisallowedIp } from '@/lib/net-guard';
import type { ScrapedContent } from '@/types';

export type { ScrapedContent };

// Re-validates every resolved address at TCP-connect time. assertPublicHostname()
// checks DNS up front, but between that check and fetch()'s own resolution a
// hostname could be re-pointed at an internal address (DNS rebinding). This
// dispatcher rejects the connection if the address it actually dials is private.
const ssrfSafeAgent = new Agent({
  connect: {
    lookup: (hostname: string, options: any, callback: any) => {
      dns.lookup(hostname, { ...options, all: true, verbatim: true }, (err, addresses) => {
        if (err) return callback(err);
        const list = addresses as unknown as Array<{ address: string; family: number }>;
        for (const { address } of list) {
          if (isDisallowedIp(address)) {
            return callback(new Error(`Blocked connection to non-public address: ${address}`));
          }
        }
        if (options?.all) return callback(null, list);
        callback(null, list[0].address, list[0].family);
      });
    },
  },
});

export async function fetchAndExtractWebsiteContent(urlInput: string): Promise<ScrapedContent> {
  let targetUrl = urlInput.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return getFallbackContent(targetUrl, 'Only http/https URLs are allowed.');
    }
    await assertPublicHostname(parsed.hostname);
  } catch (err: any) {
    return getFallbackContent(targetUrl, err?.message || 'Invalid or disallowed URL.');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
      // undici-specific; valid at runtime on Node's global fetch.
      dispatcher: ssrfSafeAgent,
    } as any);

    clearTimeout(timeoutId);

    if (!response.ok) {
      return getFallbackContent(targetUrl, `HTTP status ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType && !/text\/html|application\/xhtml|text\/plain/i.test(contentType)) {
      return getFallbackContent(targetUrl, `not an HTML page (${contentType.split(';')[0]})`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script, style, nav footer clutter for cleaner text extraction
    $('script, style, noscript, svg, iframe').remove();

    const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '';
    const description =
      $('meta[name="description"]').attr('content')?.trim() ||
      $('meta[property="og:description"]').attr('content')?.trim() ||
      '';

    const headings: string[] = [];
    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 150) {
        headings.push(text);
      }
    });

    // Clean body text
    const rawText = $('body').text();
    const cleanLines = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 20); // filter out navigation snippets

    const mainText = cleanLines.slice(0, 40).join('\n'); // take first 40 substantial paragraphs

    // Reject pages we technically reached but that carry no usable product
    // content — parked domains, "coming soon" holders, generic error pages,
    // JS-only SPAs that render nothing server-side. Better to tell the user
    // than to build an analysis out of nothing.
    const textLen = mainText.replace(/\s+/g, ' ').trim().length;
    const hasContent = title.trim().length > 2 || headings.length > 0 || textLen > 120;
    if (!hasContent) {
      return getFallbackContent(targetUrl, 'no readable content on the page');
    }

    return {
      url: targetUrl,
      title: title || targetUrl,
      description: description || '',
      headings: headings.slice(0, 15),
      mainText,
      success: true,
    };
  } catch (err: any) {
    return getFallbackContent(targetUrl, err?.message || 'Network fetch error');
  }
}

// A scrape failure — carries the reason, and NO fabricated content. Callers
// must check `success` and bail out rather than pass this to the LLM.
function getFallbackContent(url: string, reason: string): ScrapedContent {
  return {
    url,
    title: '',
    description: '',
    headings: [],
    mainText: '',
    success: false,
    error: reason,
  };
}
