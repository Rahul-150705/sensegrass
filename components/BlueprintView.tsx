'use client';

import { ProductBlueprint } from '@/types';
import { Layers, CheckSquare, Compass, Paintbrush, Play, Sparkles, Target, Zap, Code2 } from 'lucide-react';

interface BlueprintViewProps {
  blueprint: ProductBlueprint;
  // Optional legacy action. When omitted, the view is display-only (the
  // Product Blueprint step, where edits happen through BlueprintChat and the
  // build is kicked off from the File Directory panel below).
  onGenerateUI?: () => void;
  isGeneratingUI?: boolean;
}

export default function BlueprintView({ blueprint, onGenerateUI, isGeneratingUI }: BlueprintViewProps) {
  return (
    <div className="bg-ink-soft border border-line rounded-none p-5   space-y-4 relative overflow-hidden">
      {/* Header Info */}
      <div className="flex flex-col gap-2.5 border-b border-line pb-4">
        <div>
          <span className="bg-ink text-molten border border-molten/30 text-[10px] px-2.5 py-0.5 rounded-md font-mono font-bold tracking-wider uppercase">
            Proposed Product — Blueprint
          </span>
          <h2 className="text-lg font-extrabold text-bone mt-2 tracking-tight leading-tight">
            {blueprint.productName}
          </h2>
          <p className="text-xs text-molten font-semibold italic mt-0.5">&quot;{blueprint.tagline}&quot;</p>
        </div>

        {onGenerateUI && (
          <button
            onClick={onGenerateUI}
            disabled={isGeneratingUI}
            className="w-full bg-molten hover:opacity-90 text-ink font-bold text-xs py-3 rounded-none  flex items-center justify-center space-x-2 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {isGeneratingUI ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-ink/40 border-t-ink animate-spin"></div>
                <span>Synthesizing UI Code...</span>
              </>
            ) : (
              <>
                <Code2 className="w-3.5 h-3.5" />
                <span>Generate Live Product UI</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Description */}
      <div className="bg-ink border border-line p-3.5 rounded-none space-y-1.5">
        <span className="text-[10px] font-mono font-bold text-steel uppercase tracking-wider block">
          Product Vision
        </span>
        <p className="text-xs text-bone leading-relaxed font-sans">{blueprint.description}</p>
        <div className="mt-2 flex items-center flex-wrap gap-2 text-xs pt-1.5 border-t border-line">
          <Target className="w-3.5 h-3.5 text-molten shrink-0" />
          <span className="text-steel text-[11px]">Market:</span>
          <span className="bg-ink-soft text-molten border border-molten/20 px-2 py-0.5 rounded-md font-semibold text-[10px]">
            {blueprint.targetCustomer}
          </span>
        </div>
      </div>

      {/* Core Features */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-bone text-xs font-bold uppercase tracking-wider font-mono">
          <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
          <span>Feature Matrix</span>
        </div>
        <div className="space-y-1.5">
          {blueprint.features.map((feat, idx) => (
            <div
              key={idx}
              className="bg-ink/70 border border-line p-3 rounded-none flex items-start justify-between gap-2 hover:border-molten/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-bone flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${feat.priority === 'high' ? 'bg-rose-400' : 'bg-molten'}`}></span>
                  <span className="truncate">{feat.name}</span>
                </h4>
                <p className="text-[11px] text-steel mt-0.5 leading-relaxed">{feat.description}</p>
              </div>
              <span
                className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md shrink-0 ${
                  feat.priority === 'high'
                    ? 'bg-ink-soft text-rose-400 border border-rose-500/20'
                    : 'bg-ink-soft text-molten border border-molten/20'
                }`}
              >
                {feat.priority}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      {blueprint.navigation?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-bone text-xs font-bold uppercase tracking-wider font-mono">
            <Compass className="w-3.5 h-3.5 text-molten" />
            <span>Navigation</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {blueprint.navigation.map((item, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-ink/70 text-bone border border-line px-2.5 py-1 rounded-md font-mono"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pages & Routes Map */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-bone text-xs font-bold uppercase tracking-wider font-mono">
          <Compass className="w-3.5 h-3.5 text-molten" />
          <span>Pages</span>
        </div>
        <div className="grid grid-cols-1 gap-1 text-xs">
          {blueprint.pages.map((pg, idx) => (
            <div key={idx} className="bg-ink/70 border border-line p-2.5 rounded-none flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-molten text-[10px] font-bold shrink-0">{pg.path}</span>
                <span className="text-steel text-[10px] truncate">— {pg.description}</span>
              </div>
              <span className="text-bone font-semibold text-[10px] shrink-0">{pg.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* UI Direction & Tokens */}
      <div className="bg-ink border border-line p-3.5 rounded-none space-y-2">
        <div className="flex items-center space-x-2 text-bone text-xs font-bold uppercase tracking-wider font-mono">
          <Paintbrush className="w-3.5 h-3.5 text-molten" />
          <span>Design Tokens</span>
        </div>
        <div className="grid grid-cols-1 gap-1 text-xs">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-steel w-16 shrink-0 font-mono">Theme:</span>
            <span className="text-bone font-medium">{blueprint.uiDirection.style}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-steel w-16 shrink-0 font-mono">Colors:</span>
            <span className="text-bone font-medium">{blueprint.uiDirection.colorScheme}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          {blueprint.uiDirection.designKeywords.map((kw, idx) => (
            <span key={idx} className="text-[9px] bg-ink-soft text-bone/80 border border-line px-2 py-0.5 rounded-md font-mono">
              #{kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
