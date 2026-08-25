'use client';

import React, { useState, useEffect } from 'react';
import { ProjectFile, ChatMessage } from '@/types';
import {
  FileCode,
  Folder,
  FolderOpen,
  Eye,
  Code,
  Send,
  Bot,
  User,
  Sparkles,
  Play,
  Copy,
  Check,
  Server,
  Layers,
  Terminal,
  FileText,
  ChevronRight,
  Maximize2,
  RefreshCw,
} from 'lucide-react';

interface VSCodeEditorProps {
  files: ProjectFile[];
  productName: string;
  chatHistory: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isSending?: boolean;
  onCodeChange?: (updatedFiles: ProjectFile[]) => void;
}

export default function VSCodeEditor({
  files,
  productName,
  chatHistory,
  onSendMessage,
  isSending,
  onCodeChange,
}: VSCodeEditorProps) {
  const [selectedFilePath, setSelectedFilePath] = useState<string>(files[0]?.path || 'app/page.tsx');
  const [activeView, setActiveView] = useState<'editor' | 'preview' | 'split'>('split');
  const [sidebarTab, setSidebarTab] = useState<'explorer' | 'ai'>('explorer');
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Currently open file
  const activeFile = files.find((f) => f.path === selectedFilePath) || files[0] || {
    path: 'app/page.tsx',
    name: 'page.tsx',
    type: 'frontend',
    language: 'typescript',
    content: '// No file selected',
  };

  // Group files by type
  const frontendFiles = files.filter((f) => f.type === 'frontend');
  const backendFiles = files.filter((f) => f.type === 'backend');
  const configFiles = files.filter((f) => f.type === 'config');

  const handleCopy = () => {
    if (!activeFile.content) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || isSending) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  // Main page preview HTML string
  const mainPageFile = files.find((f) => f.path === 'app/page.tsx') || activeFile;
  const renderableHtml = mainPageFile.content
    ? mainPageFile.content.replace(/className=/g, 'class=').replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    : '';

  const lines = (activeFile.content || '').split('\n');

  return (
    <div className="bg-slate-950 border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[700px] text-slate-200 font-sans">
      {/* VS Code Title Bar */}
      <div className="bg-slate-900/90 border-b border-white/[0.08] px-4 py-2 flex items-center justify-between text-xs">
        {/* macOS Traffic Lights & Title */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          </div>
          <span className="font-mono text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-indigo-400" />
            <span>VS Code Workspace — {productName}</span>
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-950 border border-white/[0.08] p-0.5 rounded-lg flex text-[11px]">
            <button
              onClick={() => setActiveView('editor')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                activeView === 'editor' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Editor Only</span>
            </button>
            <button
              onClick={() => setActiveView('split')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                activeView === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
            <button
              onClick={() => setActiveView('preview')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                activeView === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main IDE Workspace Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Switcher + File Explorer & AI Assistant */}
        <div className="w-72 bg-slate-900 border-r border-white/[0.08] flex flex-col shrink-0">
          {/* Sidebar Tabs Header */}
          <div className="flex border-b border-white/[0.08] text-xs bg-slate-950/60">
            <button
              onClick={() => setSidebarTab('explorer')}
              className={`flex-1 py-2.5 text-center font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                sidebarTab === 'explorer'
                  ? 'border-indigo-500 text-white bg-slate-900/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-indigo-400" />
              <span>Files ({files.length})</span>
            </button>
            <button
              onClick={() => setSidebarTab('ai')}
              className={`flex-1 py-2.5 text-center font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                sidebarTab === 'ai'
                  ? 'border-indigo-500 text-white bg-slate-900/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Copilot</span>
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {sidebarTab === 'explorer' ? (
              <div className="space-y-3 font-mono text-xs">
                {/* Frontend Folder */}
                {frontendFiles.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Frontend Components</span>
                    </div>
                    <div className="pl-2 space-y-0.5">
                      {frontendFiles.map((f) => (
                        <button
                          key={f.path}
                          onClick={() => setSelectedFilePath(f.path)}
                          className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center space-x-2 transition-colors ${
                            selectedFilePath === f.path
                              ? 'bg-indigo-600/30 text-white font-semibold border border-indigo-500/40'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                          }`}
                        >
                          <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">{f.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Backend Folder */}
                {backendFiles.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-white/[0.06]">
                    <div className="flex items-center space-x-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <Server className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Backend API & Services</span>
                    </div>
                    <div className="pl-2 space-y-0.5">
                      {backendFiles.map((f) => (
                        <button
                          key={f.path}
                          onClick={() => setSelectedFilePath(f.path)}
                          className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center space-x-2 transition-colors ${
                            selectedFilePath === f.path
                              ? 'bg-indigo-600/30 text-white font-semibold border border-indigo-500/40'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                          }`}
                        >
                          <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{f.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Config Folder */}
                {configFiles.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-white/[0.06]">
                    <div className="flex items-center space-x-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <FileText className="w-3.5 h-3.5 text-purple-400" />
                      <span>Configs & Schemas</span>
                    </div>
                    <div className="pl-2 space-y-0.5">
                      {configFiles.map((f) => (
                        <button
                          key={f.path}
                          onClick={() => setSelectedFilePath(f.path)}
                          className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center space-x-2 transition-colors ${
                            selectedFilePath === f.path
                              ? 'bg-indigo-600/30 text-white font-semibold border border-indigo-500/40'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                          }`}
                        >
                          <FileCode className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="truncate">{f.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* AI Copilot Sidebar Thread */
              <div className="h-full flex flex-col justify-between space-y-3">
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {chatHistory.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <Sparkles className="w-6 h-6 text-indigo-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-200">AI Assistant Ready</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Ask me to edit code, add new features, or patch backend endpoints!
                      </p>
                    </div>
                  ) : (
                    chatHistory.map((m) => (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-xl text-xs space-y-1 ${
                          m.role === 'user' ? 'bg-indigo-600/30 border border-indigo-500/30 text-white ml-2' : 'bg-slate-950 border border-white/10 text-slate-300 mr-2'
                        }`}
                      >
                        <span className="text-[10px] font-mono text-indigo-300 font-bold block">
                          {m.role === 'user' ? 'You' : 'Claude Code Assistant'}
                        </span>
                        <p className="leading-relaxed">{m.content}</p>
                      </div>
                    ))
                  )}
                  {isSending && (
                    <div className="p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-indigo-400 font-mono animate-pulse">
                      Updating codebase with Claude Agent...
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-white/[0.08]">
                  <div className="flex items-center bg-slate-950 border border-white/10 rounded-xl p-1">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                      placeholder="Ask to edit code..."
                      className="flex-1 bg-transparent px-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={isSending || !chatInput.trim()}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white p-1.5 rounded-lg"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center / Right Split Content (Code Editor + Live Preview) */}
        <div className="flex-1 flex overflow-hidden bg-slate-950">
          {/* Code Editor Pane (Shown in 'editor' or 'split' view) */}
          {(activeView === 'editor' || activeView === 'split') && (
            <div className="flex-1 flex flex-col border-r border-white/[0.08] min-w-0">
              {/* File Breadcrumb / Tab Bar */}
              <div className="bg-slate-900/60 border-b border-white/[0.08] px-4 py-2 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 font-mono text-slate-300">
                  <span className="text-slate-500">{activeFile.type}/</span>
                  <span className="font-bold text-indigo-300">{activeFile.path}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              {/* Line-by-Line Code Viewer */}
              <div className="flex-1 overflow-auto bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200 selection:bg-indigo-600">
                <table className="w-full border-collapse">
                  <tbody>
                    {lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                        <td className="w-10 select-none text-slate-600 text-right pr-4 text-[11px] font-mono border-r border-white/[0.06]">
                          {idx + 1}
                        </td>
                        <td className="pl-4 whitespace-pre font-mono text-slate-300">
                          {line}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Live Preview Sandbox Pane (Shown in 'preview' or 'split' view) */}
          {(activeView === 'preview' || activeView === 'split') && (
            <div className="flex-1 flex flex-col bg-slate-900/40 min-w-0">
              <div className="bg-slate-900/60 border-b border-white/[0.08] px-4 py-2 flex items-center justify-between text-xs">
                <span className="font-mono text-slate-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real-Time Live Application Preview</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                  ● Live Render
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex items-start justify-center bg-slate-950/80">
                <div className="w-full bg-white rounded-xl overflow-hidden border border-white/10 shadow-2xl min-h-[400px]">
                  <div
                    dangerouslySetInnerHTML={{ __html: renderableHtml }}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
