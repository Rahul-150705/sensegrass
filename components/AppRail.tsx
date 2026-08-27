'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentUser, logoutUser, UserSession } from '@/lib/auth';
import { LayoutGrid, Sparkles, FolderKanban, Shapes, LogOut } from 'lucide-react';

// Floating left icon rail (bottom bar on mobile) + floating brand and sign-out,
// modelled on the reference app's navigation. Content is Recast's.
const ITEMS = [
  { href: '/dashboard', label: 'Home', icon: LayoutGrid, match: (p: string) => p === '/dashboard' },
  { href: '/new', label: 'New Project', icon: Sparkles, match: (p: string) => p === '/new' },
  { href: '/dashboard#projects', label: 'Projects', icon: FolderKanban, match: () => false },
  { href: '/dashboard#templates', label: 'Templates', icon: Shapes, match: () => false },
];

export default function AppRail() {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    getCurrentUser().then(setUser);
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    router.push('/login');
  };

  return (
    <>
      {/* Floating brand — top left */}
      <Link
        href="/dashboard"
        className={`fixed top-5 left-5 z-50 flex items-center gap-2 transition-all duration-500 hover:opacity-80 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        <span className="w-7 h-7 rounded-md bg-cyan-400 grid place-items-center shadow-md shadow-cyan-400/25">
          <Sparkles className="w-4 h-4 text-neutral-950" />
        </span>
        <span className="font-mono font-bold text-xs tracking-[0.2em] uppercase text-neutral-100">Recast</span>
      </Link>

      {/* Floating user + sign out — top right */}
      <div
        className={`fixed top-4 right-5 z-50 flex items-center gap-3 transition-all duration-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        {user && (
          <span className="hidden sm:block text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-neutral-500 max-w-[140px] truncate">
            {user.name}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-white/10 bg-neutral-950/80 text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-neutral-500 hover:text-rose-400 hover:border-rose-400/30 transition-all"
        >
          <LogOut className="w-3 h-3" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>

      {/* Icon rail — left on desktop, bottom bar on mobile */}
      <nav
        aria-label="Primary"
        className={`fixed z-40 flex items-center gap-1 rounded-full border border-white/10 bg-neutral-900/90 backdrop-blur-xl p-2 shadow-xl shadow-black/40 transition-all duration-500
          left-1/2 bottom-4 -translate-x-1/2 flex-row
          md:left-4 md:top-1/2 md:bottom-auto md:translate-x-0 md:-translate-y-1/2 md:flex-col
          ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
      >
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={label}
              href={href}
              aria-label={label}
              className={`group relative grid h-10 w-10 place-items-center rounded-full transition-colors ${
                active
                  ? 'bg-cyan-400 text-neutral-950 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-100 hover:bg-white/[0.06]'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.5 : 2} />

              {/* Hover-expand label (desktop rail only) */}
              <span
                className="pointer-events-none absolute left-full ml-3 hidden md:block whitespace-nowrap rounded-md border border-white/10 bg-neutral-900 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wide text-neutral-200 opacity-0 -translate-x-1 shadow-lg transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0"
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
