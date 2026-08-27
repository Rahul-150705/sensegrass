'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppRail from '@/components/AppRail';
import { Project } from '@/types';
import { getCurrentUser, getAuthToken, UserSession } from '@/lib/auth';
import {
  Globe, Sparkles, Search, FolderOpen, ArrowRight, Calendar, Rocket,
  Link2, Lightbulb, LayoutGrid, Shapes, FileText, Target,
} from 'lucide-react';

const TEMPLATES = [
  {
    name: 'SaaS Landing Page',
    description: 'Build a high-converting SaaS marketing site with a hero, feature grid, pricing tiers, and waitlist capture.',
    targetCustomer: 'Early-stage startup founders',
  },
  {
    name: 'Admin Dashboard',
    description: 'Build an internal admin dashboard with KPI cards, data tables, filtering, and role-based access.',
    targetCustomer: 'Operations & internal teams',
  },
  {
    name: 'AI Tool',
    description: 'Build an AI-powered tool that takes a user prompt, returns a generated result, and keeps a history of runs.',
    targetCustomer: 'Indie hackers & small businesses',
  },
  {
    name: 'CRM',
    description: 'Build a lightweight CRM to track leads, deals in a pipeline, and per-contact notes and activity.',
    targetCustomer: 'Sales teams at small businesses',
  },
  {
    name: 'E-commerce Product',
    description: 'Build a modern storefront with product listing pages, a product detail view, a cart, and checkout.',
    targetCustomer: 'Direct-to-consumer brands',
  },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function projectStatus(p: Project): { label: string; cls: string } {
  if (p.generatedFiles && p.generatedFiles.length > 0)
    return { label: 'Product Generated', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' };
  if (p.fileDirectory || p.blueprint)
    return { label: 'Blueprint Ready', cls: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/25' };
  if (p.analysis)
    return { label: 'Analysis Ready', cls: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/25' };
  return { label: 'Draft', cls: 'text-neutral-400 bg-neutral-800/60 border-white/10' };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Start-building form
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [description, setDescription] = useState('');
  const [targetCustomer, setTargetCustomer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const urlRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser();
      if (!u) {
        router.push('/login?redirect=/dashboard');
        return;
      }
      setUser(u);
      try {
        const token = getAuthToken();
        const res = await fetch('/api/projects', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success && data.projects) setProjects(data.projects);
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const scrollTo = (ref: React.RefObject<HTMLElement>) =>
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const focusForm = (mode: 'url' | 'idea') => {
    scrollTo(formRef);
    setTimeout(() => {
      if (mode === 'url') {
        urlRef.current?.focus();
      } else {
        setWebsiteUrl('');
        descRef.current?.focus();
      }
    }, 300);
  };

  const applyTemplate = (t: (typeof TEMPLATES)[number]) => {
    setWebsiteUrl('');
    setDescription(t.description);
    setTargetCustomer(t.targetCustomer);
    setFormError(null);
    focusForm('idea');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          websiteUrl: websiteUrl.trim(),
          description: description.trim(),
          targetCustomer: targetCustomer.trim() || 'Small business owners',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to start the project.');
      router.push(`/projects/${data.projectId}`);
    } catch (err: any) {
      setFormError(err?.message || 'Something went wrong.');
      setSubmitting(false);
    }
  };

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.blueprint?.productName || p.name || '').toLowerCase().includes(q) ||
      (p.websiteUrl || '').toLowerCase().includes(q)
    );
  });
  const recent = projects.slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 md:pl-24">
      <AppRail />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-28 md:py-12 w-full space-y-12">
        {/* ── Welcome ─────────────────────────────────────────────── */}
        <section className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {greeting()}{user?.name ? `, ${user.name}` : ''} <span className="align-middle">👋</span>
          </h1>
          <p className="text-sm text-neutral-400">
            Turn a website into your next product with AI — or start from just an idea.
          </p>
        </section>

        {/* ── Start Building ──────────────────────────────────────── */}
        <section ref={formRef} className="scroll-mt-24">
          <div className="bg-neutral-900/80 border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Start Building</h2>
                <p className="text-[11px] text-neutral-500 font-mono">Paste a URL to analyze, or leave it blank to build from an idea.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5 uppercase tracking-wide font-mono">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" /> Website URL <span className="text-neutral-600 normal-case">— optional</span>
                </label>
                <input
                  ref={urlRef}
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-neutral-950/80 border border-white/[0.08] focus:border-cyan-400/50 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-600 focus:outline-none transition-colors font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5 uppercase tracking-wide font-mono">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" /> What do you want to build?
                </label>
                <textarea
                  ref={descRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                  placeholder="Build a modern SaaS version of this product for small businesses."
                  className="w-full bg-neutral-950/80 border border-white/[0.08] focus:border-cyan-400/50 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-600 focus:outline-none transition-colors leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5 uppercase tracking-wide font-mono">
                  <Target className="w-3.5 h-3.5 text-cyan-400" /> Target customer <span className="text-neutral-600 normal-case">— optional</span>
                </label>
                <input
                  type="text"
                  value={targetCustomer}
                  onChange={(e) => setTargetCustomer(e.target.value)}
                  placeholder="Small business owners"
                  className="w-full bg-neutral-950/80 border border-white/[0.08] focus:border-cyan-400/50 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-600 focus:outline-none transition-colors"
                />
              </div>

              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !description.trim()}
                className="w-full bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-neutral-950 font-bold text-xs uppercase tracking-wide py-3.5 px-6 rounded-xl shadow-md shadow-cyan-400/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-neutral-950/30 border-t-neutral-950 animate-spin" />
                    <span>Running the pipeline…</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    <span>Analyze &amp; Build</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* ── Quick Actions ──────────────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-[0.15em] font-mono">Quick Actions</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <button
              onClick={() => focusForm('url')}
              className="text-left bg-neutral-900/70 hover:bg-neutral-900 border border-white/[0.07] hover:border-cyan-400/30 rounded-xl p-4 space-y-1.5 transition-all"
            >
              <Link2 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white">Analyze Website</h3>
              <p className="text-[11px] text-neutral-400 leading-relaxed">Paste a URL and discover its product, positioning, and features.</p>
            </button>
            <button
              onClick={() => focusForm('idea')}
              className="text-left bg-neutral-900/70 hover:bg-neutral-900 border border-white/[0.07] hover:border-cyan-400/30 rounded-xl p-4 space-y-1.5 transition-all"
            >
              <Lightbulb className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white">Build from Idea</h3>
              <p className="text-[11px] text-neutral-400 leading-relaxed">No website? Describe the product and let AI draft the blueprint.</p>
            </button>
            <button
              onClick={() => scrollTo(projectsRef)}
              className="text-left bg-neutral-900/70 hover:bg-neutral-900 border border-white/[0.07] hover:border-cyan-400/30 rounded-xl p-4 space-y-1.5 transition-all"
            >
              <LayoutGrid className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white">Browse Projects</h3>
              <p className="text-[11px] text-neutral-400 leading-relaxed">Continue previous work — reopen any saved project.</p>
            </button>
          </div>
        </section>

        {/* ── Templates ──────────────────────────────────────────── */}
        <section id="templates" className="scroll-mt-24 space-y-3">
          <div className="flex items-center gap-2">
            <Shapes className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-[0.15em] font-mono">Start with a Template</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => applyTemplate(t)}
                className="text-xs font-medium bg-neutral-900/70 hover:bg-cyan-400/10 text-neutral-300 hover:text-white border border-white/[0.08] hover:border-cyan-400/40 px-3.5 py-2 rounded-xl transition-all"
              >
                {t.name}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-neutral-600 font-mono">Templates pre-fill the form above — tweak anything before you build.</p>
        </section>

        {/* ── Recent / All Projects ──────────────────────────────── */}
        <section id="projects" ref={projectsRef} className="scroll-mt-24 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Your Projects</h2>
              <span className="text-[11px] text-neutral-500 font-mono">({projects.length})</span>
            </div>
            {projects.length > 0 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-neutral-900/80 border border-white/[0.08] text-neutral-200 text-xs placeholder-neutral-500 rounded-xl pl-8 pr-4 py-2.5 focus:outline-none focus:border-cyan-400/50 transition-colors w-56 font-mono"
                />
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
              <p className="text-xs text-neutral-500 font-mono">Loading projects…</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-neutral-900/70 border border-white/[0.08] rounded-2xl p-10 text-center space-y-3 max-w-md mx-auto">
              <FolderOpen className="w-7 h-7 text-neutral-500 mx-auto" />
              <h3 className="text-sm font-bold text-white">No projects yet</h3>
              <p className="text-xs text-neutral-400">Use <span className="text-cyan-300 font-semibold">Start Building</span> above to create your first one.</p>
            </div>
          ) : (
            <>
              {search && filtered.length === 0 && (
                <p className="text-xs text-neutral-500 font-mono">No results for &quot;{search}&quot;.</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(search ? filtered : recent).map((proj) => {
                  const status = projectStatus(proj);
                  return (
                    <Link
                      key={proj.id}
                      href={`/projects/${proj.id}`}
                      className="group bg-neutral-900/70 border border-white/[0.08] hover:border-cyan-400/40 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${status.cls}`}>
                            ● {status.label}
                          </span>
                          <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-mono shrink-0">
                            <Calendar className="w-3 h-3" />
                            {new Date(proj.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors leading-tight">
                          {proj.blueprint?.productName || proj.name}
                        </h3>
                        {proj.websiteUrl ? (
                          <p className="text-[11px] text-neutral-400 flex items-center gap-1.5 truncate font-mono">
                            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="truncate">{proj.websiteUrl}</span>
                          </p>
                        ) : (
                          <p className="text-[11px] text-neutral-500 flex items-center gap-1.5 font-mono">
                            <Lightbulb className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> Idea-only
                          </p>
                        )}
                        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                          {proj.blueprint?.description || proj.description}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1.5">
                        Open Project <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </Link>
                  );
                })}
              </div>
              {!search && projects.length > recent.length && (
                <p className="text-[11px] text-neutral-500 font-mono text-center pt-1">
                  Showing {recent.length} of {projects.length}. Use search to find the rest.
                </p>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
