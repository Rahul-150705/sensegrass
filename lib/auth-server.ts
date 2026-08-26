// Server-only auth helper — DO NOT import from client components
import { verifyJWT } from '@/lib/supabase-admin';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

// Extracts the Bearer token from the request and cryptographically verifies it.
// Returns null if missing, malformed, or invalid — callers must respond 401.
export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  return verifyJWT(token);
}
