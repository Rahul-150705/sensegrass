'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logoutUser, UserSession } from '@/lib/auth';
import { LogIn, LogOut, User } from 'lucide-react';

interface AuthModalProps {
  user: UserSession | null;
  onAuthChange: (user: UserSession | null) => void;
}

export default function AuthModal({ user, onAuthChange }: AuthModalProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutUser();
    onAuthChange(null);
    router.push('/login');
  };

  if (user) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 bg-neutral-900/90 border border-white/[0.08] px-3 py-1.5 rounded-md text-xs font-mono">
          <User className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-neutral-200 font-semibold max-w-[120px] truncate">{user.name}</span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-white/[0.08] text-neutral-400 hover:text-rose-400 rounded-md transition-colors"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="flex items-center space-x-1.5 text-xs font-mono font-semibold uppercase tracking-wide bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-white/[0.08] hover:border-cyan-400/30 px-3.5 py-2 rounded-md transition-all"
    >
      <LogIn className="w-3.5 h-3.5 text-cyan-400" />
      <span>Sign In</span>
    </Link>
  );
}
