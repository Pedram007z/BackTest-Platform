import clsx from 'clsx';
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { create } from 'zustand';
import { TOOLS, type DrawingType } from '../../chart/drawings';
import type { DrawingApi } from '../../chart/lwDrawings';
import { local, readJson, writeJson } from '../../lib/storage';
import { useStore } from '../../store/useStore';
import { ToolIcon } from './drawingIcons';

/**
 * The floating favorites bar of the built-in chart (as TradingView's): the drawing tools starred in the
 * toolbar's menus, in one row over the chart. It is dragged by its handle; where it sits (a share of the
 * free room across and down, so it stays inside when the chart resizes) and whether it is shown are
 * kept in this browser. Which tools are starred belongs to the account (useStore.favTools).
 */

const KEY = 'btl:fav-bar';

interface BarPlace {
  /** share of the free room to the left (0) … right (1) */
  x: number;
  /** share of the free room to the top (0) … bottom (1) */
  y: number;
  hidden: boolean;
}

const saved = readJson<Partial<BarPlace>>(local, KEY, {});
const clamp01 = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : d);

export const useFavBar = create<BarPlace & { set: (p: Partial<BarPlace>) => void }>((set, get) => ({
  x: clamp01(saved.x, 0.5),
  y: clamp01(saved.y, 0.08),
  hidden: saved.hidden === true,
  set: (p) => {
    set(p);
    const { x, y, hidden } = get();
    writeJson(local, KEY, { x, y, hidden });
  },
}));

/** the starred tools this chart knows, in the order they were starred */
export function useFavTools(): DrawingType[] {
  const fav = useStore((s) => s.favTools);
  return fav.filter((t): t is DrawingType => t in TOOLS);
}

export function FavoritesBar({ api }: { api: DrawingApi }) {
  const tools = useFavTools();
  const toggle = useStore((s) => s.toggleFavTool);
  const { x, y, hidden, set } = useFavBar();
  const [, bump] = useState(0);
  useEffect(() => api.subscribe(() => bump((n) => n + 1)), [api]);
  const bar = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState({ w: 0, h: 0 });
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  // the free room left by the bar inside the chart: recomputed when either one changes size
  useEffect(() => {
    const el = bar.current;
    const box = el?.parentElement;
    if (!el || !box) return;
    const measure = () => setRoom({ w: Math.max(0, box.clientWidth - el.offsetWidth - 16), h: Math.max(0, box.clientHeight - el.offsetHeight - 16) });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tools.length, hidden]);

  if (!tools.length || hidden) return null;
  const tool = api.ui().tool;
  const left = 8 + x * room.w;
  const top = 8 + y * room.h;

  const onDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { dx: e.clientX - left, dy: e.clientY - top };
  };
  const onMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    set({ x: room.w ? (e.clientX - d.dx - 8) / room.w : 0.5, y: room.h ? (e.clientY - d.dy - 8) / room.h : 0 });
  };
  const onUp = () => {
    if (!drag.current) return;
    drag.current = null;
    // stored clamped, so a later resize keeps it inside
    set({ x: Math.min(1, Math.max(0, useFavBar.getState().x)), y: Math.min(1, Math.max(0, useFavBar.getState().y)) });
  };

  return (
    <div
      ref={bar}
      className="absolute z-20 flex max-w-[calc(100%-16px)] items-center gap-0.5 rounded-xl border border-line bg-surface/95 p-1 shadow-pop backdrop-blur"
      style={{ left: Math.max(8, Math.min(left, 8 + room.w)), top: Math.max(8, Math.min(top, 8 + room.h)) }}
      role="toolbar"
      aria-label="ابزارهای محبوب"
      dir="ltr"
      onPointerDown={(e) => e.stopPropagation()}
      data-favorites-bar=""
    >
      <button
        type="button"
        className="grid h-8 w-4 shrink-0 cursor-grab touch-none place-items-center rounded text-faint hover:text-ink active:cursor-grabbing"
        title="جابه‌جا کردن نوار"
        aria-label="جابه‌جا کردن نوار ابزارهای محبوب"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <svg width="6" height="14" viewBox="0 0 6 14" fill="currentColor" aria-hidden="true">
          {[1, 5, 9, 13].map((cy) => (
            <g key={cy}>
              <circle cx="1" cy={cy} r="1" />
              <circle cx="5" cy={cy} r="1" />
            </g>
          ))}
        </svg>
      </button>
      <div className="flex min-w-0 flex-nowrap items-center gap-0.5 overflow-x-auto [scrollbar-width:none]">
        {tools.map((t) => (
          <button
            key={t}
            type="button"
            title={`${TOOLS[t].name} — ${TOOLS[t].hint} (کلیک راست: حذف از محبوب‌ها)`}
            aria-label={TOOLS[t].name}
            aria-pressed={tool === t}
            onClick={() => api.setTool(tool === t ? 'cursor' : t)}
            onContextMenu={(e) => {
              e.preventDefault();
              toggle(t);
            }}
            className={clsx(
              'grid h-8 w-8 shrink-0 place-items-center rounded-lg transition',
              tool === t ? 'bg-accent/15 text-accent-ink' : 'text-muted hover:bg-raised hover:text-ink',
            )}
          >
            <ToolIcon id={t} />
          </button>
        ))}
      </div>
    </div>
  );
}
