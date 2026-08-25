import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// This route auto-creates all required tables and triggers in Supabase
// Called automatically during signup and can also be hit manually at /api/setup
export async function POST() {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json(
      { error: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' },
      { status: 503 }
    );
  }

  const statements = [
    // Enable UUID extension
    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,

    // Profiles table — one row per user, auto-created via trigger
    `CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT,
      full_name TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
    )`,

    // Projects table — stores all AI-generated SaaS blueprints
    `CREATE TABLE IF NOT EXISTS public.projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      website_url TEXT NOT NULL,
      description TEXT NOT NULL,
      target_customer TEXT NOT NULL DEFAULT 'General users',
      analysis JSONB,
      scraped_info JSONB,
      blueprint JSONB,
      ui_code TEXT,
      generated_files JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
    )`,

    // Add generated_files column if missing on older installations
    `ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS generated_files JSONB`,

    // Chat messages — copilot conversation history per project
    `CREATE TABLE IF NOT EXISTS public.chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
    )`,

    // Add user_id to chat_messages if missing
    `ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE`,

    // Performance indexes
    `CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON public.chat_messages(project_id)`,

    // Enable Row Level Security
    `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY`,

    // RLS Policies — profiles: users can only read/update their own profile
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
      END IF;
    END $$`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
      END IF;
    END $$`,

    // RLS Policies — projects: users only see their own projects
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can manage own projects') THEN
        CREATE POLICY "Users can manage own projects" ON public.projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
      END IF;
    END $$`,

    // RLS Policies — chat_messages: users only see messages for their projects
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can manage own messages') THEN
        CREATE POLICY "Users can manage own messages" ON public.chat_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
      END IF;
    END $$`,

    // Trigger function: auto-create profile row when a new user signs up
    `CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.profiles (id, email, full_name)
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
      )
      ON CONFLICT (id) DO NOTHING;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER`,

    // Attach trigger to auth.users — fires on every new signup
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      END IF;
    END $$`,
  ];

  const results: { statement: string; status: string; error?: string }[] = [];

  for (const sql of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql }).single();
      if (error) {
        // Try direct query as fallback
        results.push({ statement: sql.slice(0, 60) + '...', status: 'skipped', error: error.message });
      } else {
        results.push({ statement: sql.slice(0, 60) + '...', status: 'ok' });
      }
    } catch (err: any) {
      results.push({ statement: sql.slice(0, 60) + '...', status: 'error', error: err?.message });
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Schema setup attempted. Check results for any errors.',
    results,
  });
}

export async function GET() {
  // Health check — verify tables exist
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ configured: false, tables: [] });
  }

  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['profiles', 'projects', 'chat_messages']);

    if (error) {
      // Try simpler check
      const checks = await Promise.all([
        supabase.from('profiles').select('id').limit(1),
        supabase.from('projects').select('id').limit(1),
        supabase.from('chat_messages').select('id').limit(1),
      ]);

      return NextResponse.json({
        configured: true,
        tables: {
          profiles: !checks[0].error,
          projects: !checks[1].error,
          chat_messages: !checks[2].error,
        },
      });
    }

    const tableNames = (data || []).map((r: any) => r.table_name);
    return NextResponse.json({
      configured: true,
      tables: {
        profiles: tableNames.includes('profiles'),
        projects: tableNames.includes('projects'),
        chat_messages: tableNames.includes('chat_messages'),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ configured: true, error: err?.message });
  }
}
