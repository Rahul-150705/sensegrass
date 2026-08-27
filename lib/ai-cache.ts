// Input-keyed cache for the expensive pipeline stages (scrape + Groq calls).
// The same normalized input returns the stored JSON instead of re-running the
// scraper or the LLM — this is what keeps repeated identical runs off Groq's
// free-tier quota.
//
// Storage: public.ai_cache in Supabase (see supabase_schema.sql). RLS is on
// with no policy, so only the service-role client (server-side) can touch it.
//
// Disable at runtime with AI_CACHE=off (per-request bypass: pass a unique
// value into the key, or call the run function directly).

import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

const TTL_MS = Number(process.env.AI_CACHE_TTL_HOURS || 24 * 7) * 60 * 60 * 1000;
const DISABLED = String(process.env.AI_CACHE || '').toLowerCase() === 'off';

// Deterministic JSON: object keys sorted, strings trimmed. Two inputs that
// differ only in key order or surrounding whitespace produce the same key.
function stableStringify(value: unknown): string {
  const seen = new WeakSet();
  const walk = (v: any): any => {
    if (typeof v === 'string') return v.trim();
    if (v === null || typeof v !== 'object') return v;
    if (seen.has(v)) return null;
    seen.add(v);
    if (Array.isArray(v)) return v.map(walk);
    return Object.keys(v)
      .sort()
      .reduce((acc: Record<string, any>, k) => {
        acc[k] = walk(v[k]);
        return acc;
      }, {});
  };
  return JSON.stringify(walk(value));
}

export function cacheKey(stage: string, input: unknown): string {
  return crypto.createHash('sha256').update(`${stage}::${stableStringify(input)}`).digest('hex');
}

async function cacheGet<T>(key: string): Promise<T | null> {
  if (DISABLED || !supabaseAdmin) return null;
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_cache')
      .select('payload, created_at, hits')
      .eq('cache_key', key)
      .maybeSingle();
    if (error || !data) return null;
    if (Date.now() - new Date(data.created_at as string).getTime() > TTL_MS) return null;
    // fire-and-forget usage stats
    void supabaseAdmin
      .from('ai_cache')
      .update({ hits: (data.hits ?? 0) + 1, last_used_at: new Date().toISOString() })
      .eq('cache_key', key);
    return data.payload as T;
  } catch {
    return null;
  }
}

async function cacheSet(stage: string, key: string, payload: unknown): Promise<void> {
  if (DISABLED || !supabaseAdmin) return;
  try {
    await supabaseAdmin.from('ai_cache').upsert(
      {
        cache_key: key,
        stage,
        payload,
        created_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
      },
      { onConflict: 'cache_key' }
    );
  } catch {
    /* cache write is best-effort — never fail the request over it */
  }
}

// Wrap an expensive call. On a hit the run() function is never invoked.
export async function cached<T>(stage: string, input: unknown, run: () => Promise<T>): Promise<T> {
  const key = cacheKey(stage, input);
  const hit = await cacheGet<T>(key);
  if (hit !== null && hit !== undefined) return hit;
  const fresh = await run();
  // Only cache truthy results — never store a null/undefined "answer".
  if (fresh !== null && fresh !== undefined) await cacheSet(stage, key, fresh);
  return fresh;
}
