'use client';

import { useState } from 'react';
import { loginUser, logoutUser, UserSession } from '@/lib/auth';
import { LogIn, LogOut, User, Sparkles, X, Check, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  user: UserSession | null;
  onAuthChange: (user: UserSession | null) => void;
}

export default function AuthModal({ user, onAuthChange }: AuthModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const loggedIn = await loginUser(email, password);
      onAuthChange(loggedIn);
      setIsOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    onAuthChange(null);
  };

  return (
    <div>
      {user ? (
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-slate-900/90 border border-white/[0.08] px-3 py-1.5 rounded-xl text-xs">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-200 font-semibold max-w-[120px] truncate">{user.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-white/[0.08] text-slate-400 hover:text-rose-400 rounded-xl transition-colors"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/[0.08] hover:border-slate-700 px-3.5 py-2 rounded-xl transition-all"
        >
          <LogIn className="w-3.5 h-3.5 text-indigo-400" />
          <span>Sign In</span>
        </button>
      )}

      {/* Auth Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative space-y-5">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isSignUp ? 'Create Studio Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-slate-400">
                Sign in to persist your product blueprints and AI SaaS projects.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Work Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="builder@startup.com"
                  required
                  className="w-full bg-slate-950/90 border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/90 border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
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
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSignUp ? 'Sign Up Free' : 'Sign In'}</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-white/[0.06] text-xs text-slate-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-indigo-400 hover:text-indigo-300 font-semibold underline ml-1"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
