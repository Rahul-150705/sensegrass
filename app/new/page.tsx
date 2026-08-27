'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppRail from '@/components/AppRail';
import {
  Sparkles,
  Globe,
  Target,
  FileText,
  ArrowRight,
  CheckCircle2,
  Rocket,
  Zap,
  Layers,
  Code2,
  Terminal,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { getCurrentUser, getAuthToken, UserSession } from '@/lib/auth';

const PRESET_WEBSITES = [
  {
    name: 'Stripe',
    url: 'https://stripe.com',
    vision: 'Build a modern merchant billing and subscription management SaaS with customer analytics.',
    audience: 'Online merchants & SaaS founders',
  },
  {
    name: 'Linear',
    url: 'https://linear.app',
    vision: 'Build a lightweight, lightning-fast sprint planning and issue tracker for agile engineering teams.',
    audience: 'Engineering managers & developers',
  },
  {
    name: 'Notion',
    url: 'https://notion.so',
    vision: 'Build an AI-powered collaborative workspace for company wikis, documentation, and team roadmaps.',
    audience: 'Remote startups & product teams',
  },
  {
    name: 'Loom',
    url: 'https://loom.com',
    vision: 'Build an asynchronous video messaging and feedback workspace for remote product teams.',
    audience: 'Product managers & designers',
  },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [websiteUrl, setWebsiteUrl] = useState('https://stripe.com');
  const [description, setDescription] = useState('Build me a modern merchant billing and subscription management SaaS with customer analytics.');
  const [targetCustomer, setTargetCustomer] = useState('Online merchants & SaaS founders');
  const [user, setUser] = useState<UserSession | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Builder form state
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then((session) => {
      if (!session) {
        router.push('/login?redirect=/new');
      } else {
        setUser(session);
        setIsCheckingAuth(false);
      }
    });
  }, [router]);

  const handleApplyPreset = (preset: typeof PRESET_WEBSITES[0]) => {
    setWebsiteUrl(preset.url);
    setDescription(preset.vision);
    setTargetCustomer(preset.audience);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl || !description) return;
    if (!user) return;

    setLoading(true);
    setError(null);
    setStep(1);

    try {
      setTimeout(() => setStep(2), 1200);

      const token = getAuthToken();
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          websiteUrl,
          description,
          targetCustomer,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze website.');
      }

      setStep(3);
      setTimeout(() => {
        router.push(`/projects/${data.projectId}`);
      }, 800);
    } catch (err: any) {
      setError(err?.message || 'An error occurred during analysis.');
      setLoading(false);
      setStep(0);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
        <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-slate-400 mt-4">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white relative md:pl-24">
      <AppRail />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-28 md:py-14 w-full flex flex-col justify-center space-y-10 relative z-10">
        {/* Minimalist Developer SaaS Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-slate-900 border border-white/10 px-3.5 py-1 rounded-full text-xs font-semibold text-indigo-300 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Autonomous Multi-Agent SaaS Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Turn Any Website Into a{' '}
            <span className="text-indigo-400">Full SaaS Product</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Welcome back, <span className="text-slate-200 font-bold">{user?.name}</span>! Provide any public URL to extract its value proposition, generate an end-to-end product architecture, compile live React components, and export to disk.
          </p>
        </div>

        {/* Quick Reference Presets */}
        <div className="space-y-2 max-w-3xl mx-auto w-full">
          <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block text-center">
            Quick Reference Inspirations:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PRESET_WEBSITES.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`text-xs px-3.5 py-1.5 rounded-xl border font-medium transition-all flex items-center space-x-1.5 ${
                  websiteUrl === preset.url
                    ? 'bg-slate-900 border-indigo-500/60 text-white shadow-sm ring-1 ring-indigo-500/30'
                    : 'bg-slate-900/60 hover:bg-slate-850 border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Builder Studio Card */}
        <div className="max-w-3xl mx-auto w-full">
          <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl p-6 sm:p-9 shadow-2xl backdrop-blur-xl space-y-6">
            <form onSubmit={handleAnalyze} className="space-y-5">
              {/* Target Website URL */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span>Target Website URL</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-500">Server Scraping Engine</span>
                </div>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors font-mono"
                />
              </div>

              {/* Product Vision */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Product Vision & Specific Requirements</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Build me a modern SaaS version of this product for small businesses."
                  required
                  className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors leading-relaxed"
                />
              </div>

              {/* Target Customer */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                  <Target className="w-4 h-4 text-indigo-400" />
                  <span>Target Customer Persona / Market</span>
                </label>
                <input
                  type="text"
                  value={targetCustomer}
                  onChange={(e) => setTargetCustomer(e.target.value)}
                  placeholder="Small business owners"
                  required
                  className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>

              {error && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Action */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3.5 px-6 rounded-xl shadow-md shadow-indigo-500/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                    <span>Executing Multi-Agent Workflow...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 text-white" />
                    <span>Analyze Website & Launch Product Studio</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>

            {/* Pipeline Status Cards */}
            {loading && (
              <div className="border-t border-white/[0.08] pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                    Autonomous Pipeline Telemetry:
                  </span>
                  <span className="text-[11px] font-mono text-indigo-400 animate-pulse">Running Agents...</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div
                    className={`p-3 rounded-xl border flex items-center space-x-2 ${
                      step >= 1 ? 'bg-slate-950 border-indigo-500/40 text-slate-200' : 'bg-slate-950/40 border-white/[0.05] text-slate-500'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${step >= 1 ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span className="truncate">1. Scraping HTML</span>
                  </div>
                  <div
                    className={`p-3 rounded-xl border flex items-center space-x-2 ${
                      step >= 2 ? 'bg-slate-950 border-indigo-500/40 text-slate-200' : 'bg-slate-950/40 border-white/[0.05] text-slate-500'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${step >= 2 ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span className="truncate">2. Strategy & Specs</span>
                  </div>
                  <div
                    className={`p-3 rounded-xl border flex items-center space-x-2 ${
                      step >= 3 ? 'bg-slate-950 border-indigo-500/40 text-slate-200' : 'bg-slate-950/40 border-white/[0.05] text-slate-500'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${step >= 3 ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span className="truncate">3. Launch Studio</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Developer Feature Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto w-full pt-2">
          <div className="bg-slate-900/60 border border-white/[0.06] rounded-xl p-4 text-center space-y-1.5">
            <Cpu className="w-4 h-4 text-indigo-400 mx-auto" />
            <h4 className="text-xs font-bold text-slate-200">Autonomous Agents</h4>
            <p className="text-[11px] text-slate-400">Scraping to Specs</p>
          </div>
          <div className="bg-slate-900/60 border border-white/[0.06] rounded-xl p-4 text-center space-y-1.5">
            <Code2 className="w-4 h-4 text-cyan-400 mx-auto" />
            <h4 className="text-xs font-bold text-slate-200">Live React UI</h4>
            <p className="text-[11px] text-slate-400">Interactive sandbox</p>
          </div>
          <div className="bg-slate-900/60 border border-white/[0.06] rounded-xl p-4 text-center space-y-1.5">
            <Terminal className="w-4 h-4 text-emerald-400 mx-auto" />
            <h4 className="text-xs font-bold text-slate-200">Disk Export</h4>
            <p className="text-[11px] text-slate-400">CLI project writer</p>
          </div>
          <div className="bg-slate-900/60 border border-white/[0.06] rounded-xl p-4 text-center space-y-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-400 mx-auto" />
            <h4 className="text-xs font-bold text-slate-200">Self-Healing AI</h4>
            <p className="text-[11px] text-slate-400">Automated verifier</p>
          </div>
        </div>
      </main>
    </div>
  );
}
