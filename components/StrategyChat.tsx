'use client';

import { useState, useEffect, useRef } from 'react';
import { ProductAnalysis, ChatMessage } from '@/types';
import { getAuthToken } from '@/lib/auth';
import { Send, Bot, User, Sparkles, Lightbulb, CheckCircle2, Building2, HelpCircle, RefreshCw, Trash2 } from 'lucide-react';

interface StrategyChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  applied?: boolean;
}

interface StrategyChatProps {
  projectId: string;
  analysis: ProductAnalysis;
  initialMessages: ChatMessage[];
  onAnalysisUpdated: (updated: ProductAnalysis) => void;
  onRefresh: () => void;
}

const PRESETS = [
  { label: 'Make it enterprise-focused', prompt: 'Make this suitable for enterprise customers.', icon: Building2 },
  { label: 'Add a core feature', prompt: 'Add an important feature this product is missing.', icon: Sparkles },
  { label: 'Should I add a free tier?', prompt: 'Should I include a free tier in the business model? What do you recommend?', icon: HelpCircle },
];

export default function StrategyChat({ projectId, analysis, initialMessages, onAnalysisUpdated, onRefresh }: StrategyChatProps) {
  // Seeded once from the persisted history at mount — this project's chat
  // survives navigation/reload because it's loaded from the DB (chat_messages,
  // stage='strategy'), not kept only in this component's local state.
  const [messages, setMessages] = useState<StrategyChatMessage[]>(() =>
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

    const userMsg: StrategyChatMessage = { id: crypto.randomUUID(), role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const token = getAuthToken();
      const res = await fetch('/api/strategy/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId, message: userMsg.content }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to refine strategy.');
      }

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: data.assistantMessage, applied: data.applied },
      ]);

      if (data.applied && data.analysis) {
        onAnalysisUpdated(data.analysis);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: err?.message || 'Something went wrong refining the strategy. Please try again.',
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
    if (!confirm('Clear this strategy conversation? This only removes the chat history — the current strategy itself is not affected.')) {
      return;
    }
    setIsClearing(true);
    try {
      const token = getAuthToken();
      await fetch('/api/strategy/clear', {
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
    <div className="bg-ink-soft border border-line rounded-none flex flex-col h-full  overflow-hidden ">
      {/* Header */}
      <div className="bg-ink border-b border-line px-3.5 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-none bg-molten/10 border border-molten/30 flex items-center justify-center text-molten">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-bone tracking-tight">Strategy Assistant</h3>
            <p className="text-[10px] text-steel">Refine the analysis before it becomes a blueprint</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            disabled={isClearing}
            title="Clear this conversation"
            className="p-1.5 text-steel hover:text-rose-400 hover:bg-rose-500/10 rounded-none transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Quick Action Chips */}
      <div className="px-3 py-2 bg-ink border-b border-line overflow-x-auto flex space-x-1.5 scrollbar-none">
        {PRESETS.map((preset, idx) => {
          const Icon = preset.icon;
          return (
            <button
              key={idx}
              onClick={() => sendMessage(preset.prompt)}
              disabled={isSending}
              className="text-[10px] bg-ink-soft hover:bg-molten/10 text-bone/80 hover:text-bone border border-line hover:border-molten/40 px-2.5 py-1 rounded-md flex items-center space-x-1 shrink-0 transition-all disabled:opacity-40 font-medium"
            >
              <Icon className="w-3 h-3 text-molten" />
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 min-h-[200px]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center space-y-2.5">
            <div className="w-9 h-9 rounded-none bg-ink border border-line flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-molten" />
            </div>
            <div>
              <p className="text-xs font-bold text-bone">Refine the strategy</p>
              <p className="text-[10px] text-steel max-w-[220px] mx-auto mt-0.5 leading-relaxed">
                Tell me what to change, or ask a question first — I'll only update the strategy once you confirm.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-6 h-6 rounded-none flex items-center justify-center text-[10px] shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-molten text-ink '
                    : 'bg-ink-2 text-bone/80 border border-line'
                }`}
              >
                {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
              </div>
              <div className="max-w-[85%] space-y-1">
                <div
                  className={`p-3 rounded-none text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-molten text-ink rounded-br-none'
                      : 'bg-ink border border-line text-bone rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'assistant' &&
                  (msg.applied ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Applied to strategy
                      </span>
                      <button
                        onClick={() => {
                          onRefresh();
                          setRefreshedIds((prev) => new Set(prev).add(msg.id));
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-molten hover:text-molten bg-molten/10 hover:bg-indigo-500/20 border border-molten/30 px-2 py-0.5 rounded-md transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        {refreshedIds.has(msg.id) ? 'Refreshed' : 'Click refresh to see updated strategy'}
                      </button>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-molten">
                      <Lightbulb className="w-3 h-3" /> Recommendation — reply to confirm
                    </span>
                  ))}
              </div>
            </div>
          ))
        )}

        {isSending && (
          <div className="flex items-end gap-2">
            <div className="w-6 h-6 rounded-none bg-ink-2 border border-line flex items-center justify-center shrink-0">
              <Bot className="w-3 h-3 text-bone/80" />
            </div>
            <div className="px-3.5 py-2.5 bg-ink border border-line rounded-none rounded-bl-none">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-molten animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-molten animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-molten animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-2.5 bg-ink border-t border-line">
        <div className="flex items-center space-x-1.5 bg-ink-soft border border-line rounded-none p-1 focus-within:border-molten/50 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            placeholder="Ask or instruct — e.g. 'add a soil monitoring feature'"
            className="flex-1 bg-transparent px-2.5 text-xs text-bone placeholder-steel focus:outline-none"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isSending}
            className="bg-molten hover:opacity-90 disabled:bg-ink-2 disabled:text-steel/60 text-bone p-2 rounded-none transition-all"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
