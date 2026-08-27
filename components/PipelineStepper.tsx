'use client';

import { ArrowRight } from 'lucide-react';

export interface PipelineStep {
  id: string;
  name: string;
  agentName: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  details?: string;
}

interface PipelineStepperProps {
  currentStep: number;
  scrapedTitle?: string;
  scrapedHeadings?: string[];
  productName?: string;
  onContinueToStudio?: () => void;
}

export default function PipelineStepper({
  currentStep,
  scrapedTitle,
  scrapedHeadings,
  productName,
  onContinueToStudio,
}: PipelineStepperProps) {
  const st = (n: number): 'completed' | 'running' | 'pending' =>
    currentStep > n ? 'completed' : currentStep === n ? 'running' : 'pending';

  const steps = [
    { name: 'Read the site', agent: 'extractor', status: st(1), d: scrapedTitle ? `“${scrapedTitle}” · ${scrapedHeadings?.length ?? 0} headings` : 'scraping html, meta, headings, copy' },
    { name: 'Argue the strategy', agent: 'analyst', status: st(2), d: 'target users, core problem, features, business model' },
    { name: 'Draw the blueprint', agent: 'architect', status: st(3), d: productName ? `blueprint for “${productName}”` : 'routes, feature priorities, ui direction' },
    { name: 'Plan the file tree', agent: 'architect', status: st(4), d: 'exact files, routes, components, data entities' },
    { name: 'Write the code', agent: 'coder', status: st(5), d: 'real frontend + backend, one file at a time' },
    { name: 'Export', agent: 'cli', status: currentStep >= 6 ? 'completed' : 'pending', d: 'write generated files to disk (local)' },
  ];

  return (
    <div className="panel recast-in">
      <div className="rule-b border-line p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="section-num">01 — PIPELINE</span>
          <h2 className="font-display text-lg font-semibold text-bone mt-1.5">Multi-agent run</h2>
        </div>
        {currentStep >= 5 && onContinueToStudio && (
          <button
            onClick={onContinueToStudio}
            className="group inline-flex items-center gap-2 bg-molten text-ink px-4 py-2.5 font-mono font-bold text-[10px] uppercase tracking-[0.14em] transition-opacity"
          >
            Open studio
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.75} />
          </button>
        )}
      </div>

      <div className="p-4 sm:p-5 divide-y divide-line">
        {steps.map((s, i) => {
          const done = s.status === 'completed';
          const running = s.status === 'running';
          return (
            <div key={i} className={`py-3.5 flex items-baseline gap-4 ${s.status === 'pending' ? 'opacity-40' : ''}`}>
              <span className="font-mono text-[10px] w-6 shrink-0" style={{ color: running ? 'var(--molten)' : 'var(--steel)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[13px] text-bone">{s.name}</span>
                  <span className="mono-label !text-[9px]">{s.agent}</span>
                  <span
                    className="mono-label !text-[9px] ml-auto"
                    style={{ color: done ? 'var(--steel)' : running ? 'var(--molten)' : 'var(--steel)' }}
                  >
                    {done ? '● done' : running ? '● running' : '○ queued'}
                  </span>
                </div>
                <p className="text-[12px] text-steel leading-snug mt-0.5">{s.d}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
