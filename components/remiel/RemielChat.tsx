'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRemielSettings } from '@/lib/ai/settings';
import { streamRemielChat } from '@/lib/ai/client';
import { ChatMessage, PROVIDERS, RemielChat as RemielChatDoc, RemielChatContext } from '@/lib/ai/types';
import { deleteChat, newChatId, saveChat, useRemielChats } from '@/hooks/useRemiel';
import { Markdown } from './Markdown';
import { LogoMark } from '@/components/brand/Logo';
import { RemielSettingsDialog } from './SettingsDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ArrowUp, ChevronDown, History, KeyRound, MessageSquarePlus, Settings2, Square, Trash2 } from 'lucide-react';

interface Props {
  scope: string;
  problemId?: string | null;
  /** Context is rebuilt on every send so it reflects the latest status/note. */
  getContext: () => RemielChatContext;
  heading?: string;
  subheading?: string;
  suggestions?: string[];
  className?: string;
}

function timeAgo(ts: number) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function RemielChat({ scope, problemId = null, getContext, heading = 'Remiel', subheading, suggestions = [], className }: Props) {
  const { userData } = useAuth();
  const { settings, configured } = useRemielSettings();
  const { chats } = useRemielChats(userData?.uid, scope);

  // undefined = auto-select most recent; null = fresh unsaved chat
  const [activeId, setActiveId] = useState<string | null | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = streaming !== null;

  // Reset when the scope (e.g. selected problem) changes.
  useEffect(() => {
    abortRef.current?.abort();
    setActiveId(undefined);
    setMessages([]);
    setStreaming(null);
    setError(null);
  }, [scope]);

  const resolvedId = activeId === undefined ? chats[0]?.id ?? null : activeId;
  const activeChat = useMemo(() => chats.find(c => c.id === resolvedId), [chats, resolvedId]);

  // Keep local messages in sync with Firestore when idle.
  useEffect(() => {
    if (busy) return;
    setMessages(activeChat?.messages ?? []);
  }, [activeChat, busy]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  const persist = async (id: string, all: ChatMessage[], existing?: RemielChatDoc) => {
    if (!userData) return;
    const firstUser = all.find(m => m.role === 'user')?.content ?? 'New chat';
    try {
      await saveChat({
        id,
        userId: userData.uid,
        scope,
        problemId,
        title: existing?.title || firstUser.replace(/\s+/g, ' ').slice(0, 60),
        messages: all,
        createdAt: existing?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.error('Failed to save chat', e);
    }
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    if (!configured) {
      setSettingsOpen(true);
      return;
    }
    setError(null);
    setInput('');

    const id = resolvedId ?? newChatId();
    const existing = activeChat;
    const next: ChatMessage[] = [...messages, { role: 'user', content, createdAt: Date.now() }];
    setActiveId(id);
    setMessages(next);
    setStreaming('');

    const controller = new AbortController();
    abortRef.current = controller;
    let partial = '';
    try {
      partial = await streamRemielChat(settings, next, getContext(), t => {
        partial = t;
        setStreaming(t);
      }, controller.signal);
      const all = [...next, { role: 'assistant' as const, content: partial || '_(no response)_', createdAt: Date.now() }];
      setMessages(all);
      await persist(id, all, existing);
    } catch (e) {
      const aborted = e instanceof Error && e.name === 'AbortError';
      if (aborted && partial) {
        const all = [...next, { role: 'assistant' as const, content: `${partial}\n\n_(stopped)_`, createdAt: Date.now() }];
        setMessages(all);
        await persist(id, all, existing);
      } else if (!aborted) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
        await persist(id, next, existing);
      }
    } finally {
      setStreaming(null);
      abortRef.current = null;
    }
  };

  const startNew = () => {
    abortRef.current?.abort();
    setActiveId(null);
    setMessages([]);
    setError(null);
    inputRef.current?.focus();
  };

  const removeChat = async (id: string) => {
    if (id === resolvedId) startNew();
    try {
      await deleteChat(id);
    } catch (e) {
      console.error('Failed to delete chat', e);
    }
  };

  return (
    <div className={cn('flex flex-col min-h-0 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-8 h-8 shrink-0 rounded-lg bg-[var(--mark-tile)] ring-1 ring-[var(--mark-tile-border)] flex items-center justify-center">
            <LogoMark size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight leading-none">{heading}</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-1">
              {subheading ?? (configured ? `${PROVIDERS[settings.provider].label.split(' (')[0]} · ${settings.model}` : 'Add your API key and model to start')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="h-8 px-2 rounded-lg flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
              aria-label="Chat history"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{chats.length}</span>
              <ChevronDown className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 max-h-80 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1.5">
              {chats.length === 0 ? (
                <p className="px-2 py-3 text-xs text-zinc-500">No saved chats yet.</p>
              ) : (
                chats.map(c => (
                  <DropdownMenuItem
                    key={c.id}
                    onClick={() => {
                      setActiveId(c.id);
                      setError(null);
                    }}
                    className={cn('group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer', c.id === resolvedId && 'bg-zinc-100 dark:bg-zinc-900')}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{c.title}</p>
                      <p className="text-[11px] text-zinc-500">{c.messages.length} msgs · {timeAgo(c.updatedAt)}</p>
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={e => {
                        e.stopPropagation();
                        removeChat(c.id);
                      }}
                      className="p-1 rounded text-zinc-400 hover:text-rose-500 opacity-60 group-hover:opacity-100"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <button onClick={startNew} className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer" aria-label="New chat" title="New chat">
            <MessageSquarePlus className="w-4 h-4" />
          </button>
          <button onClick={() => setSettingsOpen(true)} className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer" aria-label="Remiel settings" title="Settings">
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !busy ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-8">
            <div className="w-12 h-12 rounded-2xl bg-[var(--mark-tile)] ring-1 ring-[var(--mark-tile-border)] flex items-center justify-center">
              <LogoMark size={24} animated />
            </div>
            <div className="space-y-1 max-w-xs">
              <p className="text-sm font-semibold">How can I help?</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">I stay focused on DSA prep and TrackCode problems. I&apos;ll nudge with hints first, and share full code when you ask.</p>
            </div>
            {!configured ? (
              <button
                onClick={() => setSettingsOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 px-4 h-9 text-xs font-semibold cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" /> Set up your key and model
              </button>
            ) : (
              <div className="flex flex-wrap justify-center gap-2 max-w-md">
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:border-accent hover:text-accent transition-colors cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((m, i) => <Bubble key={i} message={m} />)}
            {busy && (
              <Bubble message={{ role: 'assistant', content: streaming || '' }} pending={!streaming} />
            )}
          </>
        )}
        {error && (
          <div className="rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 px-3 py-2 text-xs text-rose-700 dark:text-rose-400">
            {error}
            {/key|sign in/i.test(error) && (
              <button onClick={() => setSettingsOpen(true)} className="ml-2 underline font-semibold cursor-pointer">Open settings</button>
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={e => {
          e.preventDefault();
          send(input);
        }}
        className="p-3 border-t border-zinc-200 dark:border-zinc-800"
      >
        <div className="flex items-end gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            maxLength={6000}
            placeholder={configured ? 'Ask Remiel… (Shift+Enter for newline)' : 'Add your API key and model to chat with Remiel'}
            className="flex-1 resize-none bg-transparent text-[13px] outline-none max-h-40 min-h-[24px] py-1 placeholder:text-zinc-400"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          {busy ? (
            <button type="button" onClick={() => abortRef.current?.abort()} className="h-8 w-8 shrink-0 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 flex items-center justify-center cursor-pointer" aria-label="Stop">
              <Square className="w-3 h-3 fill-current" />
            </button>
          ) : (
            <button type="submit" disabled={!input.trim()} className="h-8 w-8 shrink-0 rounded-lg bg-accent text-accent-foreground flex items-center justify-center disabled:opacity-40 cursor-pointer" aria-label="Send">
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      <RemielSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

function Bubble({ message, pending }: { message: ChatMessage; pending?: boolean }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 px-3.5 py-2 text-[13px] whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2.5">
      <div className="w-6 h-6 mt-0.5 shrink-0 rounded-md bg-[var(--mark-tile)] ring-1 ring-[var(--mark-tile-border)] flex items-center justify-center">
        <LogoMark size={12} />
      </div>
      <div className="min-w-0 flex-1 text-zinc-800 dark:text-zinc-200">
        {pending ? (
          <Thinking />
        ) : (
          <Markdown>{stripEmDashes(message.content)}</Markdown>
        )}
      </div>
    </div>
  );
}

/** Backstop for the no-em-dash house style; leaves fenced code untouched. */
function stripEmDashes(md: string) {
  return md
    .split(/(```[\s\S]*?(?:```|$))/)
    .map((part, i) => (i % 2 ? part : part.replace(/\s*\u2014\s*/g, ', ')))
    .join('');
}

/** Waiting state before the first token: dots, an elapsed timer, and a note when it runs long. */
function Thinking() {
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  const secs = Math.floor((now - start) / 1000);
  return (
    <div className="py-1.5 space-y-1" aria-live="polite">
      <div className="flex items-center gap-2">
        <span className="flex gap-1">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </span>
        <span className="text-[11px] text-zinc-500 tabular-nums">Thinking{secs >= 2 ? ` · ${secs}s` : ''}</span>
      </div>
      {secs >= 8 && (
        <p className="text-[11px] text-zinc-400 max-w-sm">
          Reasoning models can take a while before the first word. A smaller or faster model (a mini, flash or haiku variant) replies sooner.
        </p>
      )}
    </div>
  );
}
