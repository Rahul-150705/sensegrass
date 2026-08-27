'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginUser, signupUser, getCurrentUser } from '@/lib/auth';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) router.push(redirectTo);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    setInfoMessage(null);
    try {
      if (isSignUp) await signupUser(email, password, name);
      else await loginUser(email, password);
      router.push(redirectTo);
    } catch (err: any) {
      const message = err?.message || 'Authentication failed. Check your credentials.';
      if (message.toLowerCase().includes('check your email')) {
        setInfoMessage(message);
        setIsSignUp(false);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-bone flex flex-col md:flex-row selection:bg-molten selection:text-ink">
      {/* ── left — brand panel ─────────────────────────────────── */}
      <div className="md:w-[44%] border-b md:border-b-0 md:border-r border-line p-6 sm:p-10 md:p-14 flex flex-col justify-between">
        <Link href="/" className="flex items-center gap-2.5 w-fit hover:opacity-70 transition-opacity">
          <span className="w-5 h-5 bg-molten" />
          <span className="font-mono font-bold text-[11px] tracking-[0.28em] uppercase">Recast</span>
        </Link>

        <div className="py-12 md:py-0">
          <span className="section-num">01 — ACCESS</span>
          <h1 className="display-xl font-display text-[2.4rem] sm:text-[3.4rem] mt-3">
            Scrape.<br />Recast.<br /><span className="text-molten">Ship.</span>
          </h1>
          <p className="mt-5 max-w-xs text-[13px] text-steel leading-relaxed">
            The studio that reads a live website and recasts it into a product — argued with you at every stage.
          </p>
        </div>

        <span className="mono-label !text-[9px]">© {new Date().getFullYear()} — GROQ / GPT-OSS-120B</span>
      </div>

      {/* ── right — form ──────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <span className="section-num">{isSignUp ? '02 — NEW OPERATOR' : '02 — SIGN IN'}</span>
          <h2 className="font-display text-2xl font-semibold text-bone mt-2 mb-8">
            {isSignUp ? 'Create your studio account' : 'Sign in to the studio'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <label className="block">
                <span className="mono-label">Full name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="alex rivera"
                  className="cast-input w-full mt-2 py-2 text-sm"
                />
              </label>
            )}

            <label className="block">
              <span className="mono-label">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="cast-input w-full mt-2 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="mono-label">Password</span>
              <div className="relative mt-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="cast-input w-full py-2 pr-8 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-steel hover:text-bone transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            {error && (
              <p className="mono-label !text-molten !tracking-normal !text-[11px]">! {error}</p>
            )}
            {infoMessage && (
              <p className="mono-label !tracking-normal !text-[11px] !text-bone">→ {infoMessage}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group w-full inline-flex items-center justify-center gap-3 bg-molten text-ink py-3 font-mono font-bold text-xs uppercase tracking-[0.14em] disabled:opacity-40 transition-opacity"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create account' : 'Sign in'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.75} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 rule-t border-line pt-4">
            <button
              onClick={() => {
                setIsSignUp((v) => !v);
                setError(null);
                setInfoMessage(null);
              }}
              className="mono-label hover:text-molten transition-colors"
            >
              {isSignUp ? '← have an account? sign in' : "no account? request access →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-ink">
          <div className="w-6 h-6 border-2 border-line border-t-molten rounded-full animate-spin" />
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
