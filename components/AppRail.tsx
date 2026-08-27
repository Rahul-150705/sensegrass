'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentUser, logoutUser, UserSession } from '@/lib/auth';
import { Sparkles, FolderKanban, Shapes, LogOut } from 'lucide-react';
import RecastMark from '@/components/RecastMark';

// Floating left icon rail (bottom bar on mobile) + floating brand and sign-out,
// modelled on the reference app's navigation. Content is Recast's.
const ITEMS = [
  { href: '/dashboard', label: 'New Cast', icon: Sparkles, match: (p: string) => p === '/dashboard' },
  { href: '/dashboard/casts', label: 'Casts', icon: FolderKanban, match: (p: string) => p === '/dashboard/casts' },
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
      {/* Floating brand — top left (no box, just the mark + wordmark) */}
      <Link
        href="/dashboard"
        className={`fixed top-4 left-4 z-50 flex items-center gap-2 transition-all duration-500 hover:opacity-70 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        <RecastMark className="h-7 w-7" />
        <span className="font-mono font-bold text-[11px] tracking-[0.22em] uppercase text-bone">Recast</span>
      </Link>

      {/* Floating user + sign out — top right */}
      <div
        className={`fixed top-4 right-5 z-50 flex items-center gap-3 transition-all duration-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        {user && (
          <span className="hidden sm:block mono-label !text-[10px] max-w-[140px] truncate">{user.name}</span>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-2.5 py-1.5 border border-line bg-ink/80 mono-label !text-[9px] hover:text-molten hover:border-molten/40 transition-colors"
        >
          <LogOut className="w-3 h-3" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>

      {/* Icon rail — left on desktop, bottom bar on mobile */}
      <nav
        aria-label="Primary"
        className={`fixed z-40 flex items-center gap-1 rounded-full border border-molten/40 bg-ink-2/90 p-1.5 backdrop-blur-md shadow-[0_12px_40px_-8px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,74,28,0.06),0_0_28px_-6px_rgba(255,74,28,0.35)] transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]
          left-1/2 bottom-4 -translate-x-1/2 flex-row
          md:left-4 md:top-1/2 md:bottom-auto md:translate-x-0 md:-translate-y-1/2 md:flex-col
          ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={label}
              href={href}
              aria-label={label}
              className={`group relative grid h-10 w-10 place-items-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform hover:scale-[1.08] active:scale-95 ${
                active
                  ? 'text-molten bg-molten/10 ring-1 ring-inset ring-molten/50'
                  : 'text-bone/55 hover:text-bone hover:bg-molten/10'
              }`}
            >
              <Icon
                className="w-[18px] h-[18px] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                strokeWidth={active ? 2.5 : 2}
              />

              {/* Hover-expand label (desktop rail only) */}
              <span className="pointer-events-none absolute left-full ml-3 hidden md:block whitespace-nowrap rounded-full border border-molten/30 bg-ink-2/90 backdrop-blur-md px-2.5 py-1 mono-label !text-[9px] !text-bone opacity-0 -translate-x-1 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 group-hover:translate-x-0">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
