'use client';

import { CheckCircle2, Terminal, Globe, Brain, Compass, Code2, ShieldCheck, ArrowRight, Play, Sparkles, Cpu } from 'lucide-react';

export interface PipelineStep {
  id: string;
  name: string;
  agentName: string;
  icon: any;
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
      icon: Globe,
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'running' : 'pending',
      details: scrapedTitle ? `Page Title: "${scrapedTitle}" (${scrapedHeadings?.length || 0} headings extracted)` : 'Scraping HTML, meta tags, headings, and paragraphs server-side...',
    },
    {
      id: 'step-2',
      name: 'Strategic Product Analysis',
      agentName: 'Product Analyst Agent',
      icon: Brain,
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'running' : 'pending',
      details: 'Synthesizing target users, core problem, features, and business model into structured JSON schema...',
    },
    {
      id: 'step-3',
      name: 'Architecture & File Structure Planning',
      agentName: 'Planning Agent',
      icon: Compass,
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'running' : 'pending',
      details: productName ? `Blueprint planned for "${productName}" (Routes, feature priorities, UI tokens)` : 'Planning page routes, component hierarchy, and design tokens...',
    },
    {
      id: 'step-4',
      name: 'React Starter UI Code Generation',
      agentName: 'Coding Agent',
      icon: Code2,
      status: currentStep > 4 ? 'completed' : currentStep === 4 ? 'running' : 'pending',
      details: 'Synthesizing production-grade React + Tailwind CSS UI component code and interactive states...',
    },
    {
      id: 'step-5',
      name: 'Terminal File System Export',
      agentName: 'Terminal CLI Writer',
      icon: Terminal,
      status: currentStep > 5 ? 'completed' : currentStep === 5 ? 'running' : 'pending',
      details: 'Prompting target disk directory and writing generated project files...',
    },
    {
      id: 'step-6',
      name: 'Self-Healing Server Verification',
      agentName: 'Verification Agent',
      icon: ShieldCheck,
      status: currentStep >= 6 ? 'completed' : 'pending',
      details: 'Running automated HTTP server health check and auto-fixing compile errors...',
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-slate-950 border border-indigo-500/20 px-3 py-0.5 rounded-md text-[10px] font-mono font-semibold text-indigo-300">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>LIVE PIPELINE TELEMETRY</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1.5 tracking-tight">Agent Execution Stepper</h2>
          <p className="text-xs text-slate-400 mt-0.5">Sequential multi-agent execution from web scraping to terminal export & verification.</p>
        </div>

        {currentStep >= 5 && onContinueToStudio && (
          <button
            onClick={onContinueToStudio}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 flex items-center space-x-2 transition-all active:scale-95 shrink-0"
          >
            <span>Open Product Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Stepper Cards List */}
      <div className="space-y-2.5 relative">
        {steps.map((st, idx) => {
          const Icon = st.icon;
          const isCompleted = st.status === 'completed';
          const isRunning = st.status === 'running';

          return (
            <div
              key={st.id}
              className={`p-3.5 rounded-xl border transition-all flex items-start space-x-3.5 ${
                isCompleted
                  ? 'bg-slate-950/80 border-emerald-500/30 shadow-sm'
                  : isRunning
                  ? 'bg-slate-950 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20'
                  : 'bg-slate-950/40 border-white/[0.04] opacity-60'
              }`}
            >
              <div className="pt-0.5 shrink-0">
                {isCompleted ? (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                ) : isRunning ? (
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin"></div>
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-slate-500 border border-white/[0.06] flex items-center justify-center font-mono text-xs font-bold">
                    {idx + 1}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${isCompleted ? 'text-emerald-400' : isRunning ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span>{st.name}</span>
                    <span className="text-[9px] bg-slate-900 text-indigo-300 px-2 py-0.5 rounded-md font-mono border border-white/[0.06]">
                      {st.agentName}
                    </span>
                  </h4>
                  <span
                    className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md ${
                      isCompleted
                        ? 'bg-slate-900 text-emerald-400 border border-emerald-500/20'
                        : isRunning
                        ? 'bg-slate-900 text-indigo-300 border border-indigo-500/30 animate-pulse'
                        : 'bg-slate-900 text-slate-500 border border-white/[0.06]'
                    }`}
                  >
                    {st.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{st.details}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
