'use client';

export interface BuildCategoryStatus {
  type: string;
  label: string;
  fileCount: number;
  status: 'pending' | 'loading' | 'done' | 'error' | 'rate-limited';
  retryInSeconds?: number;
}

interface BuildProgressProps {
  categories: BuildCategoryStatus[];
}

function tag(c: BuildCategoryStatus) {
  switch (c.status) {
    case 'done': return { t: '● written', color: 'var(--steel)' };
    case 'loading': return { t: '● writing…', color: 'var(--molten)' };
    case 'rate-limited': return { t: `● retry ${c.retryInSeconds ?? 60}s`, color: 'var(--molten)' };
    case 'error': return { t: '● failed', color: 'var(--molten)' };
    default: return { t: '○ queued', color: 'var(--steel)' };
  }
}

export default function BuildProgress({ categories }: BuildProgressProps) {
  const done = categories.filter((c) => c.status === 'done').length;

  return (
    <div className="panel recast-in">
      <div className="rule-b border-line p-4 sm:p-5">
        <span className="section-num">04 — WRITING CODE</span>
        <h2 className="font-display text-lg font-semibold text-bone mt-1.5">
          {done}/{categories.length} categories
        </h2>
        <p className="text-[12px] text-steel mt-0.5">Real code, one category at a time. A failed category is not saved.</p>
      </div>

      <div className="p-4 sm:p-5 divide-y divide-line">
        {categories.map((c) => {
          const g = tag(c);
          return (
            <div key={c.type} className={`py-3 flex items-baseline gap-4 ${c.status === 'pending' ? 'opacity-40' : ''}`}>
              <span className="font-mono text-[11px] text-bone w-28 shrink-0">{c.label.toLowerCase()}</span>
              <span className="font-mono text-[11px] text-steel">{c.fileCount} file{c.fileCount !== 1 ? 's' : ''}</span>
              <span className="mono-label !text-[9px] ml-auto" style={{ color: g.color }}>{g.t}</span>
            </div>
          );
        })}
      </div>

      {/* active indicator while any category is writing */}
      {categories.some((c) => c.status === 'loading') && (
        <div className="rule-t border-line h-[2px] bg-molten/50 animate-pulse" />
      )}
    </div>
  );
}
