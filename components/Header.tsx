'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthModal from '@/components/AuthModal';
import { getCurrentUser, UserSession } from '@/lib/auth';
import { Layers, Plus, Sparkles, Terminal, Activity } from 'lucide-react';

export default function Header() {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  return (
    <header className="border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between py-3">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/10 group-hover:border-indigo-500/40 flex items-center justify-center shadow-sm transition-all group-hover:scale-105">
            <Sparkles className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-white tracking-tight">
                ProductForge
              </span>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider bg-slate-900 text-slate-300 border border-white/10 px-2 py-0.5 rounded-md hidden sm:inline-block">
                v0.1 Engine
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:block">AI SaaS Blueprint & Code Studio</span>
          </div>
        </Link>

        {/* Header Actions */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Status Indicator */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-white/[0.06] text-[11px] text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Multi-Agent Engine Active</span>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center space-x-2 text-xs font-medium bg-slate-900 hover:bg-slate-850 text-slate-200 border border-white/[0.08] hover:border-slate-700 px-3.5 py-2 rounded-xl transition-all shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Projects</span>
          </Link>

          <AuthModal user={user} onAuthChange={setUser} />

          <Link
            href="/"
            className="hidden sm:flex items-center space-x-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New SaaS</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
