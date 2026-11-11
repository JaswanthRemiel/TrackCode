export type ProviderId = 'openai' | 'anthropic' | 'gemini' | 'compatible';

export interface RemielSettings {
  provider: ProviderId;
  model: string;
  apiKey: string;
  /** Only used by the OpenAI-compatible provider (OpenRouter, Groq, DeepSeek, ...). */
  baseUrl?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: number;
}

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  /** Only used as a placeholder hint; the user types (or loads) the real model id. */
  modelExample: string;
  /** Where the provider lists its current model ids. */
  modelsUrl: string;
  keyHint: string;
  keyUrl: string;
}

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  openai: {
    id: 'openai',
    label: 'OpenAI',
    modelExample: 'gpt-5-mini',
    modelsUrl: 'https://platform.openai.com/docs/models',
    keyHint: 'sk-...',
    keyUrl: 'https://platform.openai.com/api-keys',
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    modelExample: 'claude-sonnet-5-5',
    modelsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models',
    keyHint: 'sk-ant-...',
    keyUrl: 'https://console.anthropic.com/settings/keys',
  },
  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    modelExample: 'gemini-2.5-flash',
    modelsUrl: 'https://ai.google.dev/gemini-api/docs/models',
    keyHint: 'AIza...',
    keyUrl: 'https://aistudio.google.com/apikey',
  },
  compatible: {
    id: 'compatible',
    label: 'OpenAI-compatible (OpenRouter, Groq, DeepSeek...)',
    modelExample: 'openai/gpt-5-mini',
    modelsUrl: 'https://openrouter.ai/models',
    keyHint: 'your provider key',
    keyUrl: 'https://openrouter.ai/keys',
  },
};

export const DEFAULT_COMPATIBLE_BASE_URL = 'https://openrouter.ai/api/v1';

/** Shape of the client-supplied context for a chat request. Problem data itself is resolved server-side. */
export interface RemielChatContext {
  problemId?: string | null;
  status?: 'todo' | 'done' | 'revision';
  note?: string;
  /** Short, client-computed progress summary (counts only). */
  progress?: { solved: number; revision: number; total: number };
  /** Active plan summary for general chats. */
  plan?: { title: string; company: string; dayIndex: number; totalDays: number; todayProblemIds: string[] } | null;
}

export interface PlanRequest {
  company: string; // company name or "__any__"
  days: number;
  perDay: number;
  difficulty: 'balanced' | 'easy-first' | 'hard-focus';
  focusTopics: string[];
  goal?: string;
  doneIds: string[];
  revisionIds: string[];
}

export interface PlanDay {
  day: number;
  theme: string;
  tip: string;
  problemIds: string[];
}

export interface GeneratedPlan {
  title: string;
  summary: string;
  days: PlanDay[];
}

export interface RemielPlan extends GeneratedPlan {
  id: string;
  userId: string;
  company: string;
  startDate: string; // YYYY-MM-DD
  createdAt: number;
  perDay: number;
}

export interface RemielChat {
  id: string;
  userId: string;
  /** 'general' or `problem:<id>` */
  scope: string;
  problemId: string | null;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
