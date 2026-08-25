'use client';

import { ProductAnalysis, ScrapedContent } from '@/types';
import { Target, AlertCircle, CheckCircle2, Zap, DollarSign, Lightbulb, Rocket, ArrowRight, Globe, FileText, Tag, Check } from 'lucide-react';

interface AnalysisViewProps {
  analysis: ProductAnalysis;
  scrapedInfo?: ScrapedContent | null;
  onBuildProduct: () => void;
  isBuilding?: boolean;
}

export default function AnalysisView({ analysis, scrapedInfo, onBuildProduct, isBuilding }: AnalysisViewProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Analysis Header & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] px-3 py-1 rounded-full font-mono font-semibold">
            STEP 1 — PRODUCT ANALYSIS
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-2">Strategic Product Evaluation</h2>
          <p className="text-xs text-slate-400 mt-0.5">Synthesized from scraped website data and user requirements.</p>
        </div>

        <button
          onClick={onBuildProduct}
          disabled={isBuilding}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          {isBuilding ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
              <span>Generating Blueprint...</span>
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              <span>Build Product Blueprint</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>

      {/* Website Scraped Extraction Telemetry Card */}
      {scrapedInfo && (
        <div className="bg-slate-950/90 border border-indigo-500/30 p-5 rounded-2xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Globe className="w-4 h-4" />
              <span>Website Scraping Verification & Telemetry</span>
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
              <Check className="w-3 h-3" /> Extracted Successfully
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-mono">Page Title:</span>
              <span className="font-bold text-white truncate block mt-0.5">{scrapedInfo.title}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-mono">Target URL:</span>
              <span className="font-mono text-indigo-400 truncate block mt-0.5">{scrapedInfo.url}</span>
            </div>
          </div>

          {scrapedInfo.headings && scrapedInfo.headings.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <Tag className="w-3 h-3 text-indigo-400" /> Extracted Headings:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {scrapedInfo.headings.map((h, idx) => (
                  <span key={idx} className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          {scrapedInfo.description && (
            <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
              <span className="text-slate-400 font-mono">Meta Description:</span> {scrapedInfo.description}
            </div>
          )}
        </div>
      )}

      {/* Grid of Strategic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Executive Summary */}
        <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl space-y-2 col-span-1 md:col-span-2">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            <span>Product Overview</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">{analysis.summary}</p>
        </div>

        {/* Target Users / Audience */}
        <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl space-y-2">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Target className="w-4 h-4" />
            <span>Target Customers & Audience</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-300 pt-1">
            {analysis.targetUsers.map((user, idx) => (
              <li key={idx} className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                <span>{user}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Core Problem */}
        <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl space-y-2">
          <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            <span>Core Problem Solved</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed pt-1">{analysis.coreProblem}</p>
        </div>

        {/* Business Model */}
        <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <DollarSign className="w-4 h-4" />
            <span>Business & Pricing Model</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed pt-1">{analysis.businessModel}</p>
        </div>

        {/* Suggested Improvements */}
        <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Lightbulb className="w-4 h-4" />
            <span>Strategic Opportunities</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
            {analysis.suggestedImprovements.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-amber-400 text-sm leading-none">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Proposed MVP Features */}
        <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl space-y-3 col-span-1 md:col-span-2">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            <span>Proposed Core MVP Modules</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-200">
            {analysis.proposedMVPFeatures.map((feat, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
