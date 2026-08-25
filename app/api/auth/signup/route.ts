import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name || email.split('@')[0],
          },
        },
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (data.user) {
        return NextResponse.json({
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || email.split('@')[0],
          },
          token: data.session?.access_token || null,
        });
      }
    }

    // Fallback if Supabase is offline
    const userId = crypto.randomUUID();
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ userId, email, exp: Date.now() + 86400000 }))}`;

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        name: name || email.split('@')[0],
      },
      token,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to sign up.' },
      { status: 500 }
    );
  }
}
