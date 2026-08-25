'use client';

import { useState } from 'react';
import { Monitor, Tablet, Smartphone, Code, Eye, RefreshCw, Check, Copy, Sparkles } from 'lucide-react';

interface LivePreviewProps {
  code: string | null | undefined;
  productName: string;
  isGenerating?: boolean;
  onRegenerate?: () => void;
}

export default function LivePreview({
  code,
  productName,
  isGenerating,
  onRegenerate,
}: LivePreviewProps) {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile':
        return 'max-w-[390px]';
      case 'tablet':
        return 'max-w-[768px]';
      default:
        return 'w-full';
    }
  };

  const handleCopyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderableHtml = code
    ? code.replace(/className=/g, 'class=').replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    : '';

  return (
    <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full backdrop-blur-xl">
      {/* Browser Toolbar Chrome */}
      <div className="bg-slate-950/95 border-b border-white/[0.08] px-3.5 py-2.5 flex items-center gap-3">
        {/* Traffic Light Dots */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70"></div>
        </div>

        {/* URL Bar */}
        <div className="flex-1 bg-slate-900 border border-white/[0.08] rounded-md px-3 py-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
          <span className="text-[11px] font-mono text-slate-400 truncate">
            <span className="text-slate-500">preview://</span>
            <span className="text-slate-200 font-semibold">{productName || 'Generated Product'}</span>
          </span>
        </div>

        {/* Controls: Tab Switcher + Viewport + Refresh */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-900 border border-white/[0.07] p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-all text-xs ${
                activeTab === 'preview' ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-all text-xs ${
                activeTab === 'code' ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>
          </div>

          {/* Viewport controls */}
          {activeTab === 'preview' && (
            <div className="hidden sm:flex items-center bg-slate-900 border border-white/[0.07] p-0.5 rounded-lg text-slate-400">
              <button
                onClick={() => setViewport('desktop')}
                title="Desktop View"
                className={`p-1 rounded-md hover:text-slate-200 transition-all ${
                  viewport === 'desktop' ? 'bg-slate-800 text-cyan-400' : ''
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewport('tablet')}
                title="Tablet View"
                className={`p-1 rounded-md hover:text-slate-200 transition-all ${
                  viewport === 'tablet' ? 'bg-slate-800 text-cyan-400' : ''
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewport('mobile')}
                title="Mobile View"
                className={`p-1 rounded-md hover:text-slate-200 transition-all ${
                  viewport === 'mobile' ? 'bg-slate-800 text-cyan-400' : ''
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all border border-white/[0.07]"
              title="Regenerate UI"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Main Sandbox */}
      <div className="flex-1 bg-slate-950/80 overflow-y-auto p-4 flex justify-center items-start min-h-[440px]">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white">Synthesizing React UI...</h3>
              <p className="text-[11px] text-slate-400 max-w-xs">Composing Tailwind design tokens, component hierarchy, and metrics.</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">Tailwind CSS</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">React</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">Lucide Icons</span>
            </div>
          </div>
        ) : activeTab === 'code' ? (
          <div className="w-full relative">
            <button
              onClick={handleCopyCode}
              className="absolute top-3 right-3 bg-slate-900 hover:bg-slate-800 text-slate-200 text-[11px] px-3 py-1.5 rounded-lg border border-white/10 flex items-center space-x-1.5 transition-colors z-10 shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
            <pre className="bg-slate-950 border border-white/[0.07] p-4 pt-12 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed min-h-[200px]">
              <code>{code || '// Click "Generate Live Product UI" to synthesize React starter code.'}</code>
            </pre>
          </div>
        ) : code ? (
          <div
            className={`transition-all duration-300 ${getViewportWidth()} bg-white rounded-xl overflow-hidden border border-white/10 shadow-2xl`}
          >
            <div
              dangerouslySetInnerHTML={{ __html: renderableHtml }}
              className="w-full"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/[0.08] flex items-center justify-center text-slate-500 shadow-inner">
              <Monitor className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-200">No Live UI Generated Yet</h4>
              <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                Click <span className="text-indigo-400 font-semibold">&quot;Generate Live Product UI&quot;</span> to build the interactive React component preview.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
