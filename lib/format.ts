// Post-processing for generated file contents: guarantee JSON is pretty-printed
// (never single-line), package.json keys are in a conventional order, and no
// stray markdown code fences leak into any file.

const PKG_KEY_ORDER = [
  'name',
  'version',
  'private',
  'type',
  'description',
  'author',
  'license',
  'scripts',
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'engines',
];

// Files whose contents are binary — a text LLM cannot produce them, so they must
// never enter the per-file build queue (they only make a category "fail"). The
// export scaffold supplies real versions where one is actually needed.
const BINARY_ASSET_RE =
  /\.(ico|icns|png|jpe?g|gif|webp|avif|bmp|tiff?|woff2?|ttf|eot|otf|mp[34]|m4a|aac|wav|ogg|webm|mov|avi|pdf|zip|gz|tar|rar|7z|wasm|node|exe|dll|so|dylib)$/i;

export function isBinaryAssetPath(path: string): boolean {
  return BINARY_ASSET_RE.test(String(path || '').trim());
}

export function tidyFileContent(path: string, content: string): string {
  let out = String(content ?? '');

  // Strip an accidental leading/trailing markdown fence from any file.
  out = out.replace(/^\s*```[a-zA-Z0-9._-]*\s*\n/, '').replace(/\n\s*```\s*$/, '');

  const lower = path.toLowerCase();
  if (lower.endsWith('.json')) {
    try {
      let obj: any = JSON.parse(out);
      if (lower.endsWith('package.json') && obj && typeof obj === 'object' && !Array.isArray(obj)) {
        const ordered: Record<string, unknown> = {};
        for (const k of PKG_KEY_ORDER) if (k in obj) ordered[k] = obj[k];
        for (const k of Object.keys(obj)) if (!(k in ordered)) ordered[k] = obj[k];
        obj = ordered;
      }
      return JSON.stringify(obj, null, 2) + '\n';
    } catch {
      // Not valid JSON — leave as-is rather than corrupt it.
    }
  }

  if (!out.endsWith('\n')) out += '\n';
  return out;
}
