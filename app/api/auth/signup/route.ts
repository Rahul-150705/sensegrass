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

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json(
        { error: 'Authentication service is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' },
        { status: 503 }
      );
    }

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

    if (!data.user) {
      return NextResponse.json({ error: 'Sign up failed. Please try again.' }, { status: 400 });
    }

    // If email confirmation is disabled in Supabase, data.session will be present immediately.
    // If email confirmation is enabled, data.session will be null — user must confirm email first.
    if (!data.session) {
      return NextResponse.json({
        success: true,
        requiresEmailConfirmation: true,
        message: 'Account created. Please check your email to confirm your account before logging in.',
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || name || email.split('@')[0],
        },
        token: null,
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || name || email.split('@')[0],
      },
      token: data.session.access_token,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to sign up.' },
      { status: 500 }
    );
  }
}
