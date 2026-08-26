import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Supabase's client SDK has no way to run arbitrary DDL (CREATE TABLE, etc.) —
// that requires either the SQL Editor or a Postgres function you define
// yourself, which this project doesn't ship. So this route can only report
// whether the required tables exist; it cannot create them. Run
// supabase_schema.sql in the Supabase SQL Editor once to provision them.
async function checkTables() {
  if (!isSupabaseConfigured || !supabase) {
    return { configured: false, tables: { profiles: false, projects: false, chat_messages: false } };
  }

  const checks = await Promise.all([
    supabase.from('profiles').select('id').limit(1),
    supabase.from('projects').select('id').limit(1),
    supabase.from('chat_messages').select('id').limit(1),
  ]);

  return {
    configured: true,
    tables: {
      profiles: !checks[0].error,
      projects: !checks[1].error,
      chat_messages: !checks[2].error,
    },
  };
}

export async function POST() {
  const status = await checkTables();
  const missing = Object.entries(status.tables)
    .filter(([, exists]) => !exists)
    .map(([name]) => name);

  return NextResponse.json({
    success: missing.length === 0,
    ...status,
    message:
      missing.length === 0
        ? 'All required tables exist.'
        : `Missing table(s): ${missing.join(', ')}. Run supabase_schema.sql in your Supabase SQL Editor (Dashboard → SQL Editor → New Query) to create them — this cannot be done automatically from the app.`,
  });
}

export async function GET() {
  const status = await checkTables();
  return NextResponse.json(status);
}
