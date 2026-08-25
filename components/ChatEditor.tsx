'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@/types';
import { Send, Bot, User, Sparkles, Shield, BarChart3, Moon, Zap } from 'lucide-react';

interface ChatEditorProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isSending?: boolean;
}

export default function ChatEditor({ messages, onSendMessage, isSending }: ChatEditorProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const presets = [
    { label: 'Enterprise SSO + RBAC', prompt: 'Make it suitable for enterprise customers with SSO and RBAC access control.', icon: Shield },
    { label: 'Revenue telemetry', prompt: 'Add a premium revenue telemetry chart with MRR/ARR metrics to the dashboard.', icon: BarChart3 },
    { label: 'Ultra dark mode', prompt: 'Switch UI style to ultra-modern dark mode with high contrast slate accents.', icon: Moon },
    { label: 'Add SaaS pricing table', prompt: 'Add a SaaS pricing table with Starter, Growth, and Enterprise tiers.', icon: Zap },
  ];

  return (
    <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl flex flex-col h-full shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Header */}
      <div className="bg-slate-950/90 border-b border-white/[0.08] px-3.5 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-tight">AI Product Copilot</h3>
            <p className="text-[10px] text-slate-400">Modify blueprint & live UI in real-time</p>
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-500 bg-slate-950 border border-white/[0.06] px-2 py-0.5 rounded-md">
          {messages.length} msg{messages.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Quick Action Chips */}
      <div className="px-3 py-2 bg-slate-950/60 border-b border-white/[0.06] overflow-x-auto flex space-x-1.5 scrollbar-none">
        {presets.map((preset, idx) => {
          const Icon = preset.icon;
          return (
            <button
              key={idx}
              onClick={() => onSendMessage(preset.prompt)}
              disabled={isSending}
              className="text-[10px] bg-slate-900 hover:bg-indigo-600/20 text-slate-300 hover:text-white border border-white/[0.08] hover:border-indigo-500/40 px-2.5 py-1 rounded-md flex items-center space-x-1 shrink-0 transition-all disabled:opacity-40 font-medium"
            >
              <Icon className="w-3 h-3 text-indigo-400" />
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 min-h-[200px]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">AI Copilot Ready</p>
              <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto mt-0.5 leading-relaxed">
                Ask me to refine the blueprint or update the live UI code.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 border border-white/[0.08]'
                }`}
              >
                {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
              </div>
              <div
                className={`p-3 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-950/90 border border-white/[0.07] text-slate-200 rounded-bl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}

        {isSending && (
          <div className="flex items-end gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-800 border border-white/[0.08] flex items-center justify-center shrink-0">
              <Bot className="w-3 h-3 text-slate-300" />
            </div>
            <div className="px-3.5 py-2.5 bg-slate-950/90 border border-white/[0.07] rounded-xl rounded-bl-none">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-2.5 bg-slate-950/90 border-t border-white/[0.07]">
        <div className="flex items-center space-x-1.5 bg-slate-900 border border-white/[0.08] rounded-xl p-1 focus-within:border-indigo-500/50 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            placeholder="Describe UI changes..."
            className="flex-1 bg-transparent px-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white p-2 rounded-lg transition-all"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
