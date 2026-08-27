// Cache for the code-generation stage only. When Build asks Groq to write a
// file (or a set of files) for a given blueprint + file plan, the result is
// stored in public.code_cache. An identical request later returns the stored
// code and never calls Groq again — this is what keeps repeated builds off
// the free-tier quota.
//
// Nothing else in the pipeline is cached (analyze / blueprint / file tree all
// run fresh every time).
//
// Storage: public.code_cache in Supabase (see supabase_schema.sql). RLS is on
// with no policy, so only the service-role client (server-side) can touch it.
// Kill switch: CODE_CACHE=off.

import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { ProductBlueprint, ProjectFile } from '@/types';

const TTL_MS = Number(process.env.CODE_CACHE_TTL_HOURS || 24 * 30) * 60 * 60 * 1000;
const DISABLED = String(process.env.CODE_CACHE || '').toLowerCase() === 'off';

// Deterministic JSON: keys sorted, strings trimmed — so reordered fields or
// stray whitespace still produce the same key.
function stable(value: unknown): string {
  const walk = (v: any): any => {
    if (typeof v === 'string') return v.trim();
    if (v === null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(walk);
    return Object.keys(v)
      .sort()
      .reduce((a: Record<string, any>, k) => ((a[k] = walk(v[k])), a), {});
  };
  return JSON.stringify(walk(value));
}

// The generated code depends on the design-relevant slice of the blueprint
// and the exact file list — not on the placeholder stub contents.
function keyFor(blueprint: ProductBlueprint, files: ProjectFile[]) {
  return {
    bp: {
      productName: blueprint.productName,
      tagline: blueprint.tagline,
      features: blueprint.features,
      pages: blueprint.pages,
      navigation: blueprint.navigation,
      uiDirection: blueprint.uiDirection,
    },
    files: files.map((f) => ({ path: f.path, type: f.type, language: f.language })),
  };
}

// Wrap the code-gen call. On a hit, `run` is never invoked. `run` is expected
// to throw on failure (rate limit / generation error) — thrown errors are
// never cached.
export async function cachedCode(
  blueprint: ProductBlueprint,
  files: ProjectFile[],
  run: () => Promise<ProjectFile[]>
): Promise<ProjectFile[]> {
  if (DISABLED || !supabaseAdmin) return run();

  const cacheKey = crypto.createHash('sha256').update(stable(keyFor(blueprint, files))).digest('hex');

  try {
    const { data } = await supabaseAdmin
      .from('code_cache')
      .select('files, created_at, hits')
      .eq('cache_key', cacheKey)
      .maybeSingle();
    if (
      data &&
      Array.isArray(data.files) &&
      Date.now() - new Date(data.created_at as string).getTime() <= TTL_MS
    ) {
      void supabaseAdmin
        .from('code_cache')
        .update({ hits: (data.hits ?? 0) + 1, last_used_at: new Date().toISOString() })
        .eq('cache_key', cacheKey);
      return data.files as ProjectFile[];
    }
  } catch {
    /* read failure -> just generate */
  }

  const fresh = await run();

  try {
    await supabaseAdmin.from('code_cache').upsert(
      {
        cache_key: cacheKey,
        product_name: blueprint.productName || null,
        file_paths: files.map((f) => f.path),
        files: fresh,
        created_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
      },
      { onConflict: 'cache_key' }
    );
  } catch {
    /* cache write is best-effort — never fail the build over it */
  }

  return fresh;
}
