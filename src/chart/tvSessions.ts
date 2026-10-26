import { TF_MS, candlesBetween, type Timeframe } from '../lib/market';
import { DEFAULT_NAMES_EN, DEFAULT_SESSIONS, SESSION_COUNT, SESSIONS_MAX_BAR_SEC, cleanSession, rgba, sessionBoxes, type SessionsConfig } from './sessions';

/**
 * The «سشن‌ها» indicator on the TradingView chart. TradingView's Indicators dialog offers it as
 * "Sessions (High / Low)" (a custom indicator: its settings are the library's own dialog, and it is saved
 * with the pane's layout). It draws nothing itself; while it is on the chart, the engine draws one locked
 * rectangle per session and day in view, attached to it (so the eye and the remove button in its legend
 * act on them), from the bars the replay has shown.
 */

type Any = any; // the library's own typings are not part of this repository

export const STUDY_NAME = 'Sessions (High / Low)';

/** TradingView's tz list for the sessions: the market cities, UTC and Tehran */
const ZONES = ['Australia/Sydney', 'Asia/Tokyo', 'Europe/London', 'America/New_York', 'UTC', 'Asia/Tehran', 'Asia/Dubai', 'Europe/Berlin', 'Asia/Hong_Kong', 'Asia/Singapore'];
const ZONE_TITLES: Record<string, string> = {
  'Australia/Sydney': 'Sydney',
  'Asia/Tokyo': 'Tokyo',
  'Europe/London': 'London',
  'America/New_York': 'New York',
  UTC: 'UTC',
  'Asia/Tehran': 'Tehran',
  'Asia/Dubai': 'Dubai',
  'Europe/Berlin': 'Frankfurt',
  'Asia/Hong_Kong': 'Hong Kong',
  'Asia/Singapore': 'Singapore',
};

const FIELDS = ['on', 'name', 'time', 'tz', 'color'] as const;
/** input id of a session's field (TradingView names custom inputs in_0, in_1, …) */
const inputId = (session: number, field: (typeof FIELDS)[number]) => `in_${session * FIELDS.length + FIELDS.indexOf(field)}`;
const FILL_ID = `in_${SESSION_COUNT * FIELDS.length}`;
const LABELS_ID = `in_${SESSION_COUNT * FIELDS.length + 1}`;

const toTvTime = (start: string, end: string) => `${start.replace(':', '')}-${end.replace(':', '')}`;

/** the custom indicator for the widget's `custom_indicators_getter` */
export function sessionsStudy(): Any {
  const inputs: Any[] = [];
  const defaults: Record<string, unknown> = {};
  DEFAULT_SESSIONS.forEach((s, i) => {
    const n = `Session ${i + 1}`;
    const add = (field: (typeof FIELDS)[number], info: Any, defval: unknown) => {
      // the plot is never shown, so this keeps every input out of the legend (it would list them all)
      inputs.push({ id: inputId(i, field), defval, hideWhenPlotsHidden: ['plot_0'], ...info });
      defaults[inputId(i, field)] = defval;
    };
    add('on', { name: `${n}: show`, type: 'bool' }, s.on);
    add('name', { name: `${n}: name`, type: 'text' }, DEFAULT_NAMES_EN[i]);
    add('time', { name: `${n}: hours`, type: 'session' }, toTvTime(s.start, s.end));
    add('tz', { name: `${n}: time zone`, type: 'text', options: ZONES, optionsTitles: ZONE_TITLES }, s.tz);
    add('color', { name: `${n}: colour`, type: 'color' }, s.color);
  });
  inputs.push({ id: FILL_ID, name: 'Fill the boxes', type: 'bool', defval: true, hideWhenPlotsHidden: ['plot_0'] });
  inputs.push({ id: LABELS_ID, name: 'Session names', type: 'bool', defval: true, hideWhenPlotsHidden: ['plot_0'] });
  defaults[FILL_ID] = true;
  defaults[LABELS_ID] = true;
  return {
    name: STUDY_NAME,
    metainfo: {
      _metainfoVersion: 53,
      id: 'BtlSessions@tv-basicstudies-1',
      name: STUDY_NAME,
      description: STUDY_NAME,
      shortDescription: 'Sessions',
      is_price_study: true,
      isCustomIndicator: true,
      linkedToSeries: true,
      format: { type: 'inherit' },
      plots: [{ id: 'plot_0', type: 'line' }],
      defaults: {
        styles: { plot_0: { linestyle: 0, visible: false, linewidth: 1, plottype: 0, trackPrice: false, transparency: 100, color: '#000000', display: 0 } },
        inputs: defaults,
      },
      styles: { plot_0: { title: 'Sessions', histogramBase: 0, isHidden: true } },
      inputs,
    },
    constructor: function (this: Any) {
      this.main = () => [NaN];
    },
  };
}

