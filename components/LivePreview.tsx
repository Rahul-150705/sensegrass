'use client';

import { useState } from 'react';
import { Monitor, Tablet, Smartphone, Code, Eye, RefreshCw, Check, Copy } from 'lucide-react';

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
        return 'max-w-[375px]';
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
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full">
      {/* Top Controls Bar */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          </div>
          <span className="text-xs font-mono text-slate-400 border-l border-slate-800 pl-3 ml-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE UI: <span className="text-slate-200 font-semibold">{productName || 'Generated Product'}</span>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Tab Switcher: Preview vs Code */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl text-xs">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'preview' ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'code' ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>React Code</span>
            </button>
          </div>

          {/* Viewport Controls */}
          {activeTab === 'preview' && (
            <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl text-slate-400">
              <button
                onClick={() => setViewport('desktop')}
                title="Desktop View"
                className={`p-1.5 rounded-lg hover:text-slate-200 transition-all ${
                  viewport === 'desktop' ? 'bg-slate-800 text-indigo-400 font-semibold' : ''
                }`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewport('tablet')}
                title="Tablet View"
                className={`p-1.5 rounded-lg hover:text-slate-200 transition-all ${
                  viewport === 'tablet' ? 'bg-slate-800 text-indigo-400 font-semibold' : ''
                }`}
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewport('mobile')}
                title="Mobile View"
                className={`p-1.5 rounded-lg hover:text-slate-200 transition-all ${
                  viewport === 'mobile' ? 'bg-slate-800 text-indigo-400 font-semibold' : ''
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          )}

          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="p-2 text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1"
              title="Regenerate UI"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Main Preview Sandbox Container */}
      <div className="flex-1 bg-slate-950/60 overflow-y-auto p-4 flex justify-center items-start min-h-[440px]">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Code className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Generating Working React UI...</h3>
              <p className="text-xs text-slate-400 mt-1">Synthesizing design tokens, layout grids, and interactive metrics</p>
            </div>
          </div>
        ) : activeTab === 'code' ? (
          <div className="w-full relative">
            <button
              onClick={handleCopyCode}
              className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-700 flex items-center space-x-1.5 transition-colors z-10"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
            <pre className="bg-slate-900 border border-slate-800 p-4 rounded-2xl font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
              <code>{code || '// Click "Generate Product UI" to synthesize React starter code.'}</code>
            </pre>
          </div>
        ) : code ? (
          <div
            className={`transition-all duration-300 ${getViewportWidth()} bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl`}
          >
            <div
              dangerouslySetInnerHTML={{ __html: renderableHtml }}
              className="w-full"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-850 border border-slate-800 flex items-center justify-center text-slate-500">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-300">No Live UI Generated Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Click <span className="text-indigo-400 font-semibold">"Generate Product UI"</span> to build the interactive React component preview!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
