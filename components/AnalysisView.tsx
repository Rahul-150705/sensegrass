'use client';

import { ProductAnalysis, ScrapedContent } from '@/types';
import { ArrowRight } from 'lucide-react';

interface AnalysisViewProps {
  analysis: ProductAnalysis;
  scrapedInfo?: ScrapedContent | null;
  onBuildProduct: () => void;
  isBuilding?: boolean;
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-4 rule-b border-line last:border-b-0">
      <div className="mono-label mb-2">{label}</div>
      {children}
    </div>
  );
}

function List({ items, marker = '—' }: { items: string[]; marker?: string }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="text-[13px] text-bone/90 leading-relaxed flex gap-2.5">
          <span className="text-molten shrink-0 font-mono text-[11px] pt-0.5">{marker}</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AnalysisView({ analysis, scrapedInfo, onBuildProduct, isBuilding }: AnalysisViewProps) {
  return (
    <div className="panel">
      {/* header */}
      <div className="rule-b border-line p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="section-num">02 — STRATEGY</span>
          <h2 className="font-display text-lg font-semibold text-bone mt-1.5">Product analysis</h2>
        </div>
        <button
          onClick={onBuildProduct}
          disabled={isBuilding}
          className="group inline-flex items-center gap-2 bg-molten text-ink px-4 py-2.5 font-mono font-bold text-[10px] uppercase tracking-[0.14em] disabled:opacity-40 transition-opacity shrink-0"
        >
          {isBuilding ? 'Loading…' : 'Draw the blueprint'}
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.75} />
        </button>
      </div>

      <div className="p-4 sm:p-5">
        {scrapedInfo && (
          <Block label={`Source — ${scrapedInfo.url || 'idea-only'}`}>
            <div className="space-y-1">
              <div className="flex gap-3 text-[13px]">
                <span className="mono-label !text-[9px] w-20 shrink-0 pt-0.5">title</span>
                <span className="text-bone/90">{scrapedInfo.title || '—'}</span>
              </div>
              {scrapedInfo.headings?.length > 0 && (
                <div className="flex gap-3 text-[13px]">
                  <span className="mono-label !text-[9px] w-20 shrink-0 pt-0.5">headings</span>
                  <span className="text-steel font-mono text-[11px]">{scrapedInfo.headings.slice(0, 10).join(' · ')}</span>
                </div>
              )}
            </div>
          </Block>
        )}

        <Block label="Summary">
          <p className="text-[13px] text-bone/90 leading-relaxed">{analysis.summary}</p>
        </Block>

        <Block label="Target users">
          <List items={analysis.targetUsers} />
        </Block>

        <Block label="Core problem">
          <p className="text-[13px] text-bone/90 leading-relaxed">{analysis.coreProblem}</p>
        </Block>

        <Block label="Key features">
          <List items={analysis.keyFeatures} />
        </Block>

        <Block label="Business model">
          <p className="text-[13px] text-bone/90 leading-relaxed">{analysis.businessModel}</p>
        </Block>

        <Block label="Opportunities">
          <List items={analysis.suggestedImprovements} marker="+" />
        </Block>

        <Block label="Proposed MVP">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {analysis.proposedMVPFeatures.map((f, i) => (
              <div key={i} className="flex gap-2.5 py-1 text-[13px] text-bone/90">
                <span className="font-mono text-molten text-[11px] pt-0.5">{String(i + 1).padStart(2, '0')}</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </Block>
      </div>
    </div>
  );
}