/** the study's inputs → the sessions; anything odd falls back to the defaults */
export function configFromInputs(values: { id: string; value: unknown }[]): SessionsConfig {
  const v = new Map(values.map((x) => [x.id, x.value]));
  const sessions = Array.from({ length: SESSION_COUNT }, (_, i) => {
    const m = /^(\d{2})(\d{2})-(\d{2})(\d{2})/.exec(String(v.get(inputId(i, 'time')) ?? ''));
    const color = String(v.get(inputId(i, 'color')) ?? '');
    return cleanSession(
      {
        on: v.get(inputId(i, 'on')),
        name: v.get(inputId(i, 'name')),
        start: m ? `${m[1]}:${m[2]}` : undefined,
        end: m ? `${m[3]}:${m[4]}` : undefined,
        tz: v.get(inputId(i, 'tz')),
        color: toHex(color) ?? undefined,
      },
      i,
    );
  });
  return { sessions, fill: v.get(FILL_ID) !== false, labels: v.get(LABELS_ID) !== false };
}

/** "#3b82f6", "#3B82F6FF" or "rgba(59, 130, 246, 1)" → "#3b82f6" */
function toHex(c: string): string | null {
  const hex = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(c.trim());
  if (hex) return `#${hex[1].toLowerCase()}`;
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(c.trim());
  if (rgb)
    return `#${rgb
      .slice(1, 4)
      .map((x) => Math.min(255, Number(x)).toString(16).padStart(2, '0'))
      .join('')}`;
  return null;
}

export interface TvSessionsHost {
  chart(): Any;
  symbol(): string;
  timeframe(): Timeframe;
  cursor(): number;
}

/** Keeps the rectangles of every sessions indicator on the chart in step with the view and the replay. */
export function createTvSessions(host: TvSessionsHost) {
  /** shape key → entity id */
  let shapes = new Map<string, Any>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  function clear() {
    const chart = host.chart();
    for (const id of shapes.values()) {
      try {
        chart?.removeEntity(id);
      } catch {
        /* removed with its indicator */
      }
    }
    shapes = new Map();
  }

  function sync() {
    timer = null;
    const chart = host.chart();
    if (!chart) return;
    const studies = (chart.getAllStudies() as { id: Any; name: string }[]).filter((s) => s.name === STUDY_NAME);
    const tf = host.timeframe();
    const barSec = TF_MS[tf] / 1000;
    const next = new Map<string, Any>();
    if (studies.length && barSec <= SESSIONS_MAX_BAR_SEC) {
      const range = chart.getVisibleRange() as { from: number; to: number };
      // two days before the left edge: a session that started out of view still shows whole
      const fromMs = (range.from - 2 * 86_400) * 1000;
      const toMs = (range.to + 86_400) * 1000;
      const bars = candlesBetween(host.symbol(), tf, fromMs, toMs, host.cursor());
      for (const st of studies) {
        let api: Any;
        try {
          api = chart.getStudyById(st.id);
        } catch {
          continue;
        }
        if (!api || (typeof api.isVisible === 'function' && !api.isVisible())) continue;
        const cfg = configFromInputs(api.getInputValues());
        const boxes = sessionBoxes(bars, cfg, barSec).slice(-160);
        for (const b of boxes) {
          const s = cfg.sessions[b.session];
          const t0 = bars[b.from].time;
          const t1 = bars[b.to].time;
          const key = [st.id, b.session, t0, t1, b.high, b.low, s.name, s.color, cfg.fill, cfg.labels].join('|');
          const old = shapes.get(key);
          if (old !== undefined) {
            next.set(key, old);
            shapes.delete(key);
            continue;
          }
          try {
            const id = chart.createMultipointShape(
              [
                { time: t0, price: b.high },
                { time: t1, price: b.low },
              ],
              {
                shape: 'rectangle',
                text: cfg.labels ? s.name : '',
                lock: true,
                disableSelection: true,
                disableSave: true,
                disableUndo: true,
                showInObjectsTree: false,
                zOrder: 'bottom',
                ownerStudyId: st.id,
                overrides: {
                  color: s.color,
                  linewidth: 1,
                  backgroundColor: rgba(s.color, 0.1),
                  fillBackground: cfg.fill,
                  transparency: 88,
                  showLabel: cfg.labels,
                  textColor: s.color,
                  fontSize: 11,
                  bold: true,
                  horzLabelsAlign: 'left',
                  // (the first point is the high: "bottom" puts the name at the top edge, inside)
                  vertLabelsAlign: 'bottom',
                },
              },
            );
            if (id) next.set(key, id);
          } catch {
            /* outside the loaded bars: drawn on the next pass */
          }
        }
      }
    }
    // what is left over: moved, changed or out of view
    clear();
    shapes = next;
  }

  return {
    /** redraw soon (several changes in a row draw once) */
    schedule() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(sync, 120);
    },
    clear,
    destroy() {
      if (timer) clearTimeout(timer);
      timer = null;
      shapes = new Map();
    },
  };
}
