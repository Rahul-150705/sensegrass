import { NextResponse } from 'next/server';
import { getProjectById } from '@/lib/store';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = await getProjectById(params.id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, project });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch project.' },
      { status: 500 }
    );
  }
}
