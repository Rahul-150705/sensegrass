'use client';

import { ProductAnalysis, ScrapedContent } from '@/types';
import { Target, AlertCircle, CheckCircle2, Zap, DollarSign, Lightbulb, Rocket, ArrowRight, Globe, FileText, Tag, Check, Sparkles, TrendingUp } from 'lucide-react';

interface AnalysisViewProps {
  analysis: ProductAnalysis;
  scrapedInfo?: ScrapedContent | null;
  onBuildProduct: () => void;
  isBuilding?: boolean;
}

export default function AnalysisView({ analysis, scrapedInfo, onBuildProduct, isBuilding }: AnalysisViewProps) {
  return (
    <div className="bg-ink-soft border border-line rounded-none p-6 sm:p-8   space-y-6 relative overflow-hidden">
      {/* Header & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <span className="bg-ink text-molten border border-molten/30 text-[10px] px-3 py-0.5 rounded-md font-mono font-bold tracking-wider uppercase">
            Phase 1 — Strategic Analysis
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-bone mt-2 tracking-tight">Product Architecture Evaluation</h2>
          <p className="text-xs text-steel mt-0.5">Synthesized from live website content extraction and strategic positioning.</p>
        </div>

        <button
          onClick={onBuildProduct}
          disabled={isBuilding}
          className="bg-molten hover:opacity-90 text-ink font-bold text-xs sm:text-xs px-5 py-3 rounded-none  flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shrink-0"
        >
          {isBuilding ? (
            <>
              <div className="w-3.5 h-3.5 rounded-full border-2 border-ink/40 border-t-ink animate-spin"></div>
              <span>Loading...</span>
            </>
          ) : (
            <>
              <Rocket className="w-3.5 h-3.5" />
              <span>Continue to File Directory</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </>
          )}
        </button>
      </div>

      {/* Website Scraped Extraction Telemetry */}
      {scrapedInfo && (
        <div className="bg-ink border border-line p-4.5 rounded-none space-y-3 ">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2 text-molten text-xs font-bold uppercase tracking-wider font-mono">
              <Globe className="w-3.5 h-3.5" />
              <span>Scraped Web Telemetry</span>
            </div>
            <span className="bg-ink-soft text-emerald-400 border border-emerald-500/20 text-[10px] px-2.5 py-0.5 rounded-md font-mono font-semibold flex items-center gap-1.5">
              <Check className="w-3 h-3 text-emerald-400" /> Extracted Successfully
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-0.5">
            <div className="bg-ink-soft border border-line p-3 rounded-none">
              <span className="text-[10px] text-steel block font-mono">Page Title:</span>
              <span className="font-semibold text-bone truncate block mt-0.5">{scrapedInfo.title || 'Untitled Document'}</span>
            </div>
            <div className="bg-ink-soft border border-line p-3 rounded-none">
              <span className="text-[10px] text-steel block font-mono">Source URL:</span>
              <span className="font-mono text-molten text-[11px] truncate block mt-0.5">{scrapedInfo.url}</span>
            </div>
          </div>

          {scrapedInfo.headings && scrapedInfo.headings.length > 0 && (
            <div className="space-y-1.5 pt-0.5">
              <span className="text-[10px] text-steel font-mono flex items-center gap-1">
                <Tag className="w-3 h-3 text-molten" /> Key Extracted Headings:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {scrapedInfo.headings.slice(0, 8).map((h, idx) => (
                  <span key={idx} className="text-[10px] bg-ink-soft border border-line text-bone/80 px-2 py-0.5 rounded-md font-mono">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid of Analysis Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Executive Summary */}
        <div className="bg-ink border border-line p-4.5 rounded-none space-y-2 col-span-1 md:col-span-2">
          <div className="flex items-center space-x-2 text-molten text-xs font-bold uppercase tracking-wider font-mono">
            <Zap className="w-3.5 h-3.5" />
            <span>Product Overview & Strategic Vision</span>
          </div>
          <p className="text-xs sm:text-sm text-bone leading-relaxed font-sans">{analysis.summary}</p>
        </div>

        {/* Target Users */}
        <div className="bg-ink border border-line p-4.5 rounded-none space-y-2">
          <div className="flex items-center space-x-2 text-molten text-xs font-bold uppercase tracking-wider font-mono">
            <Target className="w-3.5 h-3.5" />
            <span>Target Customers</span>
          </div>
          <ul className="space-y-1.5 text-xs text-bone/80 pt-1">
            {analysis.targetUsers.map((user, idx) => (
              <li key={idx} className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                <span className="font-medium text-bone">{user}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Core Problem */}
        <div className="bg-ink border border-line p-4.5 rounded-none space-y-2">
          <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider font-mono">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Core Problem Solved</span>
          </div>
          <p className="text-xs text-bone/80 leading-relaxed pt-1 font-sans">{analysis.coreProblem}</p>
        </div>

        {/* Business Model */}
        <div className="bg-ink border border-line p-4.5 rounded-none space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider font-mono">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Business & Pricing Model</span>
          </div>
          <p className="text-xs text-bone/80 leading-relaxed pt-1 font-sans">{analysis.businessModel}</p>
        </div>

        {/* Strategic Opportunities */}
        <div className="bg-ink border border-line p-4.5 rounded-none space-y-2">
          <div className="flex items-center space-x-2 text-molten text-xs font-bold uppercase tracking-wider font-mono">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Differentiators & Opportunities</span>
          </div>
          <ul className="space-y-1.5 text-xs text-bone/80 pt-1">
            {analysis.suggestedImprovements.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-molten font-bold">•</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Proposed MVP Feature Modules */}
        <div className="bg-ink border border-line p-4.5 rounded-none space-y-3 col-span-1 md:col-span-2">
          <div className="flex items-center space-x-2 text-molten text-xs font-bold uppercase tracking-wider font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-molten" />
            <span>Proposed MVP Modules</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-bone">
            {analysis.proposedMVPFeatures.map((feat, idx) => (
              <div key={idx} className="bg-ink-soft border border-line p-3 rounded-none flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
