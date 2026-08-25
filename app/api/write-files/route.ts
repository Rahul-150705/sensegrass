import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetDir, files } = body;

    if (!targetDir || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: 'Target directory and files array are required.' },
        { status: 400 }
      );
    }

    // Resolve target path safely
    const resolvedPath = path.resolve(targetDir);

    // Create target directory if it doesn't exist
    if (!fs.existsSync(resolvedPath)) {
      fs.mkdirSync(resolvedPath, { recursive: true });
    }

    const writtenFiles: string[] = [];

    for (const fileObj of files) {
      if (fileObj.path && fileObj.content) {
        const filePath = path.join(resolvedPath, fileObj.path);
        const fileDir = path.dirname(filePath);

        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }

        fs.writeFileSync(filePath, fileObj.content, 'utf8');
        writtenFiles.push(fileObj.path);
      }
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
