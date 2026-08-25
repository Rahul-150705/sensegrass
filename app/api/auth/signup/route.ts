import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Ensures all required tables exist in Supabase
// Called automatically on signup so first-time users always have the schema ready
async function ensureSchemaExists() {
  if (!supabase) return;

  // Quick check: does the projects table exist?
  const { error } = await supabase.from('projects').select('id').limit(1);

  // If it errors with "relation does not exist", tables need to be created
  if (error && error.code === '42P01') {
    console.log('📦 [SETUP] Tables not found — running auto-schema creation...');
    try {
      // Call our setup endpoint to create all tables
      await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/setup`,
        { method: 'POST' }
      );
    } catch (setupErr) {
      console.warn('Auto-setup fetch failed:', setupErr);
    }
  }
}

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

    // Auto-ensure schema exists before creating user
    await ensureSchemaExists();

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

    // Also insert profile row manually in case the trigger isn't set up yet
    try {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: name || email.split('@')[0],
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Non-fatal — trigger will handle it if table exists
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
