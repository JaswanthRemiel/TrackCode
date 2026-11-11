'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { DEFAULT_COMPATIBLE_BASE_URL, RemielSettings } from './types';

const KEY = 'remiel_settings_v1';
const EVENT = 'remiel-settings-change';

export const DEFAULT_SETTINGS: RemielSettings = {
  provider: 'gemini',
  model: '',
  apiKey: '',
  baseUrl: DEFAULT_COMPATIBLE_BASE_URL,
};

let cachedRaw: string | null | undefined;
let cachedValue: RemielSettings = DEFAULT_SETTINGS;

function read(): RemielSettings {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try {
    cachedValue = raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    cachedValue = DEFAULT_SETTINGS;
  }
  return cachedValue;
}

function subscribe(cb: () => void) {
  const handler = (e: Event) => {
    if (e instanceof StorageEvent && e.key !== KEY) return;
    cb();
  };
  window.addEventListener('storage', handler);
  window.addEventListener(EVENT, handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener(EVENT, handler);
  };
}

/** BYOK settings live only in this browser's localStorage. */
export function useRemielSettings() {
  const settings = useSyncExternalStore(subscribe, read, () => DEFAULT_SETTINGS);

  const save = useCallback((next: RemielSettings) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage blocked */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { settings, save, clear, configured: Boolean(settings.apiKey && settings.model.trim()) };
}
