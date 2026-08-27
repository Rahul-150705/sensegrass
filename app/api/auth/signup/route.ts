import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

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
      // Supabase "Leaked Password Protection" (HaveIBeenPwned) and the weak-password
      // rule both come back as a terse string — rewrite them into something a user
      // can act on.
      const raw = (error.message || '').toLowerCase();
      let message = error.message;
      if ((error as { code?: string }).code === 'weak_password' || raw.includes('weak') || raw.includes('pwned') || raw.includes('breach') || raw.includes('leak')) {
        message =
          'That password has appeared in a known data breach, so it can’t be used. Pick a different password you haven’t used elsewhere (12+ characters).';
      } else if (raw.includes('at least') && raw.includes('character')) {
        message = 'Password is too short — use at least 8 characters.';
      } else if (raw.includes('already registered') || raw.includes('already been registered')) {
        message = 'An account with this email already exists. Try signing in instead.';
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: 'Sign up failed. Please try again.' }, { status: 400 });
    }

    // Also insert profile row manually in case the trigger isn't set up yet.
    // Uses the service-role client since RLS requires auth.uid() = id, which
    // the anon client can never satisfy from a server request.
    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: name || email.split('@')[0],
          updated_at: new Date().toISOString(),
        });
      } catch {
        // Non-fatal — trigger will handle it if table exists
      }
    }

    if (!data.session) {
      return NextResponse.json({
        success: true,
        requiresEmailConfirmation: true,
        message: 'Account created! Please check your email to confirm your account before logging in.',
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
