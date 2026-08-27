'use client';

import { useState, useEffect, useRef } from 'react';
import { ProductBlueprint, ChatMessage } from '@/types';
import { getAuthToken } from '@/lib/auth';
import { Send, Bot, User, Sparkles, Lightbulb, CheckCircle2, Layers, Gem, LayoutDashboard, Building2, RefreshCw, Trash2 } from 'lucide-react';

interface BlueprintChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  applied?: boolean;
}

interface BlueprintChatProps {
  projectId: string;
  blueprint: ProductBlueprint;
  initialMessages: ChatMessage[];
  onBlueprintUpdated: (updated: ProductBlueprint) => void;
  onRefresh: () => void;
}

const PRESETS = [
  { label: 'Make the design more premium', prompt: 'Make the design more premium.', icon: Gem },
  { label: 'Add a dashboard', prompt: 'Add a dashboard page.', icon: LayoutDashboard },
  { label: 'Remove the pricing page', prompt: 'Remove the pricing page.', icon: Layers },
  { label: 'Make it enterprise-ready', prompt: 'Make it suitable for enterprise customers.', icon: Building2 },
];

export default function BlueprintChat({
  projectId,
  blueprint,
  initialMessages,
  onBlueprintUpdated,
  onRefresh,
}: BlueprintChatProps) {
  const [messages, setMessages] = useState<BlueprintChatMessage[]>(() =>
    initialMessages.map((m) => ({ id: m.id, role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))
  );
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [refreshedIds, setRefreshedIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;

    const userMsg: BlueprintChatMessage = { id: crypto.randomUUID(), role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const token = getAuthToken();
      const res = await fetch('/api/blueprint/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId, message: userMsg.content }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to modify the product blueprint.');
      }

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: data.assistantMessage, applied: data.applied },
      ]);

      if (data.applied && data.blueprint) {
        onBlueprintUpdated(data.blueprint);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: err?.message || 'Something went wrong modifying the blueprint. Please try again.',
          applied: false,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleClear = async () => {
    if (isClearing || messages.length === 0) return;
    if (!confirm('Clear this blueprint conversation? This only removes the chat history — the current blueprint itself is not affected.')) {
      return;
    }
    setIsClearing(true);
    try {
      const token = getAuthToken();
      await fetch('/api/blueprint/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId }),
      });
      setMessages([]);
      setRefreshedIds(new Set());
    } catch {
      // Non-fatal — the user can just retry.
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl flex flex-col h-full shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Header */}
      <div className="bg-slate-950/90 border-b border-white/[0.08] px-3.5 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-tight">Product Blueprint Assistant</h3>
            <p className="text-[10px] text-slate-400">Modify the proposed product in plain English</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            disabled={isClearing}
            title="Clear this conversation"
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Quick Action Chips */}
      <div className="px-3 py-2 bg-slate-950/60 border-b border-white/[0.06] overflow-x-auto flex space-x-1.5 scrollbar-none">
        {PRESETS.map((preset, idx) => {
          const Icon = preset.icon;
          return (
            <button
              key={idx}
              onClick={() => sendMessage(preset.prompt)}
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
              <p className="text-xs font-bold text-slate-200">Modify the proposed product</p>
              <p className="text-[10px] text-slate-400 max-w-[240px] mx-auto mt-0.5 leading-relaxed">
                Change the name, features, navigation, pages, or design direction — e.g. &quot;add a dashboard&quot; or
                &quot;make it enterprise-ready&quot;. Ask a question first and I&apos;ll only apply changes once you confirm.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 border border-white/[0.08]'
                }`}
              >
                {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
              </div>
              <div className="max-w-[85%] space-y-1">
                <div
                  className={`p-3 rounded-xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-950/90 border border-white/[0.07] text-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'assistant' &&
                  (msg.applied ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Applied to blueprint
                      </span>
                      <button
                        onClick={() => {
                          onRefresh();
                          setRefreshedIds((prev) => new Set(prev).add(msg.id));
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-md transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        {refreshedIds.has(msg.id) ? 'Refreshed' : 'Click refresh to re-sync'}
                      </button>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-amber-400">
                      <Lightbulb className="w-3 h-3" /> Recommendation — reply to confirm
                    </span>
                  ))}
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
            placeholder="Ask or instruct — e.g. 'make the design more premium'"
            className="flex-1 bg-transparent px-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={() => sendMessage(input)}
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
