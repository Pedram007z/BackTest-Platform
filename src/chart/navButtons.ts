import type { IChartApi, LogicalRange } from 'lightweight-charts';

/**
 * Buttons at the bottom of the chart, as on TradingView: zoom out, zoom in, scroll back, scroll forward
 * and reset the view (for when the chart is squashed, stretched or scrolled away). Both chart engines
 * use them, kept clear of the floating replay bar. They show while the pointer is over the chart
 * (always on touch screens); holding a button repeats it.
 */

export interface NavActions {
  /** factor < 1 zooms in; the right edge stays where it is */
  zoom(factor: number): void;
  /** dir -1 shows earlier bars, +1 later ones; `share` of the visible bars per step */
  scroll(dir: -1 | 1, share: number): void;
  /** back to the starting view, data loaded again and prices fitted */
  reset(): void;
}

export interface NavHost {
  container: HTMLElement;
  /** The candles' pane: width without the price axis, height without the time axis; `x` its left edge. */
  paneBox: () => { x?: number; w: number; h: number };
  colors: () => { surface: string; text: string; border: string };
  actions: NavActions;
}

export interface NavButtons {
  place(): void;
  applyTheme(): void;
  destroy(): void;
}

const ICONS = {
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  reset: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
};

const MIN_BARS = 12;
const ZOOM = 0.8;

/** The built-in chart (lightweight-charts): its visible range in bars. */
export function lwNavActions(chart: IChartApi, bars: () => number, future: () => number, reset: () => void): NavActions {
  const ts = () => chart.timeScale();
  const setRange = (from: number, to: number) => ts().setVisibleLogicalRange({ from, to } as LogicalRange);
  return {
    zoom(factor) {
      const r = ts().getVisibleLogicalRange();
      if (!r) return;
      const width = Math.min(bars() + future() + 20, Math.max(MIN_BARS, (r.to - r.from) * factor));
      setRange(r.to - width, r.to);
    },
    scroll(dir, share) {
      const r = ts().getVisibleLogicalRange();
      if (!r) return;
      const width = r.to - r.from;
      const step = Math.max(1, Math.round(width * share));
      const maxTo = bars() - 1 + future();
      const minFrom = -Math.round(width / 2);
      const shift = dir > 0 ? Math.min(step, Math.max(0, maxTo - r.to)) : -Math.min(step, Math.max(0, r.from - minFrom));
      if (shift) setRange(r.from + shift, r.to + shift);
    },
    reset,
  };
}

const HOLD_MS = 350;
const REPEAT_MS = 60;
const SIZE = 28;

