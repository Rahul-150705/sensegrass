import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAuthenticatedUser } from '@/lib/auth-server';

// All CLI exports are sandboxed under this directory — the client only ever
// supplies a folder *name* inside it, never an arbitrary filesystem path.
const EXPORTS_BASE_DIR = path.join(process.cwd(), '.exports');

// Reduces a user-supplied folder name to a single safe path segment:
// no separators, no drive letters, no traversal, no hidden/empty names.
function sanitizeFolderName(name: string): string | null {
  const cleaned = name
    .trim()
    .replace(/^[a-zA-Z]:[\\/]+/, '') // strip Windows drive prefix e.g. "C:\"
    .replace(/[\\/]+/g, '-') // collapse any separators into a dash
    .replace(/[^a-zA-Z0-9._-]/g, '') // keep only safe characters
    .replace(/^\.+/, ''); // no leading dots (hidden files / traversal)

  if (!cleaned) return null;
  return cleaned.slice(0, 100);
}

// Ensures a file's relative path can't escape the target directory
// (rejects absolute paths, drive letters, and ../ segments).
function sanitizeRelativeFilePath(targetDir: string, filePath: string): string | null {
  if (path.isAbsolute(filePath) || /^[a-zA-Z]:/.test(filePath)) return null;
  const resolved = path.resolve(targetDir, filePath);
  const relative = path.relative(targetDir, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return resolved;
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const body = await request.json();
    const { targetDir, files } = body;

    if (!targetDir || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: 'Target directory and files array are required.' },
        { status: 400 }
      );
    }

    const safeFolder = sanitizeFolderName(String(targetDir));
    if (!safeFolder) {
      return NextResponse.json(
        { error: 'Invalid target directory name.' },
        { status: 400 }
      );
    }

    const resolvedPath = path.join(EXPORTS_BASE_DIR, safeFolder);

    if (!fs.existsSync(resolvedPath)) {
      fs.mkdirSync(resolvedPath, { recursive: true });
    }

    const writtenFiles: string[] = [];

    for (const fileObj of files) {
      if (!fileObj?.path || !fileObj?.content) continue;

      const filePath = sanitizeRelativeFilePath(resolvedPath, String(fileObj.path));
      if (!filePath) {
        return NextResponse.json(
          { error: `Invalid file path: ${fileObj.path}` },
          { status: 400 }
        );
      }

      const fileDir = path.dirname(filePath);
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      fs.writeFileSync(filePath, fileObj.content, 'utf8');
      writtenFiles.push(fileObj.path);
    }

    return NextResponse.json({
      success: true,
      targetDir: resolvedPath,
      writtenFilesCount: writtenFiles.length,
      writtenFiles,
      launchCommand: `cd "${resolvedPath}" && npm install && npm run dev`,
    });
  } catch (err: any) {
    console.error('API /api/write-files error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to write project files.' },
      { status: 500 }
    );
  }
}
