import { NextResponse } from 'next/server';
import { getProjectById } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/auth-server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const project = await getProjectById(params.id, user.id);
    if (!project || project.userId !== user.id) {
      // Return the same 404 for "not found" and "not yours" so project IDs
      // can't be enumerated or their existence confirmed by other users.
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
