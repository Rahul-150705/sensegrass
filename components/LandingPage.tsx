'use client';

import Link from 'next/link';
import { ShaderBackground } from './ShaderBackground';
import {
  Sparkles,
  Globe,
  Brain,
  FolderTree,
  Code2,
  Eye,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Zap,
  Github,
  Twitter,
  Linkedin,
  FileCode,
  Server,
  Folder,
  Play,
} from 'lucide-react';

const TECH_STACK = ['Groq', 'Next.js', 'Supabase', 'Tailwind CSS', 'TypeScript'];

const FEATURES = [
  {
    icon: Brain,
    color: 'text-sky-400',
    title: 'Groq Strategy Agent',
    description: 'GPT-OSS 120B on Groq turns raw site content into a structured product strategy — target users, core problem, features, business model — that you can refine conversationally before anything is built.',
    large: true,
  },
  {
    icon: Code2,
    color: 'text-sky-300',
    title: 'Groq Code Agent',
    description: 'The same model writes production-quality frontend and backend code for every planned file. No separate coding model, no hand-off — one agent, start to finish.',
    large: true,
  },
  {
    icon: Globe,
    color: 'text-cyan-400',
    title: 'Website Extraction',
    description: 'Server-side scraping pulls titles, headings, and content from any public URL to seed the pipeline.',
  },
  {
    icon: FolderTree,
    color: 'text-cyan-300',
    title: 'AI-Generated File Directory',
    description: 'Groq plans the exact file tree, routes, components, and data entities before a single line of code is written.',
  },
  {
    icon: Eye,
    color: 'text-cyan-400',
    title: 'Live Preview',
    description: 'Watch your generated UI render in a sandboxed iframe as the pipeline builds it out.',
  },
  {
    icon: ShieldCheck,
    color: 'text-sky-400',
    title: 'Self-Healing QA',
    description: 'An automated verification agent checks the running app and patches compile errors it finds.',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Enter a URL', description: 'Point Recast at any public website and describe your product vision.', icon: Globe },
  { step: '02', title: 'Strategy', description: 'The Groq analyst agent produces a structured product strategy you can refine in chat.', icon: Brain },
  { step: '03', title: 'File Directory', description: 'Groq plans the full project file tree and architecture from the finalized strategy.', icon: FolderTree },
  { step: '04', title: 'Build', description: 'Groq writes real code for every planned file — frontend, backend, and config.', icon: Code2 },
  { step: '05', title: 'Preview', description: 'Review the live, running product in the built-in VS Code-style studio.', icon: Eye },
];

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: 'Kick the tires on the full pipeline.',
    features: ['3 projects / month', 'Groq strategy analysis', 'Live preview sandbox', 'Community support'],
    cta: 'Start Building Free',
    href: '/login?mode=signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    description: 'For builders shipping real products.',
    features: ['Unlimited projects', 'Groq full-stack code generation', 'Self-healing verification', 'Priority chat refine', 'Export to disk'],
    cta: 'Start Free Trial',
    href: '/login?mode=signup',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'SSO, dedicated capacity, and support SLAs.',
    features: ['Everything in Pro', 'SSO & RBAC', 'Dedicated model capacity', 'Custom integrations', 'Dedicated support'],
    cta: 'Contact Sales',
    href: 'mailto:hello@recast.dev',
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="relative isolate min-h-screen flex flex-col text-neutral-100 selection:bg-cyan-400 selection:text-neutral-950">
      {/* Animated Halftone-Dots shader backdrop (WebGL). Sits behind everything;
          the scrim keeps copy readable. Falls back to the solid <body> bg if
          WebGL is unavailable. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <ShaderBackground className="h-full w-full opacity-70" />
        <div className="absolute inset-0 bg-neutral-950/72" />
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <header className="border-b border-white/[0.06] bg-neutral-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-400/20">
              <Sparkles className="w-4 h-4 text-neutral-950" />
            </div>
            <span className="font-mono font-bold text-sm tracking-widest uppercase text-neutral-100">Recast</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-cyan-400 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login?mode=signup"
              className="flex items-center space-x-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-cyan-400 hover:bg-cyan-300 text-neutral-950 px-4 py-2.5 rounded-md shadow-lg shadow-cyan-400/20 transition-all active:scale-95"
            >
              <span>Get Started</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[500px] bg-dot-grid opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-400/10 blur-[140px] rounded-full pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-16 text-center space-y-7">
            <div className="inline-flex items-center space-x-2 bg-neutral-900/80 border border-white/[0.1] px-4 py-1.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Autonomous Multi-Agent SaaS Engine</span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.98] text-neutral-50">
              Turn any website into a
              <br />
              <span className="italic text-cyan-400">shipped SaaS product.</span>
            </h1>

            <p className="text-base text-neutral-400 max-w-xl mx-auto leading-relaxed">
              Paste a URL. Recast scrapes it, plans a product strategy, designs the file
              architecture, writes real full-stack code, and hands you a live, running preview —
              all through one autonomous AI pipeline.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/login?mode=signup"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-neutral-50 hover:bg-white text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider px-7 py-4 rounded-md shadow-xl transition-all active:scale-95"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-transparent hover:bg-white/5 border border-white/[0.12] text-neutral-200 font-mono font-semibold text-xs uppercase tracking-wider px-7 py-4 rounded-md transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
                <span>Watch It Work</span>
              </a>
            </div>

            {/* Tech-stack trust strip — real technologies this app actually runs on */}
            <div className="flex flex-col items-center gap-3 pt-6">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-neutral-600">
                Built On
              </span>
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
                {TECH_STACK.map((t) => (
                  <span key={t} className="font-mono text-sm font-semibold text-neutral-500 hover:text-neutral-300 transition-colors">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Hero visual — a fanned stack of pipeline-stage cards, hand-built for
              full control over the palette rather than a generic stock image */}
          <div className="relative max-w-4xl mx-auto px-4 pb-16 hidden md:block">
            <div className="relative h-56 flex items-center justify-center [perspective:1200px]">
              <div className="absolute w-64 h-40 bg-neutral-900 border border-white/[0.1] rounded-xl shadow-2xl shadow-black/60 p-4 [transform:rotate(-9deg)_translateX(-170px)] opacity-80">
                <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <Globe className="w-3 h-3" /> Strategy
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="h-1.5 w-4/5 bg-neutral-700 rounded"></div>
                  <div className="h-1.5 w-3/5 bg-neutral-700 rounded"></div>
                  <div className="h-1.5 w-2/3 bg-cyan-400/30 rounded"></div>
                </div>
              </div>
              <div className="absolute w-64 h-40 bg-neutral-900 border border-white/[0.1] rounded-xl shadow-2xl shadow-black/60 p-4 [transform:rotate(6deg)_translateX(170px)] opacity-80">
                <div className="flex items-center gap-1.5 text-sky-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <FolderTree className="w-3 h-3" /> File Directory
                </div>
                <div className="mt-3 space-y-1.5 font-mono text-[9px] text-neutral-500">
                  <div className="flex items-center gap-1"><FileCode className="w-2.5 h-2.5 text-sky-400" /> app/page.tsx</div>
                  <div className="flex items-center gap-1"><Server className="w-2.5 h-2.5 text-cyan-400" /> api/route.ts</div>
                  <div className="flex items-center gap-1"><FileCode className="w-2.5 h-2.5 text-sky-400" /> lib/db.ts</div>
                </div>
              </div>
              <div className="relative w-72 h-48 bg-neutral-900 border border-cyan-400/30 rounded-xl shadow-2xl shadow-cyan-500/20 p-5 z-10">
                <div className="flex items-center gap-1.5 text-cyan-300 text-[11px] font-mono font-bold uppercase tracking-wider">
                  <Code2 className="w-3.5 h-3.5" /> Live Build
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-2 w-5/6 bg-cyan-400/40 rounded"></div>
                  <div className="h-2 w-1/2 bg-neutral-700 rounded"></div>
                  <div className="h-2 w-2/3 bg-sky-400/40 rounded"></div>
                  <div className="h-2 w-3/4 bg-neutral-700 rounded"></div>
                </div>
                <div className="absolute bottom-4 right-5 flex items-center gap-1.5 text-[9px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> compiling
                </div>
              </div>
            </div>
          </div>

          {/* Browser-chrome framed product mockup */}
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
            <div className="rounded-xl border border-white/[0.1] bg-neutral-900 shadow-2xl shadow-black/60 overflow-hidden">
              <div className="bg-neutral-950/80 border-b border-white/[0.08] px-4 py-2.5 flex items-center space-x-3">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400/70"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70"></div>
                </div>
                <span className="text-[11px] font-mono text-neutral-500">recast.app/projects/studio</span>
              </div>
              <div className="flex h-72 sm:h-96">
                <div className="w-32 sm:w-40 bg-neutral-950/60 border-r border-white/[0.08] p-3 space-y-2 text-[10px] font-mono shrink-0">
                  <div className="flex items-center gap-1.5 text-neutral-400 font-bold uppercase text-[9px] tracking-wider">
                    <Folder className="w-3 h-3 text-cyan-400" /> app/
                  </div>
                  <div className="pl-3 flex items-center gap-1.5 text-cyan-300 bg-cyan-400/10 border border-cyan-400/20 rounded px-1.5 py-1">
                    <FileCode className="w-3 h-3 text-cyan-400" /> page.tsx
                  </div>
                  <div className="pl-3 flex items-center gap-1.5 text-neutral-400">
                    <FileCode className="w-3 h-3 text-cyan-400" /> layout.tsx
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-400 font-bold uppercase text-[9px] tracking-wider pt-1">
                    <Server className="w-3 h-3 text-sky-400" /> api/
                  </div>
                  <div className="pl-3 flex items-center gap-1.5 text-neutral-400">
                    <FileCode className="w-3 h-3 text-sky-400" /> route.ts
                  </div>
                </div>
                <div className="flex-1 flex">
                  <div className="flex-1 p-4 space-y-2 font-mono text-[9px] hidden sm:block">
                    <div className="h-1.5 w-3/4 bg-cyan-400/30 rounded"></div>
                    <div className="h-1.5 w-1/2 bg-neutral-700 rounded"></div>
                    <div className="h-1.5 w-5/6 bg-neutral-700 rounded"></div>
                    <div className="h-1.5 w-2/3 bg-sky-400/30 rounded"></div>
                    <div className="h-1.5 w-3/5 bg-neutral-700 rounded"></div>
                    <div className="h-1.5 w-4/5 bg-neutral-700 rounded"></div>
                    <div className="h-1.5 w-1/3 bg-cyan-400/30 rounded"></div>
                    <div className="h-1.5 w-2/3 bg-neutral-700 rounded"></div>
                  </div>
                  <div className="flex-1 bg-neutral-50/95 m-4 rounded-lg p-4 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="h-2.5 w-24 bg-neutral-800 rounded"></div>
                      <div className="h-5 w-14 bg-cyan-400 rounded"></div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      <div className="h-14 bg-cyan-50 rounded border border-cyan-200"></div>
                      <div className="h-14 bg-sky-50 rounded border border-sky-200"></div>
                      <div className="h-14 bg-neutral-100 rounded border border-neutral-200"></div>
                      <div className="h-14 bg-neutral-100 rounded border border-neutral-200"></div>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-200 rounded"></div>
                    <div className="h-1.5 w-4/5 bg-neutral-200 rounded"></div>
                    <div className="h-16 w-full bg-neutral-100 rounded border border-neutral-200"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────────────── */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-t border-white/[0.06]">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-[0.2em]">Features</span>
            <h2 className="font-display text-3xl sm:text-4xl text-neutral-50">One pipeline, six autonomous agents</h2>
            <p className="text-sm text-neutral-400">Every stage of the pipeline is a distinct, purpose-built AI agent.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={`bg-neutral-900/60 border border-white/[0.06] hover:border-cyan-400/30 rounded-lg p-6 transition-all ${
                    f.large ? 'lg:col-span-2 space-y-4' : 'space-y-3'
                  }`}
                >
                  <div className={`rounded-md bg-neutral-950 border border-white/10 flex items-center justify-center ${f.large ? 'w-12 h-12' : 'w-10 h-10'}`}>
                    <Icon className={`${f.large ? 'w-5 h-5' : 'w-4.5 h-4.5'} ${f.color}`} />
                  </div>
                  <h3 className={`font-bold text-white font-mono uppercase tracking-wide ${f.large ? 'text-base' : 'text-sm'}`}>{f.title}</h3>
                  <p className={`text-neutral-400 leading-relaxed ${f.large ? 'text-sm max-w-md' : 'text-xs'}`}>{f.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────────── */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-t border-white/[0.06]">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-[0.2em]">How It Works</span>
            <h2 className="font-display text-3xl sm:text-4xl text-neutral-50">From URL to running product in five steps</h2>
          </div>

          <div className="relative grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="hidden lg:block absolute top-6 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            {HOW_IT_WORKS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="relative space-y-3 text-center">
                  <div className="w-12 h-12 mx-auto rounded-md bg-neutral-900 border border-cyan-400/30 flex items-center justify-center relative z-10 shadow-md">
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-cyan-400">{s.step}</span>
                    <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">{s.title}</h3>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">{s.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────────────────────── */}
        <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-t border-white/[0.06]">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-[0.2em]">Pricing</span>
            <h2 className="font-display text-3xl sm:text-4xl text-neutral-50">Simple, illustrative pricing</h2>
            <p className="text-sm text-neutral-400">Demo tiers — wire up billing before taking this to production.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {PRICING.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-lg p-6 space-y-5 border flex flex-col ${
                  tier.highlighted
                    ? 'bg-neutral-900 border-cyan-400/50 shadow-xl shadow-cyan-400/10 ring-1 ring-cyan-400/20'
                    : 'bg-neutral-900/60 border-white/[0.08]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">{tier.name}</h3>
                    {tier.highlighted && (
                      <span className="text-[9px] font-mono font-bold uppercase bg-cyan-400 text-neutral-950 px-2 py-0.5 rounded">Popular</span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl text-white">{tier.price}</span>
                    <span className="text-xs text-neutral-400">{tier.period}</span>
                  </div>
                  <p className="text-xs text-neutral-400">{tier.description}</p>
                </div>

                <ul className="space-y-2 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-neutral-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.href}
                  className={`text-center text-xs font-mono font-bold uppercase tracking-wider py-3 rounded-md transition-all ${
                    tier.highlighted
                      ? 'bg-cyan-400 hover:bg-cyan-300 text-neutral-950 shadow-lg shadow-cyan-400/20'
                      : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-200 border border-white/10'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="relative bg-neutral-900/90 border border-white/[0.08] rounded-xl p-10 text-center space-y-5 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-dot-grid opacity-20" />
            <div className="relative w-12 h-12 rounded-md bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center mx-auto text-cyan-400">
              <Zap className="w-6 h-6" />
            </div>
            <h2 className="relative font-display text-3xl sm:text-4xl text-neutral-50">Ready to forge your product?</h2>
            <p className="relative text-sm text-neutral-400 max-w-md mx-auto">Sign up free and turn your first website into a working SaaS product in minutes.</p>
            <Link
              href="/login?mode=signup"
              className="relative inline-flex items-center space-x-2 bg-cyan-400 hover:bg-cyan-300 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider px-7 py-4 rounded-md shadow-lg shadow-cyan-400/20 transition-all active:scale-95"
            >
              <span>Start Building Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-md bg-cyan-400 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-neutral-950" />
              </div>
              <span className="font-mono font-bold text-xs tracking-widest uppercase text-white">Recast</span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">Autonomous multi-agent SaaS blueprint & code studio.</p>
            <div className="flex items-center gap-2.5 pt-1">
              <a href="#" className="text-neutral-500 hover:text-cyan-400 transition-colors" aria-label="GitHub"><Github className="w-4 h-4" /></a>
              <a href="#" className="text-neutral-500 hover:text-cyan-400 transition-colors" aria-label="Twitter"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="text-neutral-500 hover:text-cyan-400 transition-colors" aria-label="LinkedIn"><Linkedin className="w-4 h-4" /></a>
            </div>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-[0.15em]">Product</h4>
            <a href="#features" className="block text-xs text-neutral-500 hover:text-cyan-400 transition-colors">Features</a>
            <a href="#how-it-works" className="block text-xs text-neutral-500 hover:text-cyan-400 transition-colors">How It Works</a>
            <a href="#pricing" className="block text-xs text-neutral-500 hover:text-cyan-400 transition-colors">Pricing</a>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-[0.15em]">Company</h4>
            <a href="#" className="block text-xs text-neutral-500 hover:text-cyan-400 transition-colors">About</a>
            <a href="#" className="block text-xs text-neutral-500 hover:text-cyan-400 transition-colors">Blog</a>
            <a href="mailto:hello@recast.dev" className="block text-xs text-neutral-500 hover:text-cyan-400 transition-colors">Contact</a>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-[0.15em]">Legal</h4>
            <a href="#" className="block text-xs text-neutral-500 hover:text-cyan-400 transition-colors">Privacy Policy</a>
            <a href="#" className="block text-xs text-neutral-500 hover:text-cyan-400 transition-colors">Terms of Service</a>
          </div>
        </div>

        <div className="border-t border-white/[0.06] py-5 px-4 sm:px-6 lg:px-8">
          <p className="text-[11px] text-neutral-600 text-center font-mono">
            © {new Date().getFullYear()} Recast. Built as a multi-agent AI demo product.
          </p>
        </div>
      </footer>
    </div>
  );
}
