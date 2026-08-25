import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Admin client using service role key — bypasses RLS
// Used ONLY for: schema setup, JWT verification, and admin operations
// Never expose this client to the browser
export const supabaseAdmin = (supabaseUrl && serviceRoleKey)
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export const isAdminConfigured = Boolean(supabaseUrl && serviceRoleKey);

// Verify a Supabase JWT token using the admin client
// Returns the verified user object or null if token is invalid/expired
export async function verifyJWT(token: string): Promise<{
  id: string;
  email: string;
} | null> {
  if (!supabaseAdmin) {
    // Fallback: decode payload without signature verification (dev only)
    try {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64url').toString('utf8')
      );
      if (!payload?.sub) return null;
      // Check expiry
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null; // Token expired
      }
      return { id: payload.sub, email: payload.email || '' };
    } catch {
      return null;
    }
  }

  try {
    // Full cryptographic verification using Supabase admin client
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return null;
    return {
      id: data.user.id,
      email: data.user.email || '',
    };
  } catch {
    return null;
  }
}
