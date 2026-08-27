'use client';

import { ProductBlueprint } from '@/types';

interface BlueprintViewProps {
  blueprint: ProductBlueprint;
  onGenerateUI?: () => void;
  isGeneratingUI?: boolean;
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-4 rule-b border-line last:border-b-0">
      <div className="mono-label mb-2">{label}</div>
      {children}
    </div>
  );
}

export default function BlueprintView({ blueprint, onGenerateUI, isGeneratingUI }: BlueprintViewProps) {
  return (
    <div className="panel recast-in">
      <div className="rule-b border-line p-4 sm:p-5">
        <span className="section-num">03 — BLUEPRINT</span>
        <h2 className="font-display text-xl font-semibold text-bone mt-1.5">{blueprint.productName}</h2>
        <p className="text-[13px] text-molten mt-0.5">{blueprint.tagline}</p>
        {onGenerateUI && (
          <button
            onClick={onGenerateUI}
            disabled={isGeneratingUI}
            className="mt-3 bg-molten text-ink px-4 py-2 font-mono font-bold text-[10px] uppercase tracking-[0.14em] disabled:opacity-40 transition-opacity"
          >
            {isGeneratingUI ? 'Synthesizing…' : 'Generate UI'}
          </button>
        )}
      </div>

      <div className="p-4 sm:p-5">
        <Block label="Vision">
          <p className="text-[13px] text-bone/90 leading-relaxed">{blueprint.description}</p>
          <div className="mt-2 flex gap-3 text-[13px]">
            <span className="mono-label !text-[9px] w-20 shrink-0 pt-0.5">market</span>
            <span className="text-bone/90">{blueprint.targetCustomer}</span>
          </div>
        </Block>

        <Block label="Feature matrix">
          <div className="divide-y divide-line">
            {blueprint.features.map((f, i) => (
              <div key={i} className="py-2 flex items-baseline gap-3">
                <span
                  className="font-mono text-[9px] uppercase w-14 shrink-0"
                  style={{ color: f.priority === 'high' ? 'var(--molten)' : 'var(--steel)' }}
                >
                  {f.priority}
                </span>
                <div>
                  <div className="text-[13px] text-bone">{f.name}</div>
                  <div className="text-[12px] text-steel leading-snug">{f.description}</div>
                </div>
              </div>
            ))}
          </div>
        </Block>

        {blueprint.navigation?.length > 0 && (
          <Block label="Navigation">
            <div className="font-mono text-[12px] text-bone/90">{blueprint.navigation.join('  ·  ')}</div>
          </Block>
        )}

        <Block label="Pages">
          <div className="divide-y divide-line">
            {blueprint.pages.map((p, i) => (
              <div key={i} className="py-2 flex items-baseline gap-3">
                <span className="font-mono text-[11px] text-molten w-40 shrink-0 truncate">{p.path}</span>
                <span className="text-[13px] text-bone/90">{p.title}</span>
                <span className="text-[12px] text-steel ml-auto hidden sm:block truncate max-w-[40%]">{p.description}</span>
              </div>
            ))}
          </div>
        </Block>

        <Block label="Design direction">
          <div className="space-y-1 text-[13px]">
            <div className="flex gap-3"><span className="mono-label !text-[9px] w-20 shrink-0 pt-0.5">style</span><span className="text-bone/90">{blueprint.uiDirection.style}</span></div>
            <div className="flex gap-3"><span className="mono-label !text-[9px] w-20 shrink-0 pt-0.5">colors</span><span className="text-bone/90">{blueprint.uiDirection.colorScheme}</span></div>
            <div className="flex gap-3"><span className="mono-label !text-[9px] w-20 shrink-0 pt-0.5">type</span><span className="text-bone/90">{blueprint.uiDirection.typography}</span></div>
          </div>
          <div className="mt-2 font-mono text-[11px] text-steel">{blueprint.uiDirection.designKeywords.map((k) => `#${k}`).join('  ')}</div>
        </Block>
      </div>
    </div>
  );
}
