import { useStore } from '../store/useStore';
import type { IndicatorDefault } from '../services/chartPrefs';
import type { IndicatorConfig } from './indicators';

/**
 * Indicator settings the user saved as default («قالب ← ذخیره به‌عنوان پیش‌فرض»): new copies of the
 * indicator start with them. Kept with the account (useStore.indicatorDefaults, on the server), so they
 * stay after signing out and in and are the same on every device.
 */

/** The indicator's own key: its type, or its Pine script (a ready-made one or the user's). */
export function defaultKey(cfg: Pick<IndicatorConfig, 'type' | 'pine'>): string | null {
  let key: string | null = cfg.type;
  if (cfg.type === 'pine') key = cfg.pine?.builtin ? `lib_${cfg.pine.builtin}` : cfg.pine?.script ? `script_${cfg.pine.script}` : null;
  key = key?.toLowerCase().replace(/[^a-z0-9_]/g, '_') ?? null;
  return key && key.length <= 40 ? key : null;
}

export function savedIndicatorDefault(cfg: Pick<IndicatorConfig, 'type' | 'pine'>): IndicatorDefault | null {
  const key = defaultKey(cfg);
  return (key && useStore.getState().indicatorDefaults[key]) || null;
}

/** A new indicator with the user's saved default on top of the factory settings. */
export function withSavedDefault(cfg: IndicatorConfig): IndicatorConfig {
  const d = savedIndicatorDefault(cfg);
  if (!d) return cfg;
  if (cfg.type === 'pine') return { ...cfg, pine: { ...cfg.pine, inputs: structuredClone(d.inputs ?? {}) } };
  return { ...cfg, params: { ...cfg.params, ...d.params }, colors: { ...cfg.colors, ...d.colors } };
}

export function saveIndicatorDefault(cfg: IndicatorConfig) {
  const key = defaultKey(cfg);
  if (!key) return;
  const d: IndicatorDefault =
    cfg.type === 'pine' ? { params: {}, colors: {}, inputs: structuredClone(cfg.pine?.inputs ?? {}) } : { params: { ...cfg.params }, colors: { ...cfg.colors } };
  useStore.getState().setIndicatorDefault(key, d);
}

export function clearIndicatorDefault(cfg: Pick<IndicatorConfig, 'type' | 'pine'>) {
  const key = defaultKey(cfg);
  if (key) useStore.getState().setIndicatorDefault(key, null);
}
