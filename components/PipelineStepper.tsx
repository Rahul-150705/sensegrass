'use client';

import { CheckCircle2, Clock, Terminal, Globe, Brain, Compass, Code2, ShieldCheck, ArrowRight, Play } from 'lucide-react';

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
  const steps: PipelineStep[] = [
    {
      id: 'step-1',
      name: 'Website Content Extraction',
      agentName: 'Website Extractor Agent',
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'running' : 'pending',
      details: scrapedTitle ? `Title: "${scrapedTitle}" (${scrapedHeadings?.length || 0} headings extracted)` : 'Scraping HTML, meta tags, headings, and paragraphs server-side...',
    },
    {
      id: 'step-2',
      name: 'Strategic Product Analysis',
      agentName: 'Product Analyst Agent',
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'running' : 'pending',
      details: 'Synthesizing target users, core problem, features, and business model into structured JSON...',
    },
    {
      id: 'step-3',
      name: 'Architecture & File Structure Planning',
      agentName: 'Planning Agent',
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'running' : 'pending',
      details: productName ? `Blueprint planned for "${productName}" (Routes, feature priorities, UI tokens)` : 'Planning page routes, component hierarchy, and design tokens...',
    },
    {
      id: 'step-4',
      name: 'React Starter UI Code Generation',
      agentName: 'Coding Agent',
      status: currentStep > 4 ? 'completed' : currentStep === 4 ? 'running' : 'pending',
      details: 'Synthesizing production-grade React + Tailwind CSS UI component code...',
    },
    {
      id: 'step-5',
      name: 'Terminal File System Export',
      agentName: 'Terminal CLI Writer',
      status: currentStep > 5 ? 'completed' : currentStep === 5 ? 'running' : 'pending',
      details: 'Prompting target disk directory and writing generated project files...',
    },
    {
      id: 'step-6',
      name: 'Self-Healing Server Verification',
      agentName: 'Verification Agent',
      status: currentStep >= 6 ? 'completed' : 'pending',
      details: 'Running automated HTTP server health check and auto-fixing compile errors...',
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-5">
        <div>
          <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] px-3 py-1 rounded-full font-mono font-semibold">
            LIVE PIPELINE EXECUTION
          </span>
          <h2 className="text-2xl font-black text-white mt-2">Agent Pipeline Stepper</h2>
          <p className="text-xs text-slate-400 mt-0.5">Sequential multi-agent execution from web scraping to terminal export & verification.</p>
        </div>

        {currentStep >= 5 && onContinueToStudio && (
          <button
            onClick={onContinueToStudio}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center space-x-2 transition-all"
          >
            <span>Open Product Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stepper Cards List */}
      <div className="space-y-3.5">
        {steps.map((st, idx) => (
          <div
            key={st.id}
            className={`p-4 rounded-2xl border transition-all flex items-start space-x-3.5 ${
              st.status === 'completed'
                ? 'bg-slate-950/80 border-emerald-500/30'
                : st.status === 'running'
                ? 'bg-slate-950 border-indigo-500/60 shadow-lg shadow-indigo-500/10 animate-pulse'
                : 'bg-slate-950/40 border-slate-800/60 opacity-60'
            }`}
          >
            <div className="pt-0.5 shrink-0">
              {st.status === 'completed' ? (
                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : st.status === 'running' ? (
                <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin"></div>
                </div>
              ) : (
                <div className="w-7 h-7 rounded-xl bg-slate-850 text-slate-500 border border-slate-800 flex items-center justify-center font-mono text-xs">
                  {idx + 1}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  {st.name}
                  <span className="text-[10px] bg-slate-850 text-indigo-300 px-2 py-0.5 rounded-md font-mono border border-slate-800">
                    {st.agentName}
                  </span>
                </h4>
                <span
                  className={`text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-md ${
                    st.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : st.status === 'running'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {st.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{st.details}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
