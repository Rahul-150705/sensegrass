import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  const isProduction = process.env.NODE_ENV === 'production';
  const fileStorageRisk = isProduction && !isSupabaseConfigured;

  return NextResponse.json({
    status: 'ok',
    supabase: isSupabaseConfigured,
    fileStorageRisk,
    message: fileStorageRisk
      ? '⚠️ WARNING: Supabase is not configured. File-based storage is not persistent on serverless platforms like Vercel. Data will be lost between deployments.'
      : isSupabaseConfigured
      ? '✅ Supabase is configured and active.'
      : '⚠️ Running with local file storage (development mode only).',
    environment: process.env.NODE_ENV || 'development',
  });
}
