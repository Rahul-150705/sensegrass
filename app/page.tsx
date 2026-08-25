'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Sparkles, Globe, Target, FileText, ArrowRight, CheckCircle2, Rocket } from 'lucide-react';
import { getCurrentUser, UserSession } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const [websiteUrl, setWebsiteUrl] = useState('https://example.com');
  const [description, setDescription] = useState('Build me a modern SaaS version of this product for small businesses.');
  const [targetCustomer, setTargetCustomer] = useState('Small business owners');
  const [user, setUser] = useState<UserSession | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Builder form state
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then((session) => {
      if (!session) {
        // Redirect to login page if unauthenticated
        router.push('/login');
      } else {
        setUser(session);
        setIsCheckingAuth(false);
      }
    });
  }, [router]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl || !description) return;
    if (!user) return;

    setLoading(true);
    setError(null);
    setStep(1);

    try {
      setTimeout(() => setStep(2), 1200);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl,
          description,
          targetCustomer,
          userId: user.id,
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
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-slate-400 font-medium mt-3">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex flex-col justify-center space-y-8">
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-indigo-300 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>AI Product Workspace</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Build Your SaaS Product
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
            Welcome, <span className="text-indigo-300 font-semibold">{user?.name}</span>! Enter a website link and your specifications below to generate a complete SaaS blueprint, starter code, and interactive live UI.
          </p>
        </div>

        {/* Builder Studio Form Card */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <form onSubmit={handleAnalyze} className="space-y-5">
            {/* Target Website URL Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Target Website URL</span>
              </label>
              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-mono shadow-inner"
              />
            </div>

            {/* Product Vision / Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Product Vision & Requirements</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Build me a modern SaaS version of this product for small businesses."
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
              />
            </div>

            {/* Target Customer / Audience */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <span>Target Customer / Audience</span>
              </label>
              <input
                type="text"
                value={targetCustomer}
                onChange={(e) => setTargetCustomer(e.target.value)}
                placeholder="Small business owners"
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
              />
            </div>

            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-2xl">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-sm py-4 px-6 rounded-2xl shadow-xl shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                  <span>Analyzing Website & Building Product...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>Analyze Website & Build Product</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Execution Pipeline Status */}
          {loading && (
            <div className="border-t border-slate-800/80 pt-5 space-y-3">
              <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                Workflow Progress:
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className={`w-4 h-4 ${step >= 1 ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span className={step >= 1 ? 'text-slate-200 font-medium' : 'text-slate-500'}>
                    1. Website Content Extraction
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className={`w-4 h-4 ${step >= 2 ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span className={step >= 2 ? 'text-slate-200 font-medium' : 'text-slate-500'}>
                    2. Strategic Product Analysis
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className={`w-4 h-4 ${step >= 3 ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span className={step >= 3 ? 'text-slate-200 font-medium' : 'text-slate-500'}>
                    3. Launching Product Studio
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
