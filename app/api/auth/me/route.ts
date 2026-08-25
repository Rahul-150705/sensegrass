import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;

    if (token && isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) {
        return NextResponse.json({
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
          },
        });
      }
    }

    return NextResponse.json({ success: false, user: null }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ success: false, user: null }, { status: 500 });
  }
}
