'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, signupUser, getCurrentUser } from '@/lib/auth';
import { Sparkles, ArrowRight, Lock, Mail, User, Zap, Code2, Terminal, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) {
        router.push('/');
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await signupUser(email, password, name);
      } else {
        await loginUser(email, password);
      }
      router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white relative">
      <div className="relative z-10 max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">ProductForge Studio</h1>
            <p className="text-xs text-slate-400 mt-1">Autonomous SaaS Blueprint & React UI Engine</p>
          </div>
        </div>

        {/* Auth Studio Card */}
        <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">
              {isSignUp ? 'Create Studio Account' : 'Sign in to Studio'}
            </h3>
            <p className="text-xs text-slate-400">
              {isSignUp
                ? 'Register to build and persist AI-generated SaaS applications'
                : 'Enter your work credentials to access saved blueprints'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>Work Email</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account & Start' : 'Sign In to Workspace'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-white/[0.06] text-xs text-slate-400">
            {isSignUp ? 'Already registered?' : "Need an account?"}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline ml-1"
            >
              {isSignUp ? 'Sign In' : 'Sign Up Free'}
            </button>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono px-2.5 py-1 rounded-md bg-slate-900/60 border border-white/[0.06] flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" /> Web Scraper
          </span>
          <span className="text-[11px] text-slate-400 font-mono px-2.5 py-1 rounded-md bg-slate-900/60 border border-white/[0.06] flex items-center gap-1.5">
            <Code2 className="w-3 h-3 text-indigo-400" /> Live React
          </span>
          <span className="text-[11px] text-slate-400 font-mono px-2.5 py-1 rounded-md bg-slate-900/60 border border-white/[0.06] flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-emerald-400" /> CLI Writer
          </span>
        </div>
      </div>
    </div>
  );
}
