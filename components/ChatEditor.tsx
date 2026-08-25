'use client';

import { useState } from 'react';
import { ChatMessage } from '@/types';
import { Send, Bot, User, Sparkles, Shield, BarChart3, Moon } from 'lucide-react';

interface ChatEditorProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isSending?: boolean;
}

export default function ChatEditor({ messages, onSendMessage, isSending }: ChatEditorProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || isSending) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const presets = [
    { label: 'Make it premium enterprise', prompt: 'Make it suitable for enterprise customers with SSO and RBAC.', icon: Shield },
    { label: 'Add revenue chart', prompt: 'Make the dashboard more premium and add a revenue telemetry chart.', icon: BarChart3 },
    { label: 'Switch to dark mode', prompt: 'Switch UI style to ultra-modern dark mode with high contrast metrics.', icon: Moon },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl flex flex-col h-full shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-slate-950/90 border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              Live Product Editor
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </h3>
            <p className="text-[11px] text-slate-400">Modify blueprint & live UI code</p>
          </div>
        </div>
      </div>

      {/* Quick Action Chips */}
      <div className="p-3 bg-slate-950/40 border-b border-slate-800/60 overflow-x-auto flex space-x-2 scrollbar-none">
        {presets.map((preset, idx) => {
          const Icon = preset.icon;
          return (
            <button
              key={idx}
              onClick={() => onSendMessage(preset.prompt)}
              disabled={isSending}
              className="text-[11px] bg-slate-850 hover:bg-indigo-600/30 text-slate-300 hover:text-white border border-slate-700/60 hover:border-indigo-500/40 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shrink-0 transition-all disabled:opacity-50"
            >
              <Icon className="w-3 h-3 text-indigo-400" />
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-[300px] max-h-[500px]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
            <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
            <p className="text-xs font-bold text-slate-200">Customize Product Live</p>
            <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
              Type instructions like <span className="text-indigo-300 font-semibold">"Make it suitable for enterprise customers"</span> or click a quick action above.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-2.5 ${
                msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-slate-800 text-slate-200 border border-slate-700'
                    : 'bg-indigo-600 text-white shadow-md'
                }`}
              >
                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div
                className={`p-3.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-inner'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}

        {isSending && (
          <div className="flex items-center space-x-2 text-xs text-indigo-400 pt-2 animate-pulse">
            <Sparkles className="w-4 h-4" />
            <span>Updating blueprint & live UI preview...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 focus-within:border-indigo-500 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            placeholder="Type instructions to modify UI..."
            className="flex-1 bg-transparent px-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white p-2.5 rounded-xl transition-colors shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
