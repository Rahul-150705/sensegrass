'use client';

import Link from 'next/link';
import { ShaderBackground } from './ShaderBackground';
import SourceCastDiff from './SourceCastDiff';
import { ArrowRight } from 'lucide-react';

const METHOD = [
  { n: '01', t: 'Read the site', d: 'Server-side scrape of the real HTML — title, headings, copy, positioning.' },
  { n: '02', t: 'Argue the strategy', d: 'A structured product analysis you refine by chat before anything is built.' },
  { n: '03', t: 'Draw the blueprint', d: 'Name, features, navigation, pages, UI direction — editable in plain English.' },
  { n: '04', t: 'Plan every file', d: 'The exact file tree, routes, and data entities. Reviewed, then locked.' },
  { n: '05', t: 'Write the code', d: 'Real frontend + backend code, one file at a time, in a VS Code-style studio.' },
];

const STAGES = ['SOURCE', 'STRATEGY', 'BLUEPRINT', 'FILE TREE', 'CODE'];

const PRICING = [
  { row: 'Projects / month', free: '3', pro: 'Unlimited', ent: 'Unlimited' },
  { row: 'Strategy + blueprint', free: '✓', pro: '✓', ent: '✓' },
  { row: 'Full-stack code generation', free: '—', pro: '✓', ent: '✓' },
  { row: 'Chat refine (all stages)', free: '✓', pro: 'Priority', ent: 'Priority' },
  { row: 'Export to disk', free: '—', pro: '✓', ent: '✓' },
  { row: 'SSO / RBAC / SLA', free: '—', pro: '—', ent: '✓' },
];

