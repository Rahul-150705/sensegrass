'use client';

import { ProductBlueprint } from '@/types';
import { Layers, CheckSquare, Compass, Paintbrush, Play, Sparkles, Target, Zap, Code2 } from 'lucide-react';

interface BlueprintViewProps {
  blueprint: ProductBlueprint;
  onGenerateUI: () => void;
  isGeneratingUI?: boolean;
}

export default function BlueprintView({ blueprint, onGenerateUI, isGeneratingUI }: BlueprintViewProps) {
  return (
    <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl p-5 shadow-2xl backdrop-blur-xl space-y-4 relative overflow-hidden">
      {/* Header Info */}
      <div className="flex flex-col gap-2.5 border-b border-white/[0.08] pb-4">
        <div>
          <span className="bg-slate-950 text-indigo-400 border border-indigo-500/30 text-[10px] px-2.5 py-0.5 rounded-md font-mono font-bold tracking-wider uppercase">
            Phase 2 — Blueprint
          </span>
          <h2 className="text-lg font-extrabold text-white mt-2 tracking-tight leading-tight">
            {blueprint.productName}
          </h2>
          <p className="text-xs text-indigo-300 font-semibold italic mt-0.5">&quot;{blueprint.tagline}&quot;</p>
        </div>

        <button
          onClick={onGenerateUI}
          disabled={isGeneratingUI}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl shadow-md shadow-indigo-500/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.99] disabled:opacity-50"
        >
          {isGeneratingUI ? (
            <>
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
              <span>Synthesizing UI Code...</span>
            </>
          ) : (
            <>
              <Code2 className="w-3.5 h-3.5" />
              <span>Generate Live Product UI</span>
            </>
          )}
        </button>
      </div>

      {/* Description */}
      <div className="bg-slate-950/80 border border-white/[0.06] p-3.5 rounded-xl space-y-1.5">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
          Product Vision
        </span>
        <p className="text-xs text-slate-200 leading-relaxed font-sans">{blueprint.description}</p>
        <div className="mt-2 flex items-center flex-wrap gap-2 text-xs pt-1.5 border-t border-white/[0.05]">
          <Target className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="text-slate-400 text-[11px]">Market:</span>
          <span className="bg-slate-900 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-md font-semibold text-[10px]">
            {blueprint.targetCustomer}
          </span>
        </div>
      </div>

      {/* Core Features */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-slate-200 text-xs font-bold uppercase tracking-wider font-mono">
          <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
          <span>Feature Matrix</span>
        </div>
        <div className="space-y-1.5">
          {blueprint.features.map((feat, idx) => (
            <div
              key={idx}
              className="bg-slate-950/70 border border-white/[0.05] p-3 rounded-lg flex items-start justify-between gap-2 hover:border-white/10 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${feat.priority === 'high' ? 'bg-rose-400' : 'bg-indigo-400'}`}></span>
                  <span className="truncate">{feat.name}</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{feat.description}</p>
              </div>
              <span
                className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md shrink-0 ${
                  feat.priority === 'high'
                    ? 'bg-slate-900 text-rose-400 border border-rose-500/20'
                    : 'bg-slate-900 text-indigo-400 border border-indigo-500/20'
                }`}
              >
                {feat.priority}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pages & Routes Map */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-slate-200 text-xs font-bold uppercase tracking-wider font-mono">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>Routes</span>
        </div>
        <div className="grid grid-cols-1 gap-1 text-xs">
          {blueprint.pages.map((pg, idx) => (
            <div key={idx} className="bg-slate-950/70 border border-white/[0.05] p-2.5 rounded-lg flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-cyan-400 text-[10px] font-bold shrink-0">{pg.path}</span>
                <span className="text-slate-400 text-[10px] truncate">— {pg.description}</span>
              </div>
              <span className="text-slate-200 font-semibold text-[10px] shrink-0">{pg.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* UI Direction & Tokens */}
      <div className="bg-slate-950/80 border border-white/[0.06] p-3.5 rounded-xl space-y-2">
        <div className="flex items-center space-x-2 text-slate-200 text-xs font-bold uppercase tracking-wider font-mono">
          <Paintbrush className="w-3.5 h-3.5 text-violet-400" />
          <span>Design Tokens</span>
        </div>
        <div className="grid grid-cols-1 gap-1 text-xs">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-400 w-16 shrink-0 font-mono">Theme:</span>
            <span className="text-slate-200 font-medium">{blueprint.uiDirection.style}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-400 w-16 shrink-0 font-mono">Colors:</span>
            <span className="text-slate-200 font-medium">{blueprint.uiDirection.colorScheme}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          {blueprint.uiDirection.designKeywords.map((kw, idx) => (
            <span key={idx} className="text-[9px] bg-slate-900 text-slate-300 border border-white/10 px-2 py-0.5 rounded-md font-mono">
              #{kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
