'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthModal from '@/components/AuthModal';
import { getCurrentUser, UserSession } from '@/lib/auth';
import { Layers, Plus, Sparkles, Activity } from 'lucide-react';

export default function Header() {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  return (
    <header className="border-b border-white/[0.07] bg-neutral-950/85 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center space-x-3 group">
          <div className="w-8 h-8 rounded-md bg-cyan-400 group-hover:bg-cyan-300 flex items-center justify-center shadow-md shadow-cyan-400/20 transition-all group-hover:scale-105">
            <Sparkles className="w-4 h-4 text-neutral-950" />
          </div>
          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm tracking-widest uppercase text-neutral-100">
                Recast
              </span>
              <span className="text-[9px] font-mono font-semibold uppercase tracking-wider bg-neutral-900 text-neutral-400 border border-white/10 px-1.5 py-0.5 rounded hidden sm:inline-block">
                v0.1
              </span>
            </div>
            <span className="text-[10px] text-neutral-500 font-mono mt-0.5 hidden sm:block">AI SaaS Blueprint & Code Studio</span>
          </div>
        </Link>

        {/* Header Actions */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Status Indicator */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-md bg-neutral-900/80 border border-white/[0.07] text-[10px] text-neutral-400 font-mono uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Engine Active</span>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center space-x-2 text-xs font-mono font-semibold uppercase tracking-wide bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-white/[0.08] hover:border-cyan-400/30 px-3.5 py-2 rounded-md transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Projects</span>
          </Link>

          <AuthModal user={user} onAuthChange={setUser} />

          <Link
            href="/new"
            className="hidden sm:flex items-center space-x-1.5 text-xs font-mono font-bold uppercase tracking-wide bg-cyan-400 hover:bg-cyan-300 text-neutral-950 px-3.5 py-2 rounded-md shadow-md shadow-cyan-400/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
