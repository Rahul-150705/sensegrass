import React from 'react';
import { ArrowRight } from 'lucide-react';

export interface DiffRow {
  k: string;
  v: string;
}

interface SourceCastDiffProps {
  sourceLabel?: string;
  castLabel?: string;
  source: DiffRow[] | React.ReactNode;
  cast: DiffRow[] | React.ReactNode;
  className?: string;
  animated?: boolean;
  compact?: boolean;
}

function Rows({ rows, animated, compact }: { rows: DiffRow[]; animated?: boolean; compact?: boolean }) {
  return (
    <div className={compact ? 'divide-y divide-line' : 'divide-y divide-line'}>
      {rows.map((r, i) => (
        <div
          key={i}
          className={`flex items-baseline gap-3 ${compact ? 'py-1.5' : 'py-2.5'} ${
            animated ? 'recast-in' : ''
          }`}
          style={animated ? { animationDelay: `${i * 45}ms` } : undefined}
        >
          <span className="mono-label shrink-0 w-24 !text-[9px] pt-0.5">{r.k}</span>
          <span className={`text-bone ${compact ? 'text-xs' : 'text-[13px]'} leading-snug`}>{r.v}</span>
        </div>
      ))}
    </div>
  );
}

// The signature motif: SOURCE (what the site is) → CAST (what it becomes).
// Reused on the landing hero, the dashboard project strip, and each studio stage.
export default function SourceCastDiff({
  sourceLabel = 'Source',
  castLabel = 'Cast',
  source,
  cast,
  className = '',
  animated = false,
  compact = false,
}: SourceCastDiffProps) {
  return (
    <div className={`panel grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] ${className}`}>
      {/* SOURCE */}
      <div className={compact ? 'p-3' : 'p-4 sm:p-5'}>
        <div className="mono-label mb-2.5 flex items-center gap-1.5">
          <span className="w-1 h-1 bg-steel" />
          {sourceLabel}
        </div>
        {Array.isArray(source) ? <Rows rows={source} animated={animated} compact={compact} /> : source}
      </div>

      {/* bracket */}
      <div className="hidden md:flex items-center justify-center px-2 rule-l rule-r border-line">
        <ArrowRight className="w-4 h-4 text-molten" strokeWidth={2.5} />
      </div>
      <div className="md:hidden flex items-center gap-2 px-4 py-1 rule-t rule-b border-line">
        <ArrowRight className="w-3.5 h-3.5 text-molten" strokeWidth={2.5} />
        <span className="mono-label !text-[9px]">recast</span>
      </div>

      {/* CAST */}
      <div className={`${compact ? 'p-3' : 'p-4 sm:p-5'} bg-ink-2/40`}>
        <div className="mono-label mb-2.5 flex items-center gap-1.5 !text-molten">
          <span className="w-1 h-1 bg-molten" />
          {castLabel}
        </div>
        {Array.isArray(cast) ? <Rows rows={cast} animated={animated} compact={compact} /> : cast}
      </div>
    </div>
  );
}
