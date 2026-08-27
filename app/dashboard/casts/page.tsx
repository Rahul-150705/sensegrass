'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppRail from '@/components/AppRail';
import SourceCastDiff from '@/components/SourceCastDiff';
import { Project } from '@/types';
import { getCurrentUser, getAuthToken } from '@/lib/auth';
import { ArrowRight, ArrowLeft } from 'lucide-react';

function stageOf(p: Project): string {
  if (p.generatedFiles && p.generatedFiles.length > 0) return 'CAST';
  if (p.fileDirectory || p.blueprint) return 'BLUEPRINT';
  if (p.analysis) return 'ANALYZED';
  return 'DRAFT';
}

function ago(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function CastsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const u = await getCurrentUser();
      if (!u) {
        router.push('/login?redirect=/dashboard/casts');
        return;
      }
      try {
        const token = getAuthToken();
        const res = await fetch('/api/projects', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const data = await res.json();
        if (data.success && data.projects) setProjects(data.projects);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const featured = projects.find((p) => p.analysis);
  const q = search.toLowerCase();
  const filtered = projects.filter(
    (p) =>
      (p.blueprint?.productName || p.name || '').toLowerCase().includes(q) ||
      (p.websiteUrl || '').toLowerCase().includes(q)
  );

  return (
    <div className="min-h-screen flex flex-col bg-ink text-bone md:pl-24">
      <AppRail />

      <main className="flex-1 w-full max-w-5xl mx-auto px-5 sm:px-8 pt-16 pb-28 md:py-16">
        <section className="recast-in">
          <div className="flex items-baseline justify-between gap-3">
            <span className="section-num">CASTS — HISTORY</span>
            <Link href="/dashboard" className="mono-label hover:text-molten transition-colors flex items-center gap-1.5">
              <ArrowLeft className="w-3 h-3" /> new cast
            </Link>
          </div>
          <h1 className="display-xl font-display text-[2.4rem] sm:text-[3.2rem] mt-4 text-bone">
            Everything you&apos;ve recast.
          </h1>

          <div className="mt-8 rule-b border-line pb-3 flex items-baseline justify-between gap-3">
            <span className="mono-label">{projects.length} total</span>
            {projects.length > 0 && (
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="filter…"
                className="cast-input py-1 text-[13px] w-40 sm:w-56 !border-b-0"
              />
            )}
          </div>

          {loading ? (
            <p className="mono-label py-10">loading…</p>
          ) : projects.length === 0 ? (
            <p className="mono-label py-10 !tracking-normal !text-[11px]">
              No casts yet.{' '}
              <Link href="/dashboard" className="!text-molten hover:underline">Run your first one →</Link>
            </p>
          ) : (
            <>
              {featured && !search && (
                <div className="py-6 rule-b border-line">
                  <div className="flex items-center justify-between mb-3">
                    <span className="mono-label !text-bone">LATEST — {featured.blueprint?.productName || featured.name}</span>
                    <Link href={`/projects/${featured.id}`} className="mono-label !text-molten hover:underline">
                      open →
                    </Link>
                  </div>
                  <SourceCastDiff
                    compact
                    sourceLabel={featured.websiteUrl ? 'Source site' : 'Brief'}
                    source={[
                      { k: 'url', v: featured.websiteUrl || 'idea-only' },
                      { k: 'title', v: featured.scrapedInfo?.title || featured.description.slice(0, 60) },
                      { k: 'signals', v: `${featured.scrapedInfo?.headings?.length ?? 0} headings scraped` },
                    ]}
                    castLabel="Product"
                    cast={[
                      { k: 'name', v: featured.blueprint?.productName || '—' },
                      { k: 'tagline', v: featured.blueprint?.tagline || featured.analysis?.summary?.slice(0, 60) || '—' },
                      { k: 'features', v: `${featured.blueprint?.features?.length ?? featured.analysis?.keyFeatures?.length ?? 0} proposed` },
                    ]}
                  />
                </div>
              )}

              <div className="mt-4">
                <div className="grid grid-cols-[2rem_1fr_1fr_5.5rem_5rem_1.5rem] gap-3 py-2 rule-b border-line mono-label">
                  <span>#</span><span>Name</span><span className="hidden sm:block">Source</span><span>Stage</span><span>Run</span><span />
                </div>
                {(search ? filtered : projects).map((p, i) => {
                  const stage = stageOf(p);
                  return (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="grid grid-cols-[2rem_1fr_1fr_5.5rem_5rem_1.5rem] gap-3 py-3 rule-b border-line items-center hover:bg-white/[0.03] transition-colors group"
                    >
                      <span className="font-mono text-[11px] text-steel">{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-[13px] text-bone truncate group-hover:text-molten transition-colors">
                        {p.blueprint?.productName || p.name}
                      </span>
                      <span className="hidden sm:block font-mono text-[11px] text-steel truncate">
                        {p.websiteUrl || 'idea-only'}
                      </span>
                      <span className={`font-mono text-[10px] tracking-wider ${stage === 'CAST' ? 'text-molten' : 'text-steel'}`}>
                        {stage}
                      </span>
                      <span className="font-mono text-[10px] text-steel">{ago(p.updatedAt)}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-steel group-hover:text-molten group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  );
                })}
                {search && filtered.length === 0 && (
                  <p className="mono-label py-6 !tracking-normal !text-[11px]">no casts match “{search}”.</p>
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
