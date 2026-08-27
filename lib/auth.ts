import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  token?: string;
}

const STORAGE_KEY = 'productforge_session';
const COOKIE_NAME = 'session_token';

// Set session cookie so middleware can read it for route protection.
// This is set client-side (so it can't be HttpOnly); it is only a routing
// hint — every API route still cryptographically verifies the bearer token.
// `Secure` is added on HTTPS so the cookie never rides over plain HTTP.
function cookieSuffix() {
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  return `; path=/; SameSite=Strict${secure}`;
}

function setSessionCookie(token: string) {
  if (typeof document === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  document.cookie = `${COOKIE_NAME}=${token}; max-age=${maxAge}${cookieSuffix()}`;
}

// Clear session cookie on logout
function clearSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; max-age=0${cookieSuffix()}`;
}

export async function getCurrentUser(): Promise<UserSession | null> {
  if (typeof window === 'undefined') return null;

  // 1. Check Supabase active session first (most authoritative)
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (session?.user) {
        const userObj: UserSession = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          token: session.access_token,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
        setSessionCookie(session.access_token);
        return userObj;
      }
    } catch (err) {
      console.warn('Supabase getSession error:', err);
    }
  }

  // 2. Fall back to localStorage cache
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed: UserSession = JSON.parse(stored);
      if (parsed && parsed.id && parsed.email && parsed.token) {
        return parsed;
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return null;
}

export async function signupUser(email: string, password: string, name?: string): Promise<UserSession> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  const data = await res.json();

  // Handle email confirmation required case
  if (data.requiresEmailConfirmation) {
    throw new Error('Account created! Please check your email to confirm your account, then log in.');
  }

  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to sign up.');
  }

  const session: UserSession = {
    id: data.user.id,
    email: data.user.email,
    name: data.user.name,
    token: data.token,
  };

  if (typeof window !== 'undefined' && data.token) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setSessionCookie(data.token);
  }

  return session;
}

export async function loginUser(email: string, password?: string): Promise<UserSession> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to sign in.');
  }

  const session: UserSession = {
    id: data.user.id,
    email: data.user.email,
    name: data.user.name,
    token: data.token,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setSessionCookie(data.token);
  }

  return session;
}

export async function logoutUser(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch {}
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    clearSessionCookie();
  }
}

// Returns the auth token for API calls that require Authorization header
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed: UserSession = JSON.parse(stored);
    return parsed?.token || null;
  } catch {
    return null;
  }
}