export function createNavButtons(host: NavHost): NavButtons {
  const { container, actions } = host;
  const touch = typeof matchMedia === 'function' && matchMedia('(hover: none)').matches;

  const bar = document.createElement('div');
  Object.assign(bar.style, {
    position: 'absolute',
    zIndex: '5',
    display: 'flex',
    gap: '6px',
    direction: 'ltr',
    transition: 'opacity 150ms ease',
  });
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'جابه‌جایی و بزرگ‌نمایی نمودار');
  const buttons: HTMLButtonElement[] = [];

  function button(icon: keyof typeof ICONS, label: string, run: (repeat: boolean) => void, repeats: boolean) {
    const b = document.createElement('button');
    b.type = 'button';
    b.title = label;
    b.setAttribute('aria-label', label);
    b.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[icon]}</svg>`;
    Object.assign(b.style, {
      width: `${SIZE}px`,
      height: `${SIZE}px`,
      display: 'grid',
      placeItems: 'center',
      padding: '0',
      borderRadius: '7px',
      borderWidth: '1px',
      borderStyle: 'solid',
      cursor: 'pointer',
      touchAction: 'manipulation',
      boxShadow: '0 1px 4px rgba(0,0,0,0.16)',
    });
    let hold: ReturnType<typeof setTimeout> | undefined;
    let every: ReturnType<typeof setInterval> | undefined;
    const stop = () => {
      clearTimeout(hold);
      clearInterval(every);
      hold = every = undefined;
    };
    b.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault(); // keep focus where it was; no text selection while holding
      run(false);
      if (repeats) hold = setTimeout(() => (every = setInterval(() => run(true), REPEAT_MS)), HOLD_MS);
    });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel'] as const) b.addEventListener(ev, stop);
    // keyboard: Enter / Space
    b.addEventListener('click', (e) => {
      if (e.detail === 0) run(false);
    });
    b.addEventListener('mouseenter', () => (b.style.filter = 'brightness(0.94)'));
    b.addEventListener('mouseleave', () => (b.style.filter = ''));
    buttons.push(b);
    return b;
  }

  const group = (...items: HTMLElement[]) => {
    const g = document.createElement('div');
    Object.assign(g.style, { display: 'flex', gap: '4px' });
    g.append(...items);
    return g;
  };
  bar.append(
    group(
      button('minus', 'کوچک‌نمایی', (rep) => actions.zoom(rep ? 1 / 0.96 : 1 / ZOOM), true),
      button('plus', 'بزرگ‌نمایی', (rep) => actions.zoom(rep ? 0.96 : ZOOM), true),
    ),
    group(
      button('left', 'حرکت به عقب (کندل‌های قبلی)', (rep) => actions.scroll(-1, rep ? 0.03 : 0.15), true),
      button('right', 'حرکت به جلو', (rep) => actions.scroll(1, rep ? 0.03 : 0.15), true),
    ),
    button('reset', 'بازنشانی نمای نمودار', () => actions.reset(), false),
  );
  container.append(bar);

  // shown while the pointer is over the chart or a button has focus; always on touch screens
  let over = false;
  let focused = false;
  const show = () => {
    const on = touch || over || focused;
    if (on) place();
    bar.style.opacity = on ? '1' : '0';
    bar.style.pointerEvents = on ? 'auto' : 'none';
  };

  /** bottom centre of the candles' pane, above the calendar flags, clear of the floating replay bar */
  function place() {
    const { x = 0, w, h } = host.paneBox();
    const width = bar.offsetWidth || 5 * SIZE + 34;
    const left = Math.max(4, Math.round(x + w / 2 - width / 2));
    let top = Math.round(h - SIZE - 34);
    const cr = container.getBoundingClientRect();
    for (const f of document.querySelectorAll<HTMLElement>('[data-chart-float]')) {
      const r = f.getBoundingClientRect();
      const x0 = cr.left + left;
      const y0 = cr.top + top;
      if (!r.width || x0 + width + 8 < r.left || x0 - 8 > r.right || y0 + SIZE + 8 < r.top || y0 - 8 > r.bottom) continue;
      const above = Math.round(r.top - cr.top - SIZE - 10);
      top = above >= 4 ? above : Math.round(r.bottom - cr.top + 10);
    }
    bar.style.left = `${left}px`;
    bar.style.top = `${top}px`;
    bar.style.display = top < 4 || top + SIZE > h || w < width + 8 ? 'none' : 'flex';
  }
  const enter = () => {
    over = true;
    show();
  };
  const leave = () => {
    over = false;
    show();
  };
  const focusIn = () => {
    focused = true;
    show();
  };
  const focusOut = () => {
    focused = false;
    show();
  };
  container.addEventListener('pointerenter', enter);
  container.addEventListener('pointerleave', leave);
  bar.addEventListener('focusin', focusIn);
  bar.addEventListener('focusout', focusOut);
  const resized = typeof ResizeObserver === 'function' ? new ResizeObserver(() => place()) : null;
  resized?.observe(container);
  show();

  return {
    place,
    applyTheme() {
      const c = host.colors();
      for (const b of buttons) Object.assign(b.style, { background: c.surface, color: c.text, borderColor: c.border });
    },
    destroy() {
      container.removeEventListener('pointerenter', enter);
      container.removeEventListener('pointerleave', leave);
      resized?.disconnect();
      bar.remove();
    },
  };
}
