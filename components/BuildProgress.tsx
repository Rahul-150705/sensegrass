'use client';

import { CheckCircle2, AlertTriangle, FileCode, Server, Database, Settings, Folder, Cpu, Clock } from 'lucide-react';

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

const TYPE_ICON: Record<string, any> = {
  frontend: FileCode,
  backend: Server,
  database: Database,
  config: Settings,
};

export default function BuildProgress({ categories }: BuildProgressProps) {
  const doneCount = categories.filter((c) => c.status === 'done').length;

  return (
    <div className="bg-ink-soft border border-line rounded-none p-6 sm:p-8   space-y-5">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-none bg-molten/10 border border-molten/30 flex items-center justify-center text-molten">
            <Cpu className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-bone">Building Your Product</h3>
            <p className="text-xs text-steel">Generating real code, one category at a time — {doneCount}/{categories.length} complete</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((cat) => {
          const Icon = TYPE_ICON[cat.type] || Folder;
          const isDone = cat.status === 'done';
          const isLoading = cat.status === 'loading';
          const isError = cat.status === 'error';
          const isRateLimited = cat.status === 'rate-limited';

          return (
            <div
              key={cat.type}
              className={`p-4 rounded-none border flex items-center space-x-3 transition-all ${
                isDone
                  ? 'bg-ink border-emerald-500/30'
                  : isLoading
                  ? 'bg-ink border-molten/50 ring-1 ring-molten/20'
                  : isRateLimited
                  ? 'bg-ink border-amber-500/40 ring-1 ring-amber-500/20'
                  : isError
                  ? 'bg-ink border-rose-500/30'
                  : 'bg-ink border-line opacity-60'
              }`}
            >
              <div className="shrink-0">
                {isDone ? (
                  <div className="w-9 h-9 rounded-none bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : isLoading ? (
                  <div className="w-9 h-9 rounded-none bg-indigo-500/15 text-molten border border-molten/30 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin"></div>
                  </div>
                ) : isRateLimited ? (
                  <div className="w-9 h-9 rounded-none bg-amber-500/10 text-molten border border-amber-500/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 animate-pulse" />
                  </div>
                ) : isError ? (
                  <div className="w-9 h-9 rounded-none bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-none bg-ink-soft text-steel border border-line flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-bone truncate">{cat.label}</h4>
                  <span
                    className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md shrink-0 ${
                      isDone
                        ? 'bg-ink-soft text-emerald-400 border border-emerald-500/20'
                        : isLoading
                        ? 'bg-ink-soft text-molten border border-molten/30 animate-pulse'
                        : isRateLimited
                        ? 'bg-ink-soft text-molten border border-amber-500/30'
                        : isError
                        ? 'bg-ink-soft text-rose-400 border border-rose-500/20'
                        : 'bg-ink-soft text-steel border border-line'
                    }`}
                  >
                    {isDone
                      ? 'complete'
                      : isLoading
                      ? 'writing'
                      : isRateLimited
                      ? `retry in ${cat.retryInSeconds ?? 60}s`
                      : isError
                      ? 'failed'
                      : 'queued'}
                  </span>
                </div>
                <p className="text-[11px] text-steel mt-0.5">
                  {isRateLimited
                    ? 'Groq rate limit hit — waiting before retrying automatically.'
                    : `${cat.fileCount} file${cat.fileCount !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
