'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logoutUser, UserSession } from '@/lib/auth';
import { Sparkles, Plus, LogOut, LogIn, LayoutGrid, FolderKanban, Shapes, ChevronDown } from 'lucide-react';

const NAV = [
  { label: 'Home', href: '/dashboard', icon: LayoutGrid },
  { label: 'Projects', href: '/dashboard#projects', icon: FolderKanban },
  { label: 'Templates', href: '/dashboard#templates', icon: Shapes },
];

function initials(name?: string, email?: string) {
  const base = (name || email || 'U').trim();
  const parts = base.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setMenuOpen(false);
    router.push('/login');
  };

  return (
    <header className="border-b border-white/[0.07] bg-neutral-950/85 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center space-x-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-md bg-cyan-400 group-hover:bg-cyan-300 flex items-center justify-center shadow-md shadow-cyan-400/20 transition-all group-hover:scale-105">
            <Sparkles className="w-4 h-4 text-neutral-950" />
          </div>
          <span className="font-mono font-bold text-sm tracking-widest uppercase text-neutral-100">Recast</span>
          <span className="text-[9px] font-mono font-semibold uppercase tracking-wider bg-neutral-900 text-neutral-400 border border-white/10 px-1.5 py-0.5 rounded hidden sm:inline-block">
            v0.1
          </span>
        </Link>

        {/* Center nav (only meaningful when signed in) */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wide text-neutral-400 hover:text-neutral-100 px-3 py-2 rounded-md hover:bg-neutral-900/70 transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-cyan-400" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {user ? (
            <>
              <Link
                href="/new"
                className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wide bg-cyan-400 hover:bg-cyan-300 text-neutral-950 px-3.5 py-2 rounded-md shadow-md shadow-cyan-400/20 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </Link>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 bg-neutral-900/90 hover:bg-neutral-800 border border-white/[0.08] hover:border-cyan-400/30 pl-1.5 pr-2 py-1.5 rounded-md transition-colors"
                >
                  <span className="w-6 h-6 rounded bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono font-bold flex items-center justify-center">
                    {initials(user.name, user.email)}
                  </span>
                  <span className="hidden sm:block text-xs font-mono font-semibold text-neutral-200 max-w-[110px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-white/[0.1] rounded-lg shadow-2xl shadow-black/50 overflow-hidden z-50">
                    <div className="px-3 py-3 border-b border-white/[0.07]">
                      <p className="text-xs font-semibold text-neutral-100 truncate">{user.name}</p>
                      <p className="text-[11px] text-neutral-500 font-mono truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard#projects"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-xs font-mono text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                    >
                      <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />
                      My Projects
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-mono text-neutral-300 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border-t border-white/[0.07]"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wide bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-white/[0.08] hover:border-cyan-400/30 px-3.5 py-2 rounded-md transition-all"
            >
              <LogIn className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
