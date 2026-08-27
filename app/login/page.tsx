'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginUser, signupUser, getCurrentUser } from '@/lib/auth';
import { ArrowRight, Lock, Mail, User, Eye, EyeOff, Sparkles } from 'lucide-react';

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
      if (user) {
        router.push(redirectTo);
      }
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
      if (isSignUp) {
        await signupUser(email, password, name);
      } else {
        await loginUser(email, password);
      }
      router.push(redirectTo);
    } catch (err: any) {
      const message = err?.message || 'Authentication failed. Please check your credentials.';
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
    <div className="min-h-screen bg-neutral-950 flex text-neutral-100 selection:bg-cyan-400 selection:text-neutral-950">
      {/* ── Left: Editorial brand panel ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[46%] relative flex-col justify-between overflow-hidden border-r border-white/[0.06] p-12 xl:p-16">
        <div className="absolute inset-0 bg-dot-grid opacity-40" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-400/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent" />

        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-md bg-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-400/20">
            <Sparkles className="w-4 h-4 text-neutral-950" />
          </div>
          <span className="font-mono font-bold text-sm tracking-widest uppercase text-neutral-100">Recast</span>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="font-display text-6xl xl:text-7xl leading-[0.95] text-neutral-50">
            Scrape.
            <br />
            <span className="italic text-cyan-400">Build.</span>
            <br />
            Ship.
          </h1>
          <p className="text-sm text-neutral-400 max-w-xs leading-relaxed">
            The autonomous AI studio that turns any website into a working, deployable SaaS product.
          </p>
        </div>

        <div className="relative z-10 text-[11px] font-mono text-neutral-600 tracking-wide">
          © {new Date().getFullYear()} RECAST — GROQ-POWERED MULTI-AGENT ENGINE
        </div>
      </div>

      {/* ── Right: Auth form ─────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        <div className="absolute inset-0 bg-dot-grid opacity-[0.15] lg:hidden" />

        <div className="relative z-10 w-full max-w-sm space-y-8">
          {/* Mobile-only logo */}
          <div className="flex items-center space-x-3 lg:hidden">
            <div className="w-8 h-8 rounded-md bg-cyan-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-neutral-950" />
            </div>
            <span className="font-mono font-bold text-xs tracking-widest uppercase">Recast</span>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold tracking-[0.2em] uppercase text-cyan-400">
              Studio Access
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-neutral-50 leading-tight">
              {isSignUp ? (
                <>Create your <span className="italic text-cyan-400">studio</span> account</>
              ) : (
                <>Sign in to your <span className="italic text-cyan-400">studio</span></>
              )}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full bg-neutral-900/60 border border-white/[0.1] focus:border-cyan-400/60 rounded-md px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none transition-colors font-mono"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
                <Mail className="w-3 h-3" />
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-neutral-900/60 border border-white/[0.1] focus:border-cyan-400/60 rounded-md px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none transition-colors font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-900/60 border border-white/[0.1] focus:border-cyan-400/60 rounded-md px-4 py-3 pr-11 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs rounded-md flex items-center gap-2 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
                <span>{error}</span>
              </div>
            )}

            {infoMessage && (
              <div className="p-3 bg-cyan-400/10 border border-cyan-400/25 text-cyan-300 text-xs rounded-md flex items-center gap-2 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                <span>{infoMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-400 hover:bg-cyan-300 text-neutral-950 font-mono font-bold text-xs uppercase tracking-[0.15em] py-3.5 rounded-md shadow-lg shadow-cyan-400/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 active:scale-[0.99]"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-neutral-950/30 border-t-neutral-950 animate-spin"></div>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Authenticate'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-white/[0.06] text-xs text-neutral-500 font-mono">
            {isSignUp ? 'Already have access?' : 'No account yet?'}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setInfoMessage(null);
              }}
              className="text-cyan-400 hover:text-cyan-300 font-bold underline underline-offset-2 ml-1"
            >
              {isSignUp ? 'Sign In' : 'Request Access'}
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
        <div className="min-h-screen flex items-center justify-center bg-neutral-950">
          <div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin"></div>
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
