'use client';

import { ProductFileDirectory } from '@/types';
import { ArrowRight } from 'lucide-react';

interface FileDirectoryViewProps {
  fileDirectory: ProductFileDirectory;
  onBuildProduct: () => void;
  isBuilding?: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  frontend: 'frontend',
  backend: 'backend / api',
  database: 'database',
  config: 'config',
};

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-4 rule-b border-line last:border-b-0">
      <div className="mono-label mb-2">{label}</div>
      {children}
    </div>
  );
}

export default function FileDirectoryView({ fileDirectory, onBuildProduct, isBuilding }: FileDirectoryViewProps) {
  const groups = fileDirectory.files.reduce<Record<string, typeof fileDirectory.files>>((acc, f) => {
    (acc[f.type] = acc[f.type] || []).push(f);
    return acc;
  }, {});

  return (
    <div className="panel">
      <div className="rule-b border-line p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="section-num">04 — FILE TREE</span>
          <h2 className="font-display text-lg font-semibold text-bone mt-1.5">
            The build plan · {fileDirectory.files.length} files
          </h2>
        </div>
        <button
          onClick={onBuildProduct}
          disabled={isBuilding}
          className="group inline-flex items-center gap-2 bg-molten text-ink px-4 py-2.5 font-mono font-bold text-[10px] uppercase tracking-[0.14em] disabled:opacity-40 transition-opacity shrink-0"
        >
          {isBuilding ? 'Building…' : 'Write the code'}
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.75} />
        </button>
      </div>

      <div className="p-4 sm:p-5">
        {Object.entries(groups).map(([type, files]) => (
          <Block key={type} label={`${TYPE_LABEL[type] || type} — ${files.length}`}>
            <div className="divide-y divide-line font-mono">
              {files.map((f) => (
                <div key={f.path} className="py-2 flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
                  <span className="text-[12px] text-bone sm:w-64 shrink-0 truncate">{f.path}</span>
                  <span className="text-[11px] text-steel leading-snug">{f.purpose}</span>
                </div>
              ))}
            </div>
          </Block>
        ))}

        {fileDirectory.routes.length > 0 && (
          <Block label="Routes">
            <div className="divide-y divide-line font-mono">
              {fileDirectory.routes.map((r) => (
                <div key={r.path} className="py-2 flex items-baseline gap-3">
                  <span className="text-[9px] uppercase w-8 shrink-0" style={{ color: r.kind === 'api' ? 'var(--molten)' : 'var(--steel)' }}>{r.kind}</span>
                  <span className="text-[12px] text-bone w-40 shrink-0 truncate">{r.path}</span>
                  <span className="text-[11px] text-steel">{r.description}</span>
                </div>
              ))}
            </div>
          </Block>
        )}

        {fileDirectory.components.length > 0 && (
          <Block label="Components">
            <div className="font-mono text-[12px] text-bone/90">{fileDirectory.components.join('  ·  ')}</div>
          </Block>
        )}

        {fileDirectory.dataEntities.length > 0 && (
          <Block label="Data entities">
            <div className="divide-y divide-line">
              {fileDirectory.dataEntities.map((e) => (
                <div key={e.name} className="py-2 flex items-baseline gap-3">
                  <span className="font-mono text-[12px] text-molten w-32 shrink-0">{e.name}</span>
                  <span className="text-[12px] text-steel">{e.description}</span>
                </div>
              ))}
            </div>
          </Block>
        )}

        {fileDirectory.externalIntegrations.length > 0 && (
          <Block label="Integrations">
            <div className="font-mono text-[12px] text-bone/90">{fileDirectory.externalIntegrations.join('  ·  ')}</div>
          </Block>
        )}
      </div>
    </div>
  );
}
