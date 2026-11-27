import { local } from '../lib/storage';
import { useStore } from '../store/useStore';
import { cleanChartPrefs, cleanDrawDefault, type ChartPrefs } from './chartPrefs';

/**
 * Chart settings that browsers used to keep for themselves (in localStorage, the same for every account
 * that signed in there) and that now belong to the account, on the server (useStore.drawDefaults and
 * chartPrefs). The first account to open the chart here takes them, when it has none of its own yet;
 * the browser's copies are then removed.
 */

const DRAW_DEFAULT_PREFIX = 'btl:draw-default:';
const KEYS = { engine: 'backtest:chart-engine', risk: 'backtest:risk-pct', favBar: 'btl:fav-bar', tester: 'btl:tester' };

function json(key: string): unknown {
  const raw = local.getItem(key);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function adoptBrowserChartPrefs() {
  const s = useStore.getState();

  // drawing tools' saved defaults
  let keys: string[] = [];
  try {
    keys = Object.keys(window.localStorage).filter((k) => k.startsWith(DRAW_DEFAULT_PREFIX));
  } catch {
    /* storage blocked */
  }
  if (keys.length) {
    const next = { ...s.drawDefaults };
    let changed = false;
    for (const k of keys) {
      const type = k.slice(DRAW_DEFAULT_PREFIX.length);
      const t = cleanDrawDefault(json(k));
      if (t && /^[a-z0-9_]{1,40}$/.test(type) && !next[type]) {
        next[type] = t;
        changed = true;
      }
      local.removeItem(k);
    }
    if (changed) useStore.setState({ drawDefaults: next });
  }

  // the replay chart's options
  const found: Record<string, unknown> = {};
  const engine = local.getItem(KEYS.engine);
  if (engine) found.engine = engine;
  const risk = Number(local.getItem(KEYS.risk));
  if (risk) found.risk = risk;
  const favBar = json(KEYS.favBar) as Record<string, unknown> | undefined;
  if (favBar && typeof favBar === 'object') found.favBar = { x: favBar.x ?? 0.5, y: favBar.y ?? 0.08, hidden: favBar.hidden === true };
  const tester = json(KEYS.tester);
  if (tester) found.tester = tester;
  const clean = cleanChartPrefs(found) ?? {};
  const mine = s.chartPrefs;
  const add: Partial<ChartPrefs> = {};
  for (const k of Object.keys(clean) as (keyof ChartPrefs)[]) if (mine[k] === undefined) (add as Record<string, unknown>)[k] = clean[k];
  if (Object.keys(add).length) s.setChartPrefs(add);
  for (const k of Object.values(KEYS)) local.removeItem(k);
}
