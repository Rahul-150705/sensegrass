'use client';

import { ProductBlueprint } from '@/types';
import { Layers, CheckSquare, Compass, Paintbrush, Play, Sparkles, Target } from 'lucide-react';

interface BlueprintViewProps {
  blueprint: ProductBlueprint;
  onGenerateUI: () => void;
  isGeneratingUI?: boolean;
}

export default function BlueprintView({ blueprint, onGenerateUI, isGeneratingUI }: BlueprintViewProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] px-3 py-1 rounded-full font-mono font-semibold">
            STEP 2 — PRODUCT BLUEPRINT
          </span>
          <h2 className="text-2xl font-black text-white mt-2 flex items-center gap-2">
            {blueprint.productName}
          </h2>
          <p className="text-xs text-indigo-300 font-medium italic mt-0.5">{blueprint.tagline}</p>
        </div>

        <button
          onClick={onGenerateUI}
          disabled={isGeneratingUI}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
        >
          {isGeneratingUI ? (
            <>
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
              <span>Generating UI...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Generate Product UI</span>
            </>
          )}
        </button>
      </div>

      {/* Description */}
      <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl space-y-2">
        <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block">
          Product Vision & Purpose
        </span>
        <p className="text-xs text-slate-200 leading-relaxed">{blueprint.description}</p>
        <div className="mt-3 flex items-center space-x-2 text-xs pt-1 border-t border-slate-800/60">
          <Target className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400">Target Audience:</span>
          <span className="bg-slate-800 text-indigo-300 px-2.5 py-0.5 rounded-lg font-medium">
            {blueprint.targetCustomer}
          </span>
        </div>
      </div>

      {/* Core Features */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-slate-200 text-xs font-bold uppercase tracking-wider">
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          <span>Core Feature Matrix</span>
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          {blueprint.features.map((feat, idx) => (
            <div
              key={idx}
              className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl flex items-start justify-between gap-3 hover:border-slate-700 transition-colors"
            >
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  {feat.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">{feat.description}</p>
              </div>
              <span
                className={`text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded shrink-0 ${
                  feat.priority === 'high'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                }`}
              >
                {feat.priority}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pages & Routes Map */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-slate-200 text-xs font-bold uppercase tracking-wider">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span>Architecture & Route Map</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {blueprint.pages.map((pg, idx) => (
            <div key={idx} className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="font-mono text-indigo-400 text-[11px] font-semibold">{pg.path}</span>
                <span className="text-slate-300 font-medium text-xs">{pg.title}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{pg.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* UI Direction & Tokens */}
      <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl space-y-3">
        <div className="flex items-center space-x-2 text-slate-200 text-xs font-bold uppercase tracking-wider">
          <Paintbrush className="w-4 h-4 text-violet-400" />
          <span>UI Direction & Styling</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-400 text-[11px]">Visual Theme:</span>
            <p className="text-slate-200 font-medium">{blueprint.uiDirection.style}</p>
          </div>
          <div>
            <span className="text-slate-400 text-[11px]">Color Scheme:</span>
            <p className="text-slate-200 font-medium">{blueprint.uiDirection.colorScheme}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {blueprint.uiDirection.designKeywords.map((kw, idx) => (
            <span key={idx} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
              #{kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
