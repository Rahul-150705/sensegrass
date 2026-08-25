-- ProductForge PostgreSQL Schema for Supabase
-- Paste this schema directly into your Supabase SQL Editor and run it.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    name TEXT NOT NULL,
    website_url TEXT NOT NULL,
    description TEXT NOT NULL,
    target_customer TEXT NOT NULL,
    analysis JSONB,
    scraped_info JSONB,
    blueprint JSONB,
    ui_code TEXT,
    generated_files JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure generated_files column exists on existing installations
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS generated_files JSONB;

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON public.chat_messages(project_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Permissive policies for development & studio access
DROP POLICY IF EXISTS "Allow public read/write access to projects" ON public.projects;
CREATE POLICY "Allow public read/write access to projects" ON public.projects
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write access to chat_messages" ON public.chat_messages;
CREATE POLICY "Allow public read/write access to chat_messages" ON public.chat_messages
    FOR ALL USING (true) WITH CHECK (true);
