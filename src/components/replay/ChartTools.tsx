import clsx from 'clsx';
import {
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronDown,
  ChevronUp,
  Copy,
  Crosshair,
  Ellipsis,
  Eye,
  EyeOff,
  ListTree,
  Lock,
  LockOpen,
  Magnet,
  PencilLine,
  Redo2,
  Search,
  Settings2,
  Star,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { TOOLS, TOOL_GROUPS, TOOL_SPECS, styleOf, withDefaults, type Drawing, type DrawingStyle, type DrawingType, type LineDash, type ToolId } from '../../chart/drawings';
import { INDICATORS, INDICATOR_MAP, SOURCES, type IndicatorConfig, type IndicatorType, type Source } from '../../chart/indicators';
import type { DrawingApi, DrawingUiState } from '../../chart/lwDrawings';
import type { IndicatorApi } from '../../chart/lwIndicators';
import { useClickOutside } from '../../hooks/useClickOutside';
import { toLatinDigits } from '../../lib/format';
import { toast, useStore } from '../../store/useStore';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/controls';
import { DrawingSettings } from './DrawingSettings';
import { ColorButton, DASHES, DashIcon, FloatingPanel } from './drawingControls';
import { useFavBar, useFavTools } from './FavoritesBar';
import { SessionsSettings } from './SessionsSettings';
import { ToolIcon } from './drawingIcons';

export { ToolIcon } from './drawingIcons';

/** Drawing toolbar, selected-drawing bar, drawing settings and indicator dialogs of the built-in chart. */

function useUi(api: DrawingApi): DrawingUiState {
  const [, bump] = useState(0);
  useEffect(() => api.subscribe(() => bump((n) => n + 1)), [api]);
  return api.ui();
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

/** a toolbar group: its last used tool, and a flyout with every tool of the group in sections */
function Group({ group, ui, api }: { group: (typeof TOOL_GROUPS)[number]; ui: DrawingUiState; api: DrawingApi }) {
  const tools = group.tools;
  const fav = useStore((s) => s.favTools);
  const toggleFav = useStore((s) => s.toggleFavTool);
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
  // beside the button, moved up when it would leave the window
  const want = Math.min(560, window.innerHeight - 16);
  const top = rect ? (rect.top + want > window.innerHeight - 8 ? Math.max(8, window.innerHeight - 8 - want) : rect.top) : 0;
  return (
    <div ref={ref} className="relative">
      <ToolButton active={active} title={`${TOOLS[current].name} — ${TOOLS[current].hint}`} onClick={() => (active ? setOpen(!open) : pick(current))}>
        <ToolIcon id={current} />
      </ToolButton>
      <button
        type="button"
        aria-label={`${group.name}: ابزارهای دیگر`}
        title={group.name}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="absolute bottom-0 right-0 h-3 w-3 text-faint hover:text-ink"
      >
        <svg width="8" height="8" viewBox="0 0 8 8" className="absolute bottom-0.5 right-0.5">
          <path d="M8 0v8H0z" fill="currentColor" />
        </svg>
      </button>
      {open &&
        rect &&
        createPortal(
          <div
            ref={menu}
            className="anim-pop fixed z-50 w-80 overflow-y-auto overscroll-contain rounded-xl border border-line bg-surface p-1 shadow-pop"
            style={{ left: rect.right + 8, top, maxHeight: want }}
            dir="rtl"
            role="menu"
            aria-label={group.name}
          >
            {group.sections.map((sec) => (
              <div key={sec.name} className="py-0.5">
                {group.sections.length > 1 && <p className="px-2 pb-0.5 pt-1.5 text-[11px] font-bold text-faint">{sec.name}</p>}
                {sec.tools.map((t) => {
                  const starred = fav.includes(t);
                  return (
                    <div key={t} className={clsx('group/row flex items-center rounded-lg hover:bg-raised', ui.tool === t && 'bg-accent/10 text-accent-ink')}>
                      <button type="button" role="menuitem" onClick={() => pick(t)} className="flex min-w-0 flex-1 items-center gap-2.5 px-2 py-1.5 text-start text-[13px]">
                        <span className="text-muted" dir="ltr">
                          <ToolIcon id={t} />
                        </span>
                        <span className="min-w-0 flex-1 truncate">{TOOLS[t].name}</span>
                        <span className="max-w-[6.5rem] truncate text-[11px] text-faint" dir="ltr">
                          {TOOLS[t].hint.split(' · ')[0]}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFav(t)}
                        aria-pressed={starred}
                        aria-label={starred ? `حذف ${TOOLS[t].name} از ابزارهای محبوب` : `افزودن ${TOOLS[t].name} به ابزارهای محبوب`}
                        title={starred ? 'حذف از محبوب‌ها' : 'افزودن به محبوب‌ها'}
                        data-fav-star={t}
                        className={clsx(
                          'me-1 grid h-7 w-7 shrink-0 place-items-center rounded-md transition hover:bg-surface',
                          starred ? 'text-amber' : 'text-faint opacity-0 focus-visible:opacity-100 group-hover/row:opacity-100',
                        )}
                      >
                        <Star size={15} className={starred ? 'fill-current' : undefined} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

/** the drawings of this symbol, top first: select, show / hide, lock, delete */
function DrawingsList({ api, ui }: { api: DrawingApi; ui: DrawingUiState }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLSpanElement>(null);
  const items = api.list().slice().reverse();
  return (
    <div>
      <span ref={btn} className="block">
        <ToolButton active={open} title="فهرست رسم‌ها" onClick={() => setOpen(!open)} className={clsx(!ui.count && 'opacity-40')}>
          <ListTree size={18} strokeWidth={1.7} />
        </ToolButton>
      </span>
      {open && (
        <FloatingPanel anchor={btn} onClose={() => setOpen(false)} className="w-72 p-1" side="right">
          <p className="px-2 pb-1 pt-1 text-[12px] font-bold text-faint">رسم‌های این نماد ({ui.count.toLocaleString('fa-IR')})</p>
          {!items.length && <p className="px-2 py-4 text-center text-[13px] text-muted">هنوز رسمی نکشیده‌اید.</p>}
          <ul className="max-h-80 overflow-y-auto">
            {items.map((d) => (
              <li key={d.id} className={clsx('flex items-center gap-1 rounded-lg px-1.5 py-1 hover:bg-raised', ui.selected?.id === d.id && 'bg-accent/10')}>
                <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-start text-[13px]" onClick={() => api.select(d.id)}>
                  <span className={clsx('shrink-0', d.hidden ? 'text-faint' : 'text-muted')} dir="ltr" style={{ color: d.hidden ? undefined : d.color }}>
                    <ToolIcon id={d.type} size={18} />
                  </span>
                  <span
                    className={clsx('min-w-0 truncate', d.hidden && 'text-faint line-through', d.hiddenOn?.includes(ui.tfGroup) && 'text-faint')}
                    title={d.hiddenOn?.includes(ui.tfGroup) ? 'در این تایم‌فریم نمایش داده نمی‌شود (تنظیمات › نمایش)' : undefined}
                  >
                    {TOOLS[d.type].name}
                    {d.text ? ` · ${d.text.split('\n')[0].slice(0, 24)}` : ''}
                  </span>
                </button>
                <button
                  type="button"
                  className="icon-btn h-7 w-7"
                  title={d.hidden ? 'نمایش' : 'پنهان کردن'}
                  aria-label={d.hidden ? 'نمایش' : 'پنهان کردن'}
                  onClick={() => api.update(d.id, { hidden: d.hidden ? undefined : true })}
                >
                  {d.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  type="button"
                  className={clsx('icon-btn h-7 w-7', d.locked && 'text-accent-ink')}
                  title={d.locked ? 'باز کردن قفل' : 'قفل'}
                  aria-label={d.locked ? 'باز کردن قفل' : 'قفل'}
                  onClick={() => api.update(d.id, { locked: d.locked ? undefined : true })}
                >
                  {d.locked ? <Lock size={14} /> : <LockOpen size={14} />}
                </button>
                <button type="button" className="icon-btn h-7 w-7 hover:text-loss" title="حذف" aria-label="حذف" onClick={() => api.remove(d.id)}>
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </FloatingPanel>
      )}
    </div>
  );
}

/** shows or hides the floating favorites bar (FavoritesBar) */
function FavoritesToggle() {
  const count = useFavTools().length;
  const hidden = useFavBar((s) => s.hidden);
  const set = useFavBar((s) => s.set);
  const shown = count > 0 && !hidden;
  return (
    <ToolButton
      active={shown}
      title={
        count
          ? hidden
            ? 'نمایش نوار ابزارهای محبوب'
            : 'پنهان کردن نوار ابزارهای محبوب'
          : 'ابزارهای محبوب: در منوی هر گروه، ستاره‌ی کنار ابزار را بزنید تا در نواری روی چارت بیاید'
      }
      onClick={() => count && set({ hidden: !hidden })}
      className={clsx(!count && 'opacity-50')}
    >
      <Star size={18} strokeWidth={1.7} className={shown ? 'fill-current' : undefined} />
    </ToolButton>
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
        <Group key={g.id} group={g} ui={ui} api={api} />
      ))}
      <FavoritesToggle />
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
      <DrawingsList api={api} ui={ui} />
      <ToolButton title="برگرداندن (Ctrl+Z)" onClick={() => api.undo()} className={!ui.canUndo ? 'pointer-events-none opacity-40' : undefined}>
        <Undo2 size={18} strokeWidth={1.7} />
      </ToolButton>
      <ToolButton title="انجام دوباره (Ctrl+Y)" onClick={() => api.redo()} className={!ui.canRedo ? 'pointer-events-none opacity-40' : undefined}>
        <Redo2 size={18} strokeWidth={1.7} />
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
const TEXT_TOOLS = new Set<DrawingType>(['text', 'anchoredtext', 'note', 'pin', 'callout', 'comment', 'signpost']);
const PLACEHOLDERS = new Set(['متن', 'یادداشت', 'توضیح', 'دیدگاه', 'تابلو', 'سنجاق']);

/** style patch that keeps an old drawing's original look for every other setting */
function stylePatch(d: Drawing, p: Partial<DrawingStyle>): Partial<Drawing> {
  const full = withDefaults(d);
  return { style: { ...full.style, ...p }, levels: full.levels, levels2: full.levels2, levels3: full.levels3, width: full.width };
}

function BarButton({ title, onClick, children, className, active }: { title: string; onClick: () => void; children: ReactNode; className?: string; active?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      className={clsx('grid h-7 w-7 shrink-0 place-items-center rounded-md', active ? 'text-accent-ink' : 'text-muted hover:bg-raised hover:text-ink', className)}
    >
      {children}
    </button>
  );
}

/** Floating bar over the chart for the selected drawing: colour, width, style, text, settings, copy, order, lock, delete. */
export function SelectedDrawingBar({ api }: { api: DrawingApi }) {
  const ui = useUi(api);
  const d = ui.selected;
  const textRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [menu, setMenu] = useState<'dash' | 'more' | null>(null);
  const dashRef = useRef<HTMLButtonElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setText(d?.text ?? '');
    setMenu(null);
    // a new text drawing: type straight away
    if (d && TEXT_TOOLS.has(d.type) && d.text && PLACEHOLDERS.has(d.text)) setTimeout(() => textRef.current?.select(), 0);
  }, [d?.id]);
  const settings = ui.settings && <DrawingSettings key={ui.settings} api={api} id={ui.settings} />;
  if (!d) return <>{settings}</>;
  const spec = TOOL_SPECS[d.type];
  const colored = !['long', 'short', 'measure'].includes(d.type);
  const hasLine = spec.line && colored;
  const dash = (styleOf(d, 'dash') ?? 'solid') as LineDash;
  const isText = TEXT_TOOLS.has(d.type);
  return (
    <>
      {/* centred by the wrapper: the pop-in animation's transform would undo a translate on the bar itself */}
      <div className="pointer-events-none absolute inset-x-2 top-2 z-20 flex justify-center">
        <div
          className="anim-pop pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-line bg-surface/95 px-2 py-1 shadow-pop backdrop-blur [scrollbar-width:none]"
          dir="ltr"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span className="hidden shrink-0 px-1 text-[12px] font-semibold text-muted sm:inline" dir="rtl">
            {TOOLS[d.type].name}
          </span>
          {colored && (
            <div className="flex items-center gap-0.5 border-l border-line/70 pl-1.5">
              <ColorButton size="sm" value={d.color} label="رنگ" onChange={(c) => api.updateSelected({ color: c })} />
            </div>
          )}
          {isText && (
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
          )}
          {d.type === 'text' ? (
            <div className="flex items-center gap-0.5 border-l border-line/70 pl-1.5">
              {[1, 2, 3, 4].map((w) => (
                <button
                  key={w}
                  type="button"
                  title={SIZES[w - 1]}
                  onClick={() => api.updateSelected(d.style?.fontSize ? { width: w, style: { ...d.style, fontSize: undefined } } : { width: w })}
                  className={clsx(
                    'grid h-6 w-6 place-items-center rounded-md font-bold',
                    d.width === w && !d.style?.fontSize ? 'bg-accent/15 text-accent-ink' : 'text-muted hover:bg-raised',
                  )}
                  style={{ fontSize: 9 + w * 2 }}
                >
                  A
                </button>
              ))}
            </div>
          ) : (
            hasLine && (
              <div className="flex items-center gap-0.5 border-l border-line/70 pl-1.5">
                {[1, 2, 3, 4].map((w) => (
                  <button
                    key={w}
                    type="button"
                    title={`ضخامت ${w}`}
                    aria-label={`ضخامت ${w}`}
                    onClick={() => api.updateSelected(d.type === 'fib' && !d.style ? { ...stylePatch(d, {}), width: w } : { width: w })}
                    className={clsx('grid h-6 w-6 place-items-center rounded-md', d.width === w ? 'bg-accent/15' : 'hover:bg-raised')}
                  >
                    <span className="block w-3.5 rounded-full bg-current text-ink" style={{ height: w }} />
                  </button>
                ))}
                <button
                  ref={dashRef}
                  type="button"
                  title="سبک خط"
                  aria-label="سبک خط"
                  aria-expanded={menu === 'dash'}
                  onClick={() => setMenu(menu === 'dash' ? null : 'dash')}
                  className="flex h-6 items-center gap-0.5 rounded-md px-1 text-ink hover:bg-raised"
                >
                  <DashIcon dash={dash} w={18} />
                  <ChevronDown size={11} className="text-faint" />
                </button>
                {menu === 'dash' && (
                  <FloatingPanel anchor={dashRef} onClose={() => setMenu(null)} className="w-40 p-1">
                    {DASHES.map((x) => (
                      <button
                        key={x.value}
                        type="button"
                        onClick={() => {
                          api.updateSelected(stylePatch(d, { dash: x.value }));
                          setMenu(null);
                        }}
                        className={clsx('flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-[13px] hover:bg-raised', dash === x.value && 'text-accent-ink')}
                      >
                        <span className="text-ink">
                          <DashIcon dash={x.value} w={28} />
                        </span>
                        {x.label}
                      </button>
                    ))}
                  </FloatingPanel>
                )}
              </div>
            )
          )}
          <div className="flex items-center gap-0.5 border-l border-line/70 pl-1.5">
            <BarButton title="تنظیمات (دابل‌کلیک روی رسم)" onClick={() => api.openSettings(d.id)}>
              <Settings2 size={15} />
            </BarButton>
            <BarButton title="کپی (Alt یا Ctrl + کشیدن)" onClick={() => api.clone(d.id)}>
              <Copy size={15} />
            </BarButton>
            <BarButton title={d.locked ? 'باز کردن قفل' : 'قفل (جابه‌جا نشود)'} active={d.locked} onClick={() => api.updateSelected({ locked: d.locked ? undefined : true })}>
              {d.locked ? <Lock size={15} /> : <LockOpen size={15} />}
            </BarButton>
            <button
              ref={moreRef}
              type="button"
              title="بیشتر"
              aria-label="بیشتر"
              aria-expanded={menu === 'more'}
              onClick={() => setMenu(menu === 'more' ? null : 'more')}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted hover:bg-raised hover:text-ink"
            >
              <Ellipsis size={15} />
            </button>
            {menu === 'more' && (
              <FloatingPanel anchor={moreRef} onClose={() => setMenu(null)} className="w-60 p-1">
                {[
                  { label: 'آوردن به جلو', icon: <ArrowUpToLine size={15} />, run: () => api.reorder('front', d.id) },
                  { label: 'یک لایه بالاتر', icon: <ChevronUp size={15} />, run: () => api.reorder('forward', d.id) },
                  { label: 'یک لایه پایین‌تر', icon: <ChevronDown size={15} />, run: () => api.reorder('backward', d.id) },
                  { label: 'بردن به عقب', icon: <ArrowDownToLine size={15} />, run: () => api.reorder('back', d.id) },
                  { label: 'پنهان کردن', icon: <EyeOff size={15} />, run: () => api.update(d.id, { hidden: true }) },
                  {
                    label: 'ذخیره‌ی سبک به‌عنوان پیش‌فرض',
                    icon: <Star size={15} />,
                    run: () => {
                      api.saveAsDefault(d.id);
                      toast(`پیش‌فرض «${TOOLS[d.type].name}» ذخیره شد`);
                    },
                  },
                ].map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => {
                      m.run();
                      setMenu(null);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-start text-[13px] hover:bg-raised"
                  >
                    <span className="text-muted">{m.icon}</span>
                    {m.label}
                  </button>
                ))}
              </FloatingPanel>
            )}
            <BarButton title="حذف (Delete)" onClick={() => api.removeSelected()} className="hover:bg-loss/10 hover:text-loss">
              <Trash2 size={15} />
            </BarButton>
          </div>
        </div>
      </div>
      {settings}
    </>
  );
}

// ---------- indicators ----------
export function IndicatorsDialog({ api, open, onClose, onAdded }: { api: IndicatorApi; open: boolean; onClose: () => void; onAdded?: (id: string, type: IndicatorType) => void }) {
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
                const id = api.add(d.type);
                toast(`${d.nameFa} اضافه شد`);
                onClose();
                onAdded?.(id, d.type);
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
  if (cfg.type === 'sessions') return <SessionsSettings api={api} cfg={cfg} onClose={onClose} />;
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
