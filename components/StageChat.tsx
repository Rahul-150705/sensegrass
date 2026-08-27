'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@/types';
import { getAuthToken } from '@/lib/auth';

type Stage = 'strategy' | 'blueprint' | 'fileDirectory';

const CONFIG: Record<
  Stage,
  { title: string; sub: string; refine: string; clear: string; key: string; presets: string[]; noun: string }
> = {
  strategy: {
    title: 'Strategy',
    sub: 'Argue the analysis before it becomes a blueprint',
    refine: '/api/strategy/refine',
    clear: '/api/strategy/clear',
    key: 'analysis',
    noun: 'strategy',
    presets: ['Make this enterprise-focused', 'Add a core feature it is missing', 'Should I add a free tier?'],
  },
  blueprint: {
    title: 'Blueprint',
    sub: 'Change the proposed product in plain English',
    refine: '/api/blueprint/refine',
    clear: '/api/blueprint/clear',
    key: 'blueprint',
    noun: 'blueprint',
    presets: ['Make the design more premium', 'Add a dashboard', 'Remove the pricing page', 'Make it enterprise-ready'],
  },
  fileDirectory: {
    title: 'File tree',
    sub: 'Add, remove, or rename planned files and routes',
    refine: '/api/file-directory/refine',
    clear: '/api/file-directory/clear',
    key: 'fileDirectory',
    noun: 'file tree',
    presets: ['Add a database layer', 'Add a webhooks endpoint', 'What am I missing?'],
  },
};

interface StageChatProps {
  stage: Stage;
  projectId: string;
  initialMessages: ChatMessage[];
  onApplied: (updated: any) => void;
  onRefresh: () => void;
}

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  applied?: boolean;
  fresh?: boolean;
}

// Reveals text over ~1s regardless of length. Respects reduced-motion.
function Typewriter({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setN(text.length);
      return;
    }
    setN(0);
    const step = Math.max(1, Math.ceil(text.length / 60));
    const iv = setInterval(() => {
      setN((p) => {
        if (p >= text.length) {
          clearInterval(iv);
          return text.length;
        }
        return p + step;
      });
    }, 16);
    return () => clearInterval(iv);
  }, [text]);
  return (
    <>
      {text.slice(0, n)}
      {n < text.length && <span className="caret h-3.5 align-middle" />}
    </>
  );
}

export default function StageChat({ stage, projectId, initialMessages, onApplied, onRefresh }: StageChatProps) {
  const cfg = CONFIG[stage];
  const [messages, setMessages] = useState<Msg[]>(() =>
    initialMessages.map((m) => ({ id: m.id, role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))
  );
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [synced, setSynced] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    setMessages((p) => [...p, { id: crypto.randomUUID(), role: 'user', content: text.trim() }]);
    setInput('');
    setSending(true);
    try {
      const token = getAuthToken();
      const res = await fetch(cfg.refine, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ projectId, message: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `Failed to refine the ${cfg.noun}.`);
      setMessages((p) => [
        ...p,
        { id: crypto.randomUUID(), role: 'assistant', content: data.assistantMessage, applied: data.applied, fresh: true },
      ]);
      if (data.applied && data[cfg.key]) onApplied(data[cfg.key]);
    } catch (err: any) {
      setMessages((p) => [
        ...p,
        { id: crypto.randomUUID(), role: 'assistant', content: err?.message || 'Something went wrong. Try rephrasing.', applied: false, fresh: true },
      ]);
    } finally {
      setSending(false);
    }
  };

  const clear = async () => {
    if (clearing || messages.length === 0) return;
    if (!confirm(`Clear this ${cfg.noun} conversation? The ${cfg.noun} itself is not affected.`)) return;
    setClearing(true);
    try {
      const token = getAuthToken();
      await fetch(cfg.clear, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ projectId }),
      });
      setMessages([]);
      setSynced(new Set());
    } catch {
      /* retryable */
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="panel flex flex-col h-full">
      {/* header */}
      <div className="rule-b border-line px-4 py-3 flex items-start justify-between">
        <div>
          <div className="mono-label !text-bone flex items-center gap-1.5">
            <span className="w-1 h-1 bg-molten" /> {cfg.title} assistant
          </div>
          <p className="text-[11px] text-steel mt-1">{cfg.sub}</p>
        </div>
        {messages.length > 0 && (
          <button onClick={clear} disabled={clearing} className="mono-label hover:text-molten transition-colors disabled:opacity-40">
            clear
          </button>
        )}
      </div>

      {/* presets */}
      <div className="rule-b border-line flex flex-wrap">
        {cfg.presets.map((p, i) => (
          <button
            key={p}
            onClick={() => send(p)}
            disabled={sending}
            className={`text-[11px] font-mono text-steel hover:text-molten hover:bg-white/[0.03] px-3 py-2 text-left transition-colors disabled:opacity-40 ${
              i > 0 ? 'border-l border-line' : ''
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* thread — margin-note style, no bubbles */}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-[220px]">
        {messages.length === 0 ? (
          <p className="text-[12px] text-steel leading-relaxed max-w-[36ch]">
            Tell me what to change, or ask a question first — I only apply an edit once you confirm it.
          </p>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id} className="recast-in border-l-2 pl-3" style={{ borderColor: m.role === 'user' ? 'var(--line)' : 'var(--molten)' }}>
                <div className="mono-label !text-[9px] mb-1" style={m.role === 'assistant' ? { color: 'var(--molten)' } : undefined}>
                  {m.role === 'user' ? 'You' : 'Recast'}
                </div>
                <p className="text-[13px] text-bone/90 leading-relaxed whitespace-pre-wrap">
                  {m.role === 'assistant' && m.fresh ? <Typewriter text={m.content} /> : m.content}
                </p>
                {m.role === 'assistant' && m.applied === true && (
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="mono-label !text-[9px] !text-molten">● applied</span>
                    <button
                      onClick={() => {
                        onRefresh();
                        setSynced((p) => new Set(p).add(m.id));
                      }}
                      className="mono-label !text-[9px] hover:text-bone transition-colors"
                    >
                      {synced.has(m.id) ? 'synced' : 're-sync →'}
                    </button>
                  </div>
                )}
                {m.role === 'assistant' && m.applied === false && (
                  <span className="mt-1.5 block mono-label !text-[9px]">○ suggestion — reply to confirm</span>
                )}
              </div>
            ))}
            {sending && <p className="mono-label recast-in">recast is thinking…</p>}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* input — command line */}
      <div className="rule-t border-line px-4 py-3 flex items-center gap-2">
        <span className="mono-label !text-[9px] shrink-0">›</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          disabled={sending}
          placeholder={`instruct or ask about the ${cfg.noun}…`}
          className="cast-input flex-1 py-1 text-[13px] !border-b-0"
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || sending}
          className="mono-label !text-[9px] hover:text-molten disabled:opacity-30 transition-colors shrink-0"
        >
          send ↵
        </button>
      </div>
    </div>
  );
}