export default function LandingPage() {
  return (
    <div className="relative isolate min-h-screen flex flex-col bg-ink text-bone selection:bg-molten selection:text-ink">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <ShaderBackground className="h-full w-full opacity-40" />
        <div className="absolute inset-0 bg-ink/85" />
      </div>

      {/* ── nav ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 rule-b border-line bg-ink/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 bg-molten" />
            <span className="font-mono font-bold text-[11px] tracking-[0.28em] uppercase">Recast</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 mono-label">
            <a href="#method" className="hover:text-bone transition-colors">Method</a>
            <a href="#run" className="hover:text-bone transition-colors">How it runs</a>
            <a href="#pricing" className="hover:text-bone transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="mono-label hover:text-bone transition-colors">Sign in</Link>
            <Link href="/login?mode=signup" className="bg-molten text-ink px-3.5 py-2 font-mono font-bold text-[10px] uppercase tracking-[0.14em] hover:opacity-90 transition-opacity">
              Start
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── 01 hero ───────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-20 pb-24">
          <span className="section-num">01 — SOURCE</span>
          <h1 className="display-xl font-display text-[3rem] sm:text-[5rem] mt-4">
            Recast a live site<br />into a product.
          </h1>
          <p className="mt-6 max-w-xl text-[15px] text-bone-dim leading-relaxed">
            Paste a URL. Recast reads the real site, argues a product strategy with you, draws
            the blueprint, plans every file, and writes the code — one stage at a time, all reviewable.
          </p>

          <div className="mt-8 flex items-center gap-3 max-w-lg">
            <span className="mono-label shrink-0">URL</span>
            <span className="flex-1 rule-b border-line pb-2 font-mono text-sm text-bone flex items-center">
              stripe.com<span className="caret ml-1 h-4" />
            </span>
            <Link href="/login?mode=signup" className="bg-molten text-ink px-4 py-2.5 font-mono font-bold text-[10px] uppercase tracking-[0.14em] flex items-center gap-2 hover:opacity-90 transition-opacity">
              Recast <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.75} />
            </Link>
          </div>

          <div className="mt-12 recast-in">
            <SourceCastDiff
              sourceLabel="stripe.com"
              source={[
                { k: 'title', v: 'Stripe — Payments infrastructure for the internet' },
                { k: 'headings', v: 'Global payments · Billing · Connect · Radar' },
                { k: 'reads as', v: 'developer-first payments platform, enterprise scale' },
              ]}
              castLabel="Proposed product"
              cast={[
                { k: 'name', v: 'LedgerLoop' },
                { k: 'tagline', v: 'Subscription billing + revenue analytics for SMB merchants' },
                { k: 'mvp', v: 'Dashboard · Plans · Dunning · Webhooks · Reports' },
              ]}
            />
          </div>
        </section>

        {/* ── 02 method ─────────────────────────────────────────── */}
        <section id="method" className="rule-t border-line">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
            <span className="section-num">02 — THE METHOD</span>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold mt-3 mb-8">
              Five stages. You review every one.
            </h2>
            <div>
              {METHOD.map((m) => (
                <div key={m.n} className="grid grid-cols-[3rem_1fr] sm:grid-cols-[4rem_14rem_1fr] gap-4 py-5 rule-b border-line items-baseline">
                  <span className="section-num">{m.n}</span>
                  <span className="font-display text-lg font-semibold text-bone">{m.t}</span>
                  <span className="text-[13px] text-steel leading-relaxed col-span-2 sm:col-span-1">{m.d}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 03 how it runs — filmstrip ────────────────────────── */}
        <section id="run" className="rule-t border-line bg-ink-soft">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
            <span className="section-num">03 — HOW IT RUNS</span>
            <div className="mt-8 flex flex-col sm:flex-row sm:items-stretch gap-0 border border-line">
              {STAGES.map((s, i) => (
                <div key={s} className={`flex-1 p-5 ${i > 0 ? 'border-t sm:border-t-0 sm:border-l border-line' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className="section-num">0{i + 1}</span>
                    {i < STAGES.length - 1 && <ArrowRight className="w-3 h-3 text-molten ml-auto sm:hidden" />}
                  </div>
                  <div className="mono-label !text-bone mt-2">{s}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 04 pricing — spec table ───────────────────────────── */}
        <section id="pricing" className="rule-t border-line">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
            <span className="section-num">04 — PRICING</span>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold mt-3 mb-8">Spec sheet.</h2>
            <div className="border border-line">
              <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr]">
                <div className="p-4 mono-label rule-b border-line" />
                {[
                  { t: 'Free', p: '$0' },
                  { t: 'Pro', p: '$29/mo' },
                  { t: 'Enterprise', p: 'Custom' },
                ].map((c) => (
                  <div key={c.t} className="p-4 rule-b rule-l border-line">
                    <div className="mono-label !text-bone">{c.t}</div>
                    <div className="font-display text-lg font-semibold mt-1">{c.p}</div>
                  </div>
                ))}
                {PRICING.map((r) => (
                  <div key={r.row} className="contents">
                    <div className="p-4 rule-b border-line text-[13px] text-steel">{r.row}</div>
                    <div className="p-4 rule-b rule-l border-line font-mono text-xs text-bone">{r.free}</div>
                    <div className="p-4 rule-b rule-l border-line font-mono text-xs text-bone">{r.pro}</div>
                    <div className="p-4 rule-b rule-l border-line font-mono text-xs text-bone">{r.ent}</div>
                  </div>
                ))}
              </div>
            </div>
            <p className="mono-label mt-3 !tracking-normal !text-[10px]">
              Demo pricing — wire up billing before production.
            </p>
          </div>
        </section>

        {/* ── final cta ─────────────────────────────────────────── */}
        <section className="rule-t border-line bg-ink-soft">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-20 text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Point it at a website.</h2>
            <Link
              href="/login?mode=signup"
              className="mt-7 inline-flex items-center gap-3 bg-molten text-ink px-7 py-3.5 font-mono font-bold text-xs uppercase tracking-[0.14em] hover:opacity-90 transition-opacity"
            >
              Start free <ArrowRight className="w-4 h-4" strokeWidth={2.75} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="rule-t border-line">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-4 h-4 bg-molten" />
            <span className="mono-label">Recast — multi-agent AI product studio</span>
          </div>
          <span className="mono-label !text-[10px]">© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
