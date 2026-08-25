import { NextResponse } from 'next/server';
import { getAllProjects } from '@/lib/store';

export async function GET() {
  try {
    const projects = await getAllProjects();
    return NextResponse.json({ success: true, projects });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch projects.' },
      { status: 500 }
    );
  }
}
