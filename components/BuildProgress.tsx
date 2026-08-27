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
    <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Cpu className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Building Your Product</h3>
            <p className="text-xs text-slate-400">Generating real code, one category at a time — {doneCount}/{categories.length} complete</p>
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
              className={`p-4 rounded-xl border flex items-center space-x-3 transition-all ${
                isDone
                  ? 'bg-slate-950/80 border-emerald-500/30'
                  : isLoading
                  ? 'bg-slate-950 border-indigo-500/50 ring-1 ring-indigo-500/20'
                  : isRateLimited
                  ? 'bg-slate-950 border-amber-500/40 ring-1 ring-amber-500/20'
                  : isError
                  ? 'bg-slate-950/80 border-rose-500/30'
                  : 'bg-slate-950/40 border-white/[0.05] opacity-60'
              }`}
            >
              <div className="shrink-0">
                {isDone ? (
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : isLoading ? (
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin"></div>
                  </div>
                ) : isRateLimited ? (
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 animate-pulse" />
                  </div>
                ) : isError ? (
                  <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-slate-900 text-slate-500 border border-white/[0.06] flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-white truncate">{cat.label}</h4>
                  <span
                    className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md shrink-0 ${
                      isDone
                        ? 'bg-slate-900 text-emerald-400 border border-emerald-500/20'
                        : isLoading
                        ? 'bg-slate-900 text-indigo-300 border border-indigo-500/30 animate-pulse'
                        : isRateLimited
                        ? 'bg-slate-900 text-amber-400 border border-amber-500/30'
                        : isError
                        ? 'bg-slate-900 text-rose-400 border border-rose-500/20'
                        : 'bg-slate-900 text-slate-500 border border-white/[0.06]'
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
                <p className="text-[11px] text-slate-400 mt-0.5">
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
