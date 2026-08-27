-- ============================================================
-- ProductForge — Complete Supabase Schema
-- Run this ONCE in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- TABLE: profiles
-- Auto-populated via trigger when a user signs up
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- TABLE: projects
-- Stores all AI-generated SaaS blueprints per user
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  description TEXT NOT NULL,
  target_customer TEXT NOT NULL DEFAULT 'General users',
  analysis JSONB,           -- Groq LLM product analysis output
  scraped_info JSONB,       -- Raw scraped website content (title, headings, text)
  blueprint JSONB,          -- Full product specification blueprint
  ui_code TEXT,             -- Legacy single-file UI code
  generated_files JSONB,    -- Multi-file full-stack code array from the Groq code agent
  file_directory JSONB,     -- The finalized, reviewable build plan (file tree, routes, components, data entities) generated after Strategy, before Build
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Add generated_files / file_directory columns safely if they don't exist
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS generated_files JSONB;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS file_directory JSONB;

-- ─────────────────────────────────────────────────────────────
-- TABLE: chat_messages
-- AI Copilot conversation history per project
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'studio' CHECK (stage IN ('studio', 'strategy', 'blueprint', 'fileDirectory')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Add user_id column safely if it doesn't exist
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add stage column safely if it doesn't exist (separates the Strategy
-- Assistant chat, the File Directory Assistant chat, and the Blueprint/Code
-- Copilot chat within the same table). Drop + recreate the check constraint
-- every run so re-running this script after adding a new stage value
-- (e.g. 'fileDirectory') actually updates it, rather than a stale
-- "does it exist" guard leaving an outdated constraint in place.
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'studio';
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_stage_check;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_stage_check CHECK (stage IN ('studio', 'strategy', 'blueprint', 'fileDirectory'));

-- ─────────────────────────────────────────────────────────────
-- INDEXES (for performance)
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON public.chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (data isolation per user)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects: users can only see/manage their own projects
DROP POLICY IF EXISTS "Users can manage own projects" ON public.projects;
CREATE POLICY "Users can manage own projects"
  ON public.projects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Chat messages: users can only see messages tied to their projects
DROP POLICY IF EXISTS "Users can manage own messages" ON public.chat_messages;
CREATE POLICY "Users can manage own messages"
  ON public.chat_messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- TRIGGER: Auto-create profile row when a user signs up
-- This fires automatically on every new Supabase Auth signup
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger to ensure it's attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- DONE
-- After running this script:
-- 1. Go to Authentication → Settings → turn OFF "Enable email confirmations" (for dev)
-- 2. Your app will now store all users, projects, and chat history in Supabase
-- ─────────────────────────────────────────────────────────────
