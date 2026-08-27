'use client';

import React, { useState } from 'react';
import { ProjectFile, ChatMessage } from '@/types';
import {
  FileCode,
  Folder,
  FolderOpen,
  Send,
  Sparkles,
  Copy,
  Check,
  Server,
  Terminal,
  FileText,
  ChevronRight,
  Maximize2,
  Minimize2,
  Database,
} from 'lucide-react';

interface VSCodeEditorProps {
  files: ProjectFile[];
  productName: string;
  chatHistory: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isSending?: boolean;
  onCodeChange?: (updatedFiles: ProjectFile[]) => void;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onExport?: () => void;
}

export default function VSCodeEditor({
  files,
  productName,
  chatHistory,
  onSendMessage,
  isSending,
  onCodeChange,
  fullscreen,
  onToggleFullscreen,
  onExport,
}: VSCodeEditorProps) {
  const [selectedFilePath, setSelectedFilePath] = useState<string>(files[0]?.path || 'app/page.tsx');
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
  const databaseFiles = files.filter((f) => f.type === 'database');
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

  const lines = (activeFile.content || '').split('\n');

  return (
    <div
      className={`bg-ink border border-line  flex flex-col text-bone font-sans ${
        fullscreen ? 'h-full rounded-none' : 'h-[700px] rounded-none overflow-hidden'
      }`}
    >
      {/* VS Code Title Bar */}
      <div className="bg-ink-soft border-b border-line px-4 py-2 flex items-center justify-between text-xs">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 bg-molten" />
          <span className="mono-label !text-[10px] !text-bone flex items-center gap-1.5">
            CAST — {productName}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onExport && (
            <button
              onClick={onExport}
              className="bg-molten text-ink px-3 py-1.5 font-mono font-bold text-[10px] uppercase tracking-[0.12em] flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Export &amp; run</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              title={fullscreen ? 'Exit full screen' : 'View full screen'}
              className="bg-ink border border-line p-1.5 rounded-none text-steel hover:text-bone hover:border-molten/40 transition-colors"
            >
              {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Main IDE Workspace Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Switcher + File Explorer & AI Assistant */}
        <div className="w-72 bg-ink-soft border-r border-line flex flex-col shrink-0">
          {/* Sidebar Tabs Header */}
          <div className="flex border-b border-line text-xs bg-ink">
            <button
              onClick={() => setSidebarTab('explorer')}
              className={`flex-1 py-2.5 text-center font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                sidebarTab === 'explorer'
                  ? 'border-indigo-500 text-bone bg-ink-soft'
                  : 'border-transparent text-steel hover:text-bone'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-molten" />
              <span>Files ({files.length})</span>
            </button>
            <button
              onClick={() => setSidebarTab('ai')}
              className={`flex-1 py-2.5 text-center font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                sidebarTab === 'ai'
                  ? 'border-indigo-500 text-bone bg-ink-soft'
                  : 'border-transparent text-steel hover:text-bone'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-molten" />
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
                    <div className="flex items-center space-x-1.5 text-steel font-bold uppercase tracking-wider text-[10px]">
                      <FolderOpen className="w-3.5 h-3.5 text-molten" />
                      <span>Frontend Components</span>
                    </div>
                    <div className="pl-2 space-y-0.5">
                      {frontendFiles.map((f) => (
                        <button
                          key={f.path}
                          onClick={() => setSelectedFilePath(f.path)}
                          className={`w-full text-left px-2 py-1.5 rounded-none flex items-center space-x-2 transition-colors ${
                            selectedFilePath === f.path
                              ? 'bg-molten/15 text-bone font-semibold border border-molten/40'
                              : 'text-steel hover:text-bone hover:bg-ink-2'
                          }`}
                        >
                          <FileCode className="w-3.5 h-3.5 text-molten shrink-0" />
                          <span className="truncate">{f.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Backend Folder */}
                {backendFiles.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-line">
                    <div className="flex items-center space-x-1.5 text-steel font-bold uppercase tracking-wider text-[10px]">
                      <Server className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Backend API & Services</span>
                    </div>
                    <div className="pl-2 space-y-0.5">
                      {backendFiles.map((f) => (
                        <button
                          key={f.path}
                          onClick={() => setSelectedFilePath(f.path)}
                          className={`w-full text-left px-2 py-1.5 rounded-none flex items-center space-x-2 transition-colors ${
                            selectedFilePath === f.path
                              ? 'bg-molten/15 text-bone font-semibold border border-molten/40'
                              : 'text-steel hover:text-bone hover:bg-ink-2'
                          }`}
                        >
                          <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{f.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Database Folder */}
                {databaseFiles.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-line">
                    <div className="flex items-center space-x-1.5 text-steel font-bold uppercase tracking-wider text-[10px]">
                      <Database className="w-3.5 h-3.5 text-molten" />
                      <span>Database & Schema</span>
                    </div>
                    <div className="pl-2 space-y-0.5">
                      {databaseFiles.map((f) => (
                        <button
                          key={f.path}
                          onClick={() => setSelectedFilePath(f.path)}
                          className={`w-full text-left px-2 py-1.5 rounded-none flex items-center space-x-2 transition-colors ${
                            selectedFilePath === f.path
                              ? 'bg-molten/15 text-bone font-semibold border border-molten/40'
                              : 'text-steel hover:text-bone hover:bg-ink-2'
                          }`}
                        >
                          <FileCode className="w-3.5 h-3.5 text-molten shrink-0" />
                          <span className="truncate">{f.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Config Folder */}
                {configFiles.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-line">
                    <div className="flex items-center space-x-1.5 text-steel font-bold uppercase tracking-wider text-[10px]">
                      <FileText className="w-3.5 h-3.5 text-molten" />
                      <span>Configs & Schemas</span>
                    </div>
                    <div className="pl-2 space-y-0.5">
                      {configFiles.map((f) => (
                        <button
                          key={f.path}
                          onClick={() => setSelectedFilePath(f.path)}
                          className={`w-full text-left px-2 py-1.5 rounded-none flex items-center space-x-2 transition-colors ${
                            selectedFilePath === f.path
                              ? 'bg-molten/15 text-bone font-semibold border border-molten/40'
                              : 'text-steel hover:text-bone hover:bg-ink-2'
                          }`}
                        >
                          <FileCode className="w-3.5 h-3.5 text-molten shrink-0" />
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
                      <Sparkles className="w-6 h-6 text-molten mx-auto" />
                      <p className="text-xs font-bold text-bone">AI Assistant Ready</p>
                      <p className="text-[11px] text-steel leading-relaxed">
                        Ask me to edit code, add new features, or patch backend endpoints!
                      </p>
                    </div>
                  ) : (
                    chatHistory.map((m) => (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-none text-xs space-y-1 ${
                          m.role === 'user' ? 'bg-molten/15 border border-molten/30 text-bone ml-2' : 'bg-ink border border-line text-bone/80 mr-2'
                        }`}
                      >
                        <span className="text-[10px] font-mono text-molten font-bold block">
                          {m.role === 'user' ? 'You' : 'Groq Code Assistant'}
                        </span>
                        <p className="leading-relaxed">{m.content}</p>
                      </div>
                    ))
                  )}
                  {isSending && (
                    <div className="p-2.5 bg-ink border border-line rounded-none text-xs text-molten font-mono animate-pulse">
                      Updating codebase with Groq Agent...
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-line">
                  <div className="flex items-center bg-ink border border-line rounded-none p-1">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                      placeholder="Ask to edit code..."
                      className="flex-1 bg-transparent px-2 text-xs text-bone placeholder-steel focus:outline-none"
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={isSending || !chatInput.trim()}
                      className="bg-molten hover:opacity-90 disabled:opacity-40 text-ink p-1.5 rounded-none"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex overflow-hidden bg-ink">
            <div className="flex-1 flex flex-col min-w-0">
              {/* File Breadcrumb / Tab Bar */}
              <div className="bg-ink-soft border-b border-line px-4 py-2 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 font-mono text-bone/80">
                  <span className="text-steel">{activeFile.type}/</span>
                  <span className="font-bold text-molten">{activeFile.path}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="bg-ink-soft hover:bg-ink-2 text-bone/80 border border-line text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              {/* Line-by-Line Code Viewer */}
              <div className="flex-1 overflow-auto bg-ink p-4 font-mono text-xs leading-relaxed text-bone selection:bg-molten">
                <table className="w-full border-collapse">
                  <tbody>
                    {lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-ink-soft/50 transition-colors">
                        <td className="w-10 select-none text-steel/60 text-right pr-4 text-[11px] font-mono border-r border-line">
                          {idx + 1}
                        </td>
                        <td className="pl-4 whitespace-pre font-mono text-bone/80">
                          {line}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
