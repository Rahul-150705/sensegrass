'use client';

import { ProductFileDirectory } from '@/types';
import {
  FolderTree,
  Folder,
  FileCode,
  Server,
  Database,
  Settings,
  Route as RouteIcon,
  Puzzle,
  Table2,
  Plug,
  Rocket,
  ArrowRight,
} from 'lucide-react';

interface FileDirectoryViewProps {
  fileDirectory: ProductFileDirectory;
  onBuildProduct: () => void;
  isBuilding?: boolean;
}

const TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
  frontend: { label: 'Frontend', icon: FileCode, color: 'text-cyan-400' },
  backend: { label: 'Backend / API', icon: Server, color: 'text-emerald-400' },
  database: { label: 'Database', icon: Database, color: 'text-amber-400' },
  config: { label: 'Config', icon: Settings, color: 'text-purple-400' },
};

export default function FileDirectoryView({ fileDirectory, onBuildProduct, isBuilding }: FileDirectoryViewProps) {
  // Group dynamically by whatever types are actually present — not hardcoded
  // to a fixed set, since the plan can contain anything Groq decides the
  // product needs.
  const groups = fileDirectory.files.reduce<Record<string, typeof fileDirectory.files>>((acc, f) => {
    (acc[f.type] = acc[f.type] || []).push(f);
    return acc;
  }, {});

  return (
    <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6 relative overflow-hidden">
      {/* Header & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <span className="bg-slate-950 text-cyan-400 border border-cyan-500/30 text-[10px] px-3 py-0.5 rounded-md font-mono font-bold tracking-wider uppercase">
            Phase 2 — Product File Directory
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 tracking-tight">The Build Plan</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Review the exact files Build will generate. Refine it with the assistant, then build when ready.
          </p>
        </div>

        <button
          onClick={onBuildProduct}
          disabled={isBuilding}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-indigo-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shrink-0"
        >
          {isBuilding ? (
            <>
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
              <span>Building...</span>
            </>
          ) : (
            <>
              <Rocket className="w-3.5 h-3.5" />
              <span>Build Product</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </>
          )}
        </button>
      </div>

      {/* File Tree — grouped dynamically by whatever types are present */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider font-mono">
          <FolderTree className="w-3.5 h-3.5" />
          <span>Planned File Tree ({fileDirectory.files.length} files)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(groups).map(([type, files]) => {
            const meta = TYPE_META[type] || { label: type, icon: Folder, color: 'text-slate-400' };
            const Icon = meta.icon;
            return (
              <div key={type} className="bg-slate-950/80 border border-white/[0.07] p-4 rounded-xl space-y-2">
                <div className={`flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider font-mono ${meta.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{meta.label}</span>
                  <span className="text-slate-500 font-normal normal-case">({files.length})</span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {files.map((f) => (
                    <div key={f.path} className="group" title={f.purpose}>
                      <div className="text-slate-200 truncate">{f.path}</div>
                      <div className="text-slate-500 text-[10px] truncate leading-relaxed">{f.purpose}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Routes, Components, Data Entities, Integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fileDirectory.routes.length > 0 && (
          <div className="bg-slate-950/80 border border-white/[0.07] p-4.5 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider font-mono">
              <RouteIcon className="w-3.5 h-3.5" />
              <span>Routes</span>
            </div>
            <ul className="space-y-1.5 text-xs">
              {fileDirectory.routes.map((r) => (
                <li key={r.path} className="flex items-start gap-2">
                  <span
                    className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                      r.kind === 'api' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    }`}
                  >
                    {r.kind}
                  </span>
                  <div>
                    <div className="font-mono text-slate-200">{r.path}</div>
                    <div className="text-slate-400 text-[11px]">{r.description}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {fileDirectory.components.length > 0 && (
          <div className="bg-slate-950/80 border border-white/[0.07] p-4.5 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider font-mono">
              <Puzzle className="w-3.5 h-3.5" />
              <span>Components</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {fileDirectory.components.map((c) => (
                <span key={c} className="text-[11px] bg-slate-900 border border-white/[0.06] text-slate-300 px-2 py-0.5 rounded-md font-mono">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {fileDirectory.dataEntities.length > 0 && (
          <div className="bg-slate-950/80 border border-white/[0.07] p-4.5 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-mono">
              <Table2 className="w-3.5 h-3.5" />
              <span>Data Entities</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {fileDirectory.dataEntities.map((e) => (
                <li key={e.name}>
                  <span className="font-mono font-semibold text-slate-200">{e.name}</span>
                  <span className="text-slate-400"> — {e.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {fileDirectory.externalIntegrations.length > 0 && (
          <div className="bg-slate-950/80 border border-white/[0.07] p-4.5 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider font-mono">
              <Plug className="w-3.5 h-3.5" />
              <span>External Integrations</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {fileDirectory.externalIntegrations.map((i) => (
                <span key={i} className="text-[11px] bg-slate-900 border border-white/[0.06] text-slate-300 px-2 py-0.5 rounded-md">
                  {i}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
