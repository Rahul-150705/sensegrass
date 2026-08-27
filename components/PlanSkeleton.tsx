'use client';

function Bar({ w = 'w-full', h = 'h-3' }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} bg-ink-2 animate-pulse`} />;
}

// Shown while /api/file-directory/generate runs — a skeleton that matches the
// eventual blueprint + file-tree + assistant layout.
export default function PlanSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 items-start recast-in">
      <div className="space-y-6 min-w-0">
        <div className="panel p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 bg-molten" />
            <span className="mono-label !text-molten">planning the product…</span>
            <span className="caret h-3 ml-1" />
          </div>
          <div className="mt-4 space-y-2.5">
            <Bar w="w-1/3" h="h-4" />
            <Bar w="w-2/3" />
            <Bar w="w-1/2" />
          </div>
          <div className="mt-4 rule-t border-line h-[2px] bg-molten/50 animate-pulse" />
        </div>

        {/* blueprint panel */}
        <div className="panel p-4 sm:p-5 space-y-4">
          <Bar w="w-44" h="h-5" />
          <Bar w="w-60" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5 pt-3 rule-t border-line">
              <Bar w="w-24" h="h-2.5" />
              <Bar w={i % 2 ? 'w-5/6' : 'w-3/4'} />
              <Bar w="w-2/3" />
            </div>
          ))}
        </div>

        {/* file tree panel */}
        <div className="panel p-4 sm:p-5 space-y-3">
          <Bar w="w-36" h="h-4" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3">
              <Bar w="w-52" h="h-2.5" />
              <Bar w="flex-1" h="h-2.5" />
            </div>
          ))}
        </div>
      </div>

      {/* assistant panel */}
      <div className="panel p-4 h-[420px] flex flex-col gap-3">
        <Bar w="w-40" h="h-4" />
        <div className="flex-1 space-y-3 pt-2">
          <Bar w="w-5/6" />
          <Bar w="w-3/4" />
          <Bar w="w-4/6" />
        </div>
        <Bar h="h-9" />
      </div>
    </div>
  );
}
