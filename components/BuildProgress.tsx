'use client';

export interface BuildCategoryStatus {
  type: string;
  label: string;
  fileCount: number;
  status: 'pending' | 'loading' | 'done' | 'error' | 'rate-limited';
  retryInSeconds?: number;
  done?: number;
  total?: number;
}

interface BuildProgressProps {
  categories: BuildCategoryStatus[];
  building?: boolean;
  retrying?: boolean;
  onRetry?: () => void;
  onRetryCategory?: (type: string) => void;
  onContinue?: () => void;
}

function tag(c: BuildCategoryStatus) {
  const total = c.total ?? c.fileCount;
  const done = c.done ?? 0;
  switch (c.status) {
    case 'done': return { t: `● ${total}/${total}`, color: 'var(--steel)' };
    case 'loading': return { t: `● ${done}/${total} files`, color: 'var(--molten)' };
    case 'rate-limited': return { t: `● ${done}/${total} · retry ${c.retryInSeconds ?? 60}s`, color: 'var(--molten)' };
    case 'error': return { t: `● failed at ${done}/${total}`, color: 'var(--molten)' };
    default: return { t: '○ queued', color: 'var(--steel)' };
  }
}

export default function BuildProgress({
  categories,
  building,
  retrying,
  onRetry,
  onRetryCategory,
  onContinue,
}: BuildProgressProps) {
  const done = categories.filter((c) => c.status === 'done').length;
  const failed = categories.filter((c) => c.status === 'error').length;
  const active = categories.some((c) => c.status === 'loading' || c.status === 'rate-limited');
  const showControls = !building && !active && failed > 0;

  return (
    <div className="panel recast-in">
      <div className="rule-b border-line p-4 sm:p-5">
        <span className="section-num">04 — WRITING CODE</span>
        <h2 className="font-display text-lg font-semibold text-bone mt-1.5">
          {done}/{categories.length} categories
          {failed > 0 && <span className="text-molten"> · {failed} failed</span>}
        </h2>
        <p className="text-[12px] text-steel mt-0.5">Real code, one category at a time. A failed category is not saved.</p>
      </div>

      <div className="p-4 sm:p-5 divide-y divide-line">
        {categories.map((c) => {
          const g = tag(c);
          const canRetryRow = c.status === 'error' && !building && !!onRetryCategory;
          return (
            <div key={c.type} className={`py-3 flex items-baseline gap-4 ${c.status === 'pending' ? 'opacity-40' : ''}`}>
              <span className="font-mono text-[11px] text-bone w-28 shrink-0">{c.label.toLowerCase()}</span>
              <span className="font-mono text-[11px] text-steel">{c.fileCount} file{c.fileCount !== 1 ? 's' : ''}</span>
              <span className="mono-label !text-[9px] ml-auto" style={{ color: g.color }}>
                {retrying && c.status === 'error' ? '● retrying…' : g.t}
              </span>
              {canRetryRow && (
                <button
                  onClick={() => onRetryCategory!(c.type)}
                  disabled={retrying}
                  className="mono-label !text-[9px] border border-line hover:border-molten/50 hover:text-molten px-2 py-0.5 transition-colors disabled:opacity-40 shrink-0"
                >
                  ↻ retry
                </button>
              )}
            </div>
          );
        })}
      </div>

      {active && (
        <div className="rule-t border-line h-[2px] bg-molten/50 animate-pulse" />
      )}

      {showControls && (
        <div className="rule-t border-line p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-[12px] text-steel flex-1">
            {failed} categor{failed === 1 ? 'y' : 'ies'} didn&apos;t generate. The rest is saved — retry just the failed ones.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {onContinue && done > 0 && (
              <button
                onClick={onContinue}
                className="mono-label border border-line hover:border-molten/40 hover:text-bone px-3 py-2 transition-colors"
              >
                open studio anyway
              </button>
            )}
            {onRetry && (
              <button
                onClick={onRetry}
                disabled={retrying}
                className="bg-molten text-ink px-4 py-2 font-mono font-bold text-[10px] uppercase tracking-[0.14em] disabled:opacity-40 transition-opacity"
              >
                {retrying ? 'Retrying…' : `Retry failed (${failed})`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
