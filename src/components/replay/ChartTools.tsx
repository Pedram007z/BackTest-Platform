import clsx from 'clsx';
import { Crosshair, Eye, EyeOff, Lock, LockOpen, Magnet, PencilLine, Search, Trash2, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { DRAWING_COLORS, TOOLS, TOOL_GROUPS, type DrawingType, type ToolId } from '../../chart/drawings';
import { INDICATORS, INDICATOR_MAP, SOURCES, type IndicatorConfig, type Source } from '../../chart/indicators';
import type { DrawingApi, DrawingUiState } from '../../chart/lwDrawings';
import type { IndicatorApi } from '../../chart/lwIndicators';
import { useClickOutside } from '../../hooks/useClickOutside';
import { toLatinDigits } from '../../lib/format';
import { toast } from '../../store/useStore';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/controls';

/** Drawing toolbar, selected-drawing bar and indicator dialogs of the built-in chart. */

function useUi(api: DrawingApi): DrawingUiState {
  const [, bump] = useState(0);
  useEffect(() => api.subscribe(() => bump((n) => n + 1)), [api]);
  return api.ui();
}

// ---------- icons (TradingView-like line drawings) ----------
const S = { width: 22, height: 22, viewBox: '0 0 28 28', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const };
const dot = (cx: number, cy: number) => <circle cx={cx} cy={cy} r={2.4} fill="currentColor" stroke="none" />;
export function ToolIcon({ id }: { id: DrawingType }) {
  switch (id) {
    case 'trend':
      return (
        <svg {...S}>
          <path d="M6 22 22 6" />
          {dot(6, 22)}
          {dot(22, 6)}
        </svg>
      );
    case 'ray':
      return (
        <svg {...S}>
          <path d="M6 22 24 4" />
          {dot(6, 22)}
          {dot(14, 14)}
        </svg>
      );
    case 'hline':
      return (
        <svg {...S}>
          <path d="M3 14h22" />
          {dot(14, 14)}
        </svg>
      );
    case 'hray':
      return (
        <svg {...S}>
          <path d="M8 14h17" />
          {dot(8, 14)}
        </svg>
      );
    case 'vline':
      return (
        <svg {...S}>
          <path d="M14 3v22" />
          {dot(14, 14)}
        </svg>
      );
    case 'channel':
      return (
        <svg {...S}>
          <path d="M4 17 18 5M10 23 24 11" />
          <path d="M7 20 21 8" strokeDasharray="2 3" opacity={0.6} />
        </svg>
      );
    case 'rect':
      return (
        <svg {...S}>
          <rect x={6} y={8} width={16} height={12} rx={1} />
          {dot(6, 8)}
          {dot(22, 20)}
        </svg>
      );
    case 'fib':
      return (
        <svg {...S}>
          <path d="M4 6h20M4 11h20M4 16h20M4 22h20" />
          <path d="M6 22 22 6" strokeDasharray="2 3" opacity={0.6} />
        </svg>
      );
    case 'long':
      return (
        <svg {...S}>
          <rect x={5} y={4} width={18} height={10} fill="#26c281" fillOpacity={0.35} stroke="none" />
          <rect x={5} y={14} width={18} height={9} fill="#f25466" fillOpacity={0.35} stroke="none" />
          <path d="M5 14h18M14 18v-9M11 12l3-3 3 3" />
        </svg>
      );
    case 'short':
      return (
        <svg {...S}>
          <rect x={5} y={4} width={18} height={10} fill="#f25466" fillOpacity={0.35} stroke="none" />
          <rect x={5} y={14} width={18} height={9} fill="#26c281" fillOpacity={0.35} stroke="none" />
          <path d="M5 14h18M14 10v9M11 16l3 3 3-3" />
        </svg>
      );
    case 'measure':
      return (
        <svg {...S}>
          <rect x={5} y={6} width={18} height={16} rx={1} strokeDasharray="2 2" />
          <path d="M14 20V8M11 11l3-3 3 3" />
        </svg>
      );
    case 'text':
      return (
        <svg {...S}>
          <path d="M7 7h14M14 7v15M11 22h6" />
        </svg>
      );
  }
}

function ToolButton({ active, title, onClick, children, className }: { active?: boolean; title: string; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      className={clsx(
        'relative grid h-9 w-9 shrink-0 place-items-center rounded-lg transition',
        active ? 'bg-accent/15 text-accent-ink' : 'text-muted hover:bg-raised hover:text-ink',
        className,
      )}
    >
      {children}
    </button>
  );
}

function Group({ tools, ui, api }: { tools: DrawingType[]; ui: DrawingUiState; api: DrawingApi }) {
  const [last, setLast] = useState<DrawingType>(tools[0]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const refs = useMemo(() => [ref, menu], []);
  useClickOutside(refs, () => setOpen(false), open);
  const rect = open ? ref.current?.getBoundingClientRect() : undefined;
  const current = tools.includes(ui.tool as DrawingType) ? (ui.tool as DrawingType) : last;
  const active = tools.includes(ui.tool as DrawingType);
  const pick = (t: DrawingType) => {
    setLast(t);
    setOpen(false);
    api.setTool(t);
  };
  return (
    <div ref={ref} className="relative">
      <ToolButton active={active} title={`${TOOLS[current].name} — ${TOOLS[current].hint}`} onClick={() => (active && tools.length > 1 ? setOpen(!open) : pick(current))}>
        <ToolIcon id={current} />
      </ToolButton>
      {tools.length > 1 && (
        <button
          type="button"
          aria-label="ابزارهای دیگر"
          title="ابزارهای دیگر"
          onClick={() => setOpen(!open)}
          className="absolute bottom-0 right-0 h-3 w-3 text-faint hover:text-ink"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" className="absolute bottom-0.5 right-0.5">
            <path d="M8 0v8H0z" fill="currentColor" />
          </svg>
        </button>
      )}
      {open &&
        rect &&
        createPortal(
          <div ref={menu} className="anim-pop fixed z-50 w-60 rounded-xl border border-line bg-surface p-1 shadow-pop" style={{ left: rect.right + 8, top: rect.top }} dir="rtl">
            {tools.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => pick(t)}
                className={clsx('flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-start text-[13px] hover:bg-raised', ui.tool === t && 'text-accent-ink')}
              >
                <span className="text-muted" dir="ltr">
                  <ToolIcon id={t} />
                </span>
                <span className="flex-1">{TOOLS[t].name}</span>
                <span className="text-[11px] text-faint" dir="ltr">
                  {TOOLS[t].hint.split(' · ')[0]}
                </span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

/** The column of drawing tools on the chart's left side. */
export function DrawingToolbar({ api }: { api: DrawingApi }) {
  const ui = useUi(api);
  const setTool = (t: ToolId) => api.setTool(t);
  return (
    <div
      className="flex w-11 shrink-0 flex-col items-center gap-0.5 overflow-y-auto border-r border-line/60 py-1.5 [scrollbar-width:none]"
      role="toolbar"
      aria-label="ابزارهای رسم"
      aria-orientation="vertical"
    >
      <ToolButton active={ui.tool === 'cursor'} title="نشانگر (Esc)" onClick={() => setTool('cursor')}>
        <Crosshair size={18} strokeWidth={1.7} />
      </ToolButton>
      <span className="my-1 h-px w-6 bg-line" />
      {TOOL_GROUPS.map((g) => (
        <Group key={g.id} tools={g.tools} ui={ui} api={api} />
      ))}
      <span className="my-1 h-px w-6 bg-line" />
      <ToolButton active={ui.magnet} title={ui.magnet ? 'آهنربا روشن: نقطه‌ها روی باز، سقف، کف یا بسته‌ی کندل می‌نشینند' : 'آهنربا'} onClick={() => api.setMagnet(!ui.magnet)}>
        <Magnet size={18} strokeWidth={1.7} />
      </ToolButton>
      <ToolButton active={ui.stay} title={ui.stay ? 'ماندن در حالت رسم: روشن' : 'ماندن در حالت رسم (چند رسم پشت سر هم)'} onClick={() => api.setStay(!ui.stay)}>
        <PencilLine size={18} strokeWidth={1.7} />
      </ToolButton>
      <ToolButton active={ui.locked} title={ui.locked ? 'باز کردن قفل رسم‌ها' : 'قفل همه‌ی رسم‌ها'} onClick={() => api.setLocked(!ui.locked)}>
        {ui.locked ? <Lock size={18} strokeWidth={1.7} /> : <LockOpen size={18} strokeWidth={1.7} />}
      </ToolButton>
      <ToolButton active={ui.hidden} title={ui.hidden ? 'نمایش رسم‌ها' : 'پنهان کردن رسم‌ها'} onClick={() => api.setHidden(!ui.hidden)}>
        {ui.hidden ? <EyeOff size={18} strokeWidth={1.7} /> : <Eye size={18} strokeWidth={1.7} />}
      </ToolButton>
      <ToolButton title="برگرداندن (Ctrl+Z)" onClick={() => api.undo()} className={!ui.canUndo ? 'pointer-events-none opacity-40' : undefined}>
        <Undo2 size={18} strokeWidth={1.7} />
      </ToolButton>
      <ToolButton
        title="حذف همه‌ی رسم‌های این نماد"
        onClick={() => {
          const n = api.removeAll();
          if (n) toast(`${n.toLocaleString('fa-IR')} رسم پاک شد؛ برای برگرداندن Ctrl+Z`);
        }}
        className={clsx('hover:text-loss', !ui.count && 'pointer-events-none opacity-40')}
      >
        <Trash2 size={18} strokeWidth={1.7} />
      </ToolButton>
    </div>
  );
}

const SIZES = ['کوچک', 'متوسط', 'بزرگ', 'خیلی بزرگ'];

/** Floating bar over the chart for the selected drawing: color, width or text, lock, delete. */
export function SelectedDrawingBar({ api }: { api: DrawingApi }) {
  const ui = useUi(api);
  const d = ui.selected;
  const textRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  useEffect(() => {
    setText(d?.text ?? '');
    // a new text drawing: type straight away
    if (d?.type === 'text' && d.text === 'متن') setTimeout(() => textRef.current?.select(), 0);
  }, [d?.id]);
  if (!d) return null;
  const colored = !['long', 'short', 'measure'].includes(d.type);
  return (
    <div
      className="anim-pop absolute left-1/2 top-2 z-20 flex max-w-[calc(100%-16px)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-xl border border-line bg-surface/95 px-2 py-1 shadow-pop backdrop-blur [scrollbar-width:none]"
      dir="ltr"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <span className="hidden shrink-0 px-1 text-[12px] font-semibold text-muted sm:inline" dir="rtl">
        {TOOLS[d.type].name}
      </span>
      {colored && (
        <div className="flex items-center gap-0.5 border-l border-line/70 pl-1.5">
          {DRAWING_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`رنگ ${c}`}
              onClick={() => api.updateSelected({ color: c })}
              className={clsx('h-5 w-5 shrink-0 rounded-full border-2', d.color === c ? 'border-ink' : 'border-transparent')}
              style={{ background: c }}
            />
          ))}
        </div>
      )}
      {d.type === 'text' ? (
        <>
          <input
            ref={textRef}
            className="field h-7 w-40 py-0 text-[13px]"
            dir="auto"
            value={text}
            aria-label="متن"
            onChange={(e) => setText(e.target.value)}
            onBlur={() => text.trim() && text !== d.text && api.updateSelected({ text: text.trim() })}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
          />
          <div className="flex items-center gap-0.5 border-l border-line/70 pl-1.5">
            {[1, 2, 3, 4].map((w) => (
              <button
                key={w}
                type="button"
                title={SIZES[w - 1]}
                onClick={() => api.updateSelected({ width: w })}
                className={clsx('grid h-6 w-6 place-items-center rounded-md font-bold', d.width === w ? 'bg-accent/15 text-accent-ink' : 'text-muted hover:bg-raised')}
                style={{ fontSize: 9 + w * 2 }}
              >
                A
              </button>
            ))}
          </div>
        </>
      ) : (
        colored && (
          <div className="flex items-center gap-0.5 border-l border-line/70 pl-1.5">
            {[1, 2, 3, 4].map((w) => (
              <button
                key={w}
                type="button"
                title={`ضخامت ${w}`}
                aria-label={`ضخامت ${w}`}
                onClick={() => api.updateSelected({ width: w })}
                className={clsx('grid h-6 w-6 place-items-center rounded-md', d.width === w ? 'bg-accent/15' : 'hover:bg-raised')}
              >
                <span className="block w-3.5 rounded-full bg-current text-ink" style={{ height: w }} />
              </button>
            ))}
          </div>
        )
      )}
      <div className="flex items-center gap-0.5 border-l border-line/70 pl-1.5">
        <button
          type="button"
          title={d.locked ? 'باز کردن قفل' : 'قفل (جابه‌جا نشود)'}
          aria-label={d.locked ? 'باز کردن قفل' : 'قفل'}
          onClick={() => api.updateSelected({ locked: !d.locked })}
          className={clsx('grid h-7 w-7 place-items-center rounded-md', d.locked ? 'text-accent-ink' : 'text-muted hover:bg-raised')}
        >
          {d.locked ? <Lock size={15} /> : <LockOpen size={15} />}
        </button>
        <button
          type="button"
          title="حذف (Delete)"
          aria-label="حذف رسم"
          onClick={() => api.removeSelected()}
          className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-loss/10 hover:text-loss"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

// ---------- indicators ----------
export function IndicatorsDialog({ api, open, onClose }: { api: IndicatorApi; open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  useEffect(() => {
    if (open) setQ('');
  }, [open]);
  const list = INDICATORS.filter((d) => !q.trim() || `${d.name} ${d.nameFa} ${d.short}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <Modal open={open} onClose={onClose} title="اندیکاتورها" size="sm">
      <div className="relative mb-3">
        <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint" />
        <input id="indicator-search" className="field pr-9" placeholder="جست‌وجو: RSI، میانگین، بولینگر…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <ul className="flex flex-col gap-0.5">
        {list.map((d) => (
          <li key={d.type}>
            <button
              type="button"
              onClick={() => {
                api.add(d.type);
                toast(`${d.nameFa} اضافه شد`);
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start hover:bg-raised"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{d.nameFa}</span>
                <span className="block text-[12px] text-faint" dir="ltr" style={{ textAlign: 'right' }}>
                  {d.name}
                </span>
              </span>
              <span className={clsx('rounded-md px-1.5 py-0.5 text-[11px] font-semibold', d.overlay ? 'bg-accent/10 text-accent-ink' : 'bg-raised text-muted')}>
                {d.overlay ? 'روی چارت' : 'پنل جدا'}
              </span>
            </button>
          </li>
        ))}
        {!list.length && <li className="py-6 text-center text-sm text-muted">اندیکاتوری با این نام نیست.</li>}
      </ul>
    </Modal>
  );
}

export function IndicatorSettings({ api, id, onClose }: { api: IndicatorApi; id: string; onClose: () => void }) {
  const cfg = api.list().find((c) => c.id === id);
  const [d, setD] = useState<IndicatorConfig | null>(cfg ? structuredClone(cfg) : null);
  if (!cfg || !d) return null;
  const def = INDICATOR_MAP[d.type];
  const setParam = (k: string, v: number | string) => setD({ ...d, params: { ...d.params, [k]: v } });
  const valid = def.params.every(
    (p) =>
      p.kind === 'source' ||
      (Number.isFinite(d.params[p.key] as number) && (d.params[p.key] as number) >= (p.min ?? -Infinity) && (d.params[p.key] as number) <= (p.max ?? Infinity)),
  );
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={`${def.nameFa} (${def.short})`}
      footer={
        <>
          <button
            type="button"
            className="btn-ghost me-auto"
            onClick={() => setD({ ...d, params: { ...def.defaults }, colors: Object.fromEntries(def.plots.map((p) => [p.key, p.color])) })}
          >
            پیش‌فرض
          </button>
          <button type="button" className="btn-ghost" onClick={onClose}>
            انصراف
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!valid}
            onClick={() => {
              api.update(d);
              onClose();
            }}
          >
            ذخیره
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {def.params.map((p) =>
          p.kind === 'source' ? (
            <div key={p.key}>
              <span className="label">{p.label}</span>
              <Select value={String(d.params[p.key] ?? 'close') as Source} onChange={(v) => setParam(p.key, v)} options={SOURCES.map((s) => ({ value: s, label: s }))} />
            </div>
          ) : (
            <div key={p.key}>
              <label className="label" htmlFor={`ind-${p.key}`}>
                {p.label}
              </label>
              <input
                id={`ind-${p.key}`}
                className="field num"
                dir="ltr"
                inputMode="decimal"
                value={Number.isFinite(d.params[p.key] as number) ? String(d.params[p.key]) : ''}
                onChange={(e) => {
                  const raw = toLatinDigits(e.target.value).replace(/[^\d.]/g, '');
                  const n = p.kind === 'int' ? parseInt(raw, 10) : parseFloat(raw);
                  setParam(p.key, Number.isFinite(n) ? n : NaN);
                }}
              />
              <p className="mt-1 text-[11px] text-faint">
                {p.min} تا {p.max}
              </p>
            </div>
          ),
        )}
      </div>
      <p className="label mt-4">رنگ‌ها</p>
      <div className="flex flex-wrap gap-3">
        {def.plots.map((p) => (
          <label key={p.key} className="flex items-center gap-2 text-[13px]">
            <input
              type="color"
              className="h-7 w-9 cursor-pointer rounded border border-line bg-transparent"
              value={d.colors[p.key] ?? p.color}
              onChange={(e) => setD({ ...d, colors: { ...d.colors, [p.key]: e.target.value } })}
            />
            <span dir="ltr">{p.label}</span>
          </label>
        ))}
      </div>
    </Modal>
  );
}
