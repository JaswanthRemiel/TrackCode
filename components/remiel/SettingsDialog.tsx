'use client';

import { useId, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRemielSettings } from '@/lib/ai/settings';
import { DEFAULT_COMPATIBLE_BASE_URL, PROVIDERS, ProviderId, RemielSettings } from '@/lib/ai/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { fetchRemielModels } from '@/lib/ai/client';

const INTRO = 'Bring your own API key. It is stored only in this browser and sent per request to the provider. It is never saved on our servers.';

export function RemielSettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl sm:max-w-lg shadow-xl">
        {/* Mounted only while open, so the draft starts from the saved settings each time. */}
        {open && <SettingsForm variant="dialog" onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

/** Same settings, rendered inline (used on the profile page). */
export function RemielSettingsPanel() {
  return <SettingsForm variant="inline" />;
}

function SettingsForm({ variant, onDone }: { variant: 'dialog' | 'inline'; onDone?: () => void }) {
  const { settings, save, clear, configured } = useRemielSettings();
  const [draft, setDraft] = useState<RemielSettings>(settings);
  const [showKey, setShowKey] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const uid = useId();
  const [models, setModels] = useState<{ key: string; list: string[] } | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const info = PROVIDERS[draft.provider];
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  const pickProvider = (id: ProviderId) => {
    setNotice(null);
    setDraft(d => ({
      ...d,
      provider: id,
      model: id === d.provider ? d.model : '',
      apiKey: id === d.provider ? d.apiKey : '',
      baseUrl: d.baseUrl || DEFAULT_COMPATIBLE_BASE_URL,
    }));
  };

  // Loaded models belong to one provider + key + base URL; any change hides them.
  const modelsKey = `${draft.provider}|${draft.apiKey}|${draft.baseUrl ?? ''}`;
  const loaded = models && models.key === modelsKey ? models.list : null;
  const matches = useMemo(() => {
    if (!loaded) return [];
    const q = draft.model.trim().toLowerCase();
    return (q ? loaded.filter(m => m.toLowerCase().includes(q)) : loaded).slice(0, 24);
  }, [loaded, draft.model]);

  const loadModels = async () => {
    setLoadingModels(true);
    setModelsError(null);
    try {
      const list = await fetchRemielModels(draft);
      setModels({ key: modelsKey, list });
      if (!list.length) setModelsError('The provider returned no models for this key. Type the model id instead.');
    } catch (e) {
      setModelsError(e instanceof Error ? e.message : 'Could not load models.');
    } finally {
      setLoadingModels(false);
    }
  };

  const update = (patch: Partial<RemielSettings>) => {
    setNotice(null);
    setDraft(d => ({ ...d, ...patch }));
  };

  const onSave = () => {
    const next = { ...draft, model: draft.model.trim() };
    save(next);
    setDraft(next);
    setNotice('Saved on this device.');
    onDone?.();
  };

  const onRemove = () => {
    clear();
    setDraft(d => ({ ...d, apiKey: '' }));
    setNotice('Key removed from this device.');
    onDone?.();
  };

  const fields = (
    <div className="space-y-5 py-2">
      <div className="space-y-2">
        <Label className="text-[11px] font-medium text-zinc-500">Provider</Label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(PROVIDERS) as ProviderId[]).map(id => (
            <button
              key={id}
              type="button"
              onClick={() => pickProvider(id)}
              aria-pressed={draft.provider === id}
              className={cn(
                'text-left rounded-lg border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer',
                draft.provider === id
                  ? 'border-accent bg-accent/10 text-zinc-900 dark:text-zinc-50'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900',
              )}
            >
              {id === 'compatible' ? 'OpenAI-compatible' : PROVIDERS[id].label}
            </button>
          ))}
        </div>
        {draft.provider === 'compatible' && (
          <p className="text-[11px] text-zinc-500">Works with OpenRouter, Groq, DeepSeek, Mistral, Together and any OpenAI-compatible API.</p>
        )}
      </div>

      {draft.provider === 'compatible' && (
        <div className="space-y-2">
          <Label htmlFor={`${uid}-base`} className="text-[11px] font-medium text-zinc-500">Base URL</Label>
          <Input
            id={`${uid}-base`}
            value={draft.baseUrl ?? ''}
            placeholder={DEFAULT_COMPATIBLE_BASE_URL}
            onChange={e => update({ baseUrl: e.target.value })}
            className="h-10 rounded-lg text-sm"
          />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${uid}-key`} className="text-[11px] font-medium text-zinc-500">API key</Label>
          <a href={info.keyUrl} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-accent hover:underline">Get a key ↗</a>
        </div>
        <div className="relative">
          <Input
            id={`${uid}-key`}
            type={showKey ? 'text' : 'password'}
            autoComplete="off"
            spellCheck={false}
            value={draft.apiKey}
            placeholder={info.keyHint}
            onChange={e => update({ apiKey: e.target.value.trim() })}
            className="h-10 rounded-lg text-sm pr-10"
          />
          <button
            type="button"
            onClick={() => setShowKey(s => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            aria-label={showKey ? 'Hide key' : 'Show key'}
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Stored locally on this device only.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={`${uid}-model`} className="text-[11px] font-medium text-zinc-500">Model</Label>
          <a href={info.modelsUrl} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-accent hover:underline">See model ids ↗</a>
        </div>
        <div className="flex gap-2">
          <Input
            id={`${uid}-model`}
            value={draft.model}
            autoComplete="off"
            spellCheck={false}
            placeholder={`e.g. ${info.modelExample}`}
            onChange={e => update({ model: e.target.value.trim() })}
            className="h-10 rounded-lg text-sm flex-1 min-w-0"
            aria-describedby={`${uid}-model-help`}
          />
          <Button
            type="button"
            variant="outline"
            onClick={loadModels}
            disabled={!draft.apiKey || loadingModels}
            className="h-10 px-3 rounded-lg normal-case tracking-normal text-xs gap-1.5 shrink-0"
          >
            {loadingModels ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Load my models
          </Button>
        </div>
        <p id={`${uid}-model-help`} className="text-[11px] text-zinc-500 leading-relaxed">
          Type any model id your key can use, including brand new ones. Or load the list straight from {info.label.split(' (')[0]}.
        </p>
        {modelsError && <p className="text-[11px] text-rose-600 dark:text-rose-400">{modelsError}</p>}
        {loaded && loaded.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] text-zinc-400">
              {loaded.length} models available{draft.model ? `, ${matches.length === 24 ? '24+' : matches.length} matching` : ''}. Type to filter.
            </p>
            <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
              {matches.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => update({ model: m })}
                  className={cn(
                    'rounded border px-1.5 py-0.5 text-[11px] font-semibold cursor-pointer',
                    draft.model === m ? 'border-accent text-accent' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100',
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const actions = (
    <>
      <Button variant="ghost" onClick={onRemove} disabled={!configured && !draft.apiKey} className="h-10 px-4 rounded-lg text-rose-500 hover:text-rose-600">
        Remove key
      </Button>
      <Button
        onClick={onSave}
        disabled={!draft.apiKey || !draft.model.trim() || (variant === 'inline' && !dirty)}
        className="h-10 px-5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950"
      >
        Save
      </Button>
    </>
  );

  if (variant === 'dialog') {
    return (
      <>
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-accent" /> Remiel settings
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{INTRO}</DialogDescription>
        </DialogHeader>
        {fields}
        <DialogFooter className="flex sm:justify-between gap-2">{actions}</DialogFooter>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-accent" /> Remiel AI key
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl">{INTRO}</p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-md border px-2 py-1 text-[11px] font-medium ',
            configured ? 'border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500',
          )}
        >
          {configured ? `${PROVIDERS[settings.provider].label.split(' (')[0]} connected` : 'Not set'}
        </span>
      </div>
      {fields}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
        <p className="flex items-center gap-1.5 text-xs text-zinc-500" aria-live="polite">
          {notice && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
          {notice}
        </p>
        <div className="flex gap-2">{actions}</div>
      </div>
    </div>
  );
}
