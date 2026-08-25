import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  token?: string;
}

const STORAGE_KEY = 'productforge_session';

export async function getCurrentUser(): Promise<UserSession | null> {
  if (typeof window === 'undefined') return null;

  // 1. Check local session storage first
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed: UserSession = JSON.parse(stored);
      if (parsed && parsed.id && parsed.email) {
        return parsed;
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  // 2. Check Supabase active session
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
        return userObj;
      }
    } catch (err) {
      console.warn('Supabase getSession error:', err);
    }
  }

  // Strictly null if unauthenticated
  return null;
}

export async function signupUser(email: string, password: string, name?: string): Promise<UserSession> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to sign up.');
  }

  const session: UserSession = {
    id: data.user.id,
    email: data.user.email,
    name: data.user.name,
    token: data.token,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
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
  }
}
