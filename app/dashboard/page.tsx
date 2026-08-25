'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { Project } from '@/types';
import { getCurrentUser, getAuthToken } from '@/lib/auth';
import { Layers, Globe, Plus, Calendar, ArrowRight, Database, Code, Sparkles, Search, FolderOpen } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function init() {
      // Auth guard: redirect if not authenticated
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login?redirect=/dashboard');
        return;
      }

      // Fetch only this user's projects with Authorization header
      try {
        const token = getAuthToken();
        const res = await fetch('/api/projects', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success && data.projects) {
          setProjects(data.projects);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);


  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.blueprint?.productName || p.name || '').toLowerCase().includes(q) ||
      (p.websiteUrl || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 relative">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full space-y-8 relative z-10">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center">
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">SaaS Projects Studio</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {projects.length > 0 ? `${projects.length} project blueprints persisted in database` : 'All product blueprints & generated React UIs'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Box */}
            {projects.length > 0 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-900/90 border border-white/[0.08] text-slate-200 text-xs placeholder-slate-500 rounded-xl pl-8 pr-4 py-2.5 focus:outline-none focus:border-indigo-500/60 transition-colors w-48 font-mono"
                />
              </div>
            )}
            <Link
              href="/"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 flex items-center space-x-2 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New SaaS</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 font-mono">Loading projects...</p>
          </div>
        ) : filtered.length === 0 && search ? (
          <div className="bg-slate-900/80 border border-white/[0.08] rounded-2xl p-8 text-center space-y-3 max-w-sm mx-auto">
            <Search className="w-7 h-7 text-slate-500 mx-auto" />
            <div>
              <h3 className="text-sm font-bold text-white">No results for &quot;{search}&quot;</h3>
              <p className="text-xs text-slate-400 mt-1">Try a different keyword or clear the search filter.</p>
            </div>
            <button onClick={() => setSearch('')} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline">
              Clear search filter
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="max-w-md mx-auto">
            <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl p-10 text-center space-y-4 backdrop-blur-xl">
              <div className="w-12 h-12 rounded-xl bg-slate-850 border border-white/10 flex items-center justify-center mx-auto">
                <FolderOpen className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">No Saved Projects Yet</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Start by analyzing a target website like{' '}
                  <span className="text-indigo-400 font-semibold font-mono">stripe.com</span> to build your first AI SaaS product.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analyze First Website</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((proj) => (
              <div
                key={proj.id}
                className="bg-slate-900/80 border border-white/[0.08] hover:border-indigo-500/40 rounded-2xl p-5 shadow-sm hover:shadow-md flex flex-col justify-between space-y-4 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono bg-slate-950 text-indigo-300 border border-indigo-500/20 px-2.5 py-0.5 rounded-md font-semibold">
                      {proj.blueprint?.productName || proj.name}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {new Date(proj.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors leading-tight">
                      {proj.blueprint?.productName || proj.name}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1.5 truncate">
                      <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate font-mono text-[11px] text-slate-400">{proj.websiteUrl}</span>
                    </p>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {proj.blueprint?.description || proj.description}
                  </p>
                </div>

                <div className="border-t border-white/[0.06] pt-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5 text-[11px]">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <Database className="w-3 h-3" /> Saved
                    </span>
                    {proj.uiCode && (
                      <span className="flex items-center gap-1 text-indigo-400 font-medium">
                        <Code className="w-3 h-3" /> UI Ready
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/projects/${proj.id}`}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Open Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
