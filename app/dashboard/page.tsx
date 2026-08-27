'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppRail from '@/components/AppRail';
import { getCurrentUser, getAuthToken, UserSession } from '@/lib/auth';
import { ArrowRight } from 'lucide-react';

const TEMPLATES = [
  { name: 'SaaS', description: 'Build a high-converting SaaS marketing site with a hero, feature grid, pricing tiers, and waitlist capture.', targetCustomer: 'Early-stage startup founders' },
  { name: 'Admin', description: 'Build an internal admin dashboard with KPI cards, data tables, filtering, and role-based access.', targetCustomer: 'Operations & internal teams' },
  { name: 'AI Tool', description: 'Build an AI-powered tool that takes a user prompt, returns a generated result, and keeps a history of runs.', targetCustomer: 'Indie hackers & small businesses' },
  { name: 'CRM', description: 'Build a lightweight CRM to track leads, a deal pipeline, and per-contact notes and activity.', targetCustomer: 'Sales teams at small businesses' },
  { name: 'Store', description: 'Build a modern storefront with product listing pages, a product detail view, a cart, and checkout.', targetCustomer: 'Direct-to-consumer brands' },
];

// Shown while /api/analyze runs — a timed readout of the steps actually
// happening server-side (scrape → extract → analyse), not a spinner.
function CastingConsole({ url }: { url: string }) {
  const STEPS = url
    ? ['Reading the site', 'Extracting signals', 'Arguing the strategy', 'Writing the analysis']
    : ['Reading the brief', 'Framing the market', 'Arguing the strategy', 'Writing the analysis'];
  const [i, setI] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setI((p) => Math.min(p + 1, STEPS.length - 1)), 2600);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="panel p-5 mt-8 recast-in">
      <div className="mono-label !text-molten">recasting {url || 'from idea'}…</div>
      <div className="mt-4 space-y-2.5">
        {STEPS.map((s, idx) => (
          <div key={s} className="flex items-center gap-3 font-mono text-[12px]">
            <span style={{ color: idx <= i ? 'var(--molten)' : 'var(--steel)' }}>
              {idx < i ? '●' : idx === i ? '▸' : '○'}
            </span>
            <span className={idx <= i ? 'text-bone' : 'text-steel/50'}>{s.toLowerCase()}</span>
            {idx === i && <span className="caret h-3" />}
          </div>
        ))}
      </div>
      <div className="mt-5 h-[2px] bg-line overflow-hidden">
        <div
          className="h-full bg-molten"
          style={{ width: `${((i + 1) / STEPS.length) * 100}%`, transition: 'width .6s ease-out' }}
        />
      </div>
      <p className="mono-label !text-[9px] mt-3">this can take 10–20 seconds · you&apos;ll drop into the studio when it&apos;s done</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [description, setDescription] = useState('');
  const [targetCustomer, setTargetCustomer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const urlRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUser();
      if (!u) {
        router.push('/login?redirect=/dashboard');
        return;
      }
      setUser(u);
    })();
  }, [router]);

  const applyTemplate = (t: (typeof TEMPLATES)[number]) => {
    setWebsiteUrl('');
    setDescription(t.description);
    setTargetCustomer(t.targetCustomer);
    setFormError(null);
    descRef.current?.focus();
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
      if (!res.ok || !data.success) throw new Error(data.error || 'Recast failed.');
      router.push(`/projects/${data.projectId}`);
    } catch (err: any) {
      setFormError(err?.message || 'Something went wrong.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ink text-bone md:pl-24">
      <AppRail />

      <main className="flex-1 w-full max-w-5xl mx-auto px-5 sm:px-8 pt-16 pb-28 md:py-16">
        <section className="recast-in">
          <div className="flex items-center justify-between gap-3">
            <span className="section-num">01 — WHAT ARE WE CASTING?</span>
            <div className="flex items-center gap-4">
              <span className="mono-label hidden sm:block">{user?.name ? `OPERATOR / ${user.name}` : ''}</span>
              <Link href="/dashboard/casts" className="mono-label hover:text-molten transition-colors">
                all casts →
              </Link>
            </div>
          </div>

          <h1 className="display-xl font-display text-[2.6rem] sm:text-[3.6rem] mt-4 text-bone">
            Recast a live site<br />into a product.
          </h1>

          {/* template toggles */}
          <div id="templates" className="mt-7 scroll-mt-24 flex flex-wrap gap-0 border border-line w-fit">
            {TEMPLATES.map((t, i) => (
              <button
                key={t.name}
                type="button"
                onClick={() => applyTemplate(t)}
                className={`mono-label !text-[10px] px-3 py-2 hover:text-molten hover:bg-white/[0.03] transition-colors ${i > 0 ? 'rule-l border-line' : ''}`}
              >
                {t.name}
              </button>
            ))}
          </div>

          {submitting ? (
            <CastingConsole url={websiteUrl.trim()} />
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.4fr)] gap-x-4 gap-y-5 items-end">
                <label className="block">
                  <span className="mono-label">Source URL — optional</span>
                  <input
                    ref={urlRef}
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="stripe.com"
                    className="cast-input w-full mt-2 py-2 text-sm"
                  />
                </label>
                <span className="hidden sm:block pb-2 text-molten"><ArrowRight className="w-5 h-5" strokeWidth={2.5} /></span>
                <label className="block">
                  <span className="mono-label">Intent — what to build</span>
                  <input
                    ref={descRef}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="a modern SaaS version for small businesses"
                    className="cast-input w-full mt-2 py-2 text-sm"
                  />
                </label>
              </div>

              <label className="block max-w-md">
                <span className="mono-label">Target customer — optional</span>
                <input
                  value={targetCustomer}
                  onChange={(e) => setTargetCustomer(e.target.value)}
                  placeholder="small business owners"
                  className="cast-input w-full mt-2 py-2 text-sm"
                />
              </label>

              {formError && (
                <div className="border-l-2 border-molten pl-3 py-1.5 recast-in">
                  <div className="mono-label !text-molten">could not recast</div>
                  <p className="text-[12px] text-bone/90 mt-0.5 leading-snug">{formError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!description.trim()}
                className="group inline-flex items-center gap-3 bg-molten text-ink px-6 py-3 font-mono font-bold text-xs uppercase tracking-[0.14em] disabled:opacity-40 transition-opacity"
              >
                Recast
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.75} />
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
