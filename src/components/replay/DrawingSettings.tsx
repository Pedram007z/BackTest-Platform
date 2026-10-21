import clsx from 'clsx';
import { Bold, ChevronDown, Italic, Plus, RotateCcw, X } from 'lucide-react';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  DRAWING_COLORS,
  TOOLS,
  TOOL_SPECS,
  clearDefault,
  factoryProps,
  newProps,
  saveDefault,
  styleOf,
  withDefaults,
  type Drawing,
  type DrawingStyle,
  type Level,
  type LevelSetSpec,
  type LineDash,
  type OptionSpec,
  type TfGroup,
} from '../../chart/drawings';
import type { DrawingApi } from '../../chart/lwDrawings';
import { toast, useStore } from '../../store/useStore';
import { tzName, wallTime, wallToUtc } from '../../lib/timezone';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/controls';
import { CheckRow, ColorButton, DASHES, DashIcon, DashPicker, FloatingPanel, NumberField, Seg, WidthPicker } from './drawingControls';

/**
 * TradingView-style settings of one drawing: Style (lines, background, levels and options),
 * Text, Coordinates and Visibility. Every change shows on the chart at once; OK keeps it as one
 * undo step, Cancel puts the drawing back.
 */

type Tab = 'style' | 'text' | 'coords' | 'visibility';

const TEXT_MAIN = new Set(['text', 'anchoredtext', 'note', 'pin', 'callout', 'comment', 'signpost']);
const NO_STYLE = new Set(['long', 'short', 'measure']);
const FONT_SIZES = [10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 40];
const NEXT_DASH: Record<LineDash, LineDash> = { solid: 'dashed', dashed: 'dotted', dotted: 'solid' };

function Row({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex flex-wrap items-center gap-x-3 gap-y-1.5 py-1.5', className)}>
      <span className="w-32 shrink-0 text-[13px] text-muted">{label}</span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function Section({ title, children, extra }: { title: string; children: ReactNode; extra?: ReactNode }) {
  return (
    <section className="border-t border-line/60 pt-3 first:border-t-0 first:pt-0">
      <div className="mb-1 flex items-center gap-2">
        <h3 className="text-[12px] font-bold text-faint">{title}</h3>
        {extra}
      </div>
      {children}
    </section>
  );
}

const pad2 = (n: number) => String(n).padStart(2, '0');
/** A bar time (UTC seconds) as the wall clock in the chart's time zone, for a datetime-local field. */
function toZoneInput(t: number, tz: string) {
  const w = wallTime(t * 1000, tz);
  return `${w.y}-${pad2(w.m)}-${pad2(w.d)}T${pad2(w.hh)}:${pad2(w.mm)}:${pad2(Math.floor(t) % 60)}`;
}
function fromZoneInput(s: string, tz: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  if (!m) return null;
  return Math.round(wallToUtc(+m[1], +m[2], +m[3], +m[4], +m[5], tz) / 1000) + Number(m[6] ?? 0);
}

function TimeField({ value, onChange, label }: { value: number; onChange: (t: number) => void; label: string }) {
  const tz = useStore((s) => s.chartTz);
  return (
    <input
      type="datetime-local"
      step={1}
      dir="ltr"
      aria-label={label}
      title={label}
      className="field num h-8 w-[13.5rem] px-2 py-0 text-[13px]"
      value={toZoneInput(value, tz)}
      onChange={(e) => {
        const t = fromZoneInput(e.target.value, tz);
        if (t !== null) onChange(t);
      }}
      onKeyDown={(e) => e.stopPropagation()}
    />
  );
}

// ---------- levels ----------
function LevelsEditor({
  set,
  levels,
  onChange,
  oneColor,
  defaults,
  lineDash,
}: {
  set: LevelSetSpec;
  levels: Level[];
  onChange: (l: Level[]) => void;
  oneColor: boolean;
  defaults: Level[];
  /** the levels' common line style (a level can have its own) */
  lineDash: LineDash;
}) {
  const [focus, setFocus] = useState<number | null>(null);
  const patch = (i: number, p: Partial<Level>) => onChange(levels.map((l, j) => (j === i ? { ...l, ...p } : l)));
  const add = () => {
    const values = levels.filter((l) => Number.isFinite(l.value)).map((l) => l.value);
    const max = values.length ? Math.max(...values) : 0;
    const next: Level = set.pair
      ? { value: 1, value2: 1, color: DRAWING_COLORS[levels.length % DRAWING_COLORS.length], visible: true }
      : { value: Math.round((max + (max >= 1 ? 1 : 0.25)) * 1000) / 1000, color: DRAWING_COLORS[levels.length % DRAWING_COLORS.length], visible: true };
    onChange([...levels, next]);
    setFocus(levels.length);
  };
  return (
    <div>
      <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
        {levels.map((l, i) => (
          <div key={i} className="flex items-center gap-1.5" dir="ltr">
            <input
              type="checkbox"
              className="h-4 w-4 shrink-0 cursor-pointer accent-[rgb(var(--accent))]"
              checked={l.visible}
              aria-label={`نمایش سطح ${l.value}`}
              onChange={(e) => patch(i, { visible: e.target.checked })}
            />
            <NumberField
              className="w-[4.75rem]"
              value={l.value}
              step={set.pair ? 1 : 0.001}
              label={set.pair ? 'قیمت' : 'مقدار سطح'}
              onChange={(v) => patch(i, { value: v })}
              autoFocus={focus === i}
            />
            {set.pair && (
              <>
                <span className="text-faint">/</span>
                <NumberField className="w-14" value={l.value2 ?? 1} step={1} min={0} label="زمان" onChange={(v) => patch(i, { value2: v })} />
              </>
            )}
            <span className={clsx(oneColor && 'pointer-events-none opacity-40')}>
              <ColorButton size="sm" value={l.color} label="رنگ سطح" onChange={(c) => patch(i, { color: c })} />
            </span>
            <button
              type="button"
              title={`سبک خط: ${DASHES.find((x) => x.value === (l.dash ?? lineDash))?.label}`}
              aria-label="سبک خط سطح"
              onClick={() => patch(i, { dash: NEXT_DASH[l.dash ?? lineDash] })}
              className={clsx('grid h-7 w-8 shrink-0 place-items-center rounded-md hover:bg-raised', l.dash ? 'text-ink' : 'text-faint')}
            >
              <DashIcon dash={l.dash ?? lineDash} w={18} />
            </button>
            <button
              type="button"
              title="حذف سطح"
              aria-label="حذف سطح"
              onClick={() => onChange(levels.filter((_, j) => j !== i))}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-faint hover:bg-loss/10 hover:text-loss"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      {!levels.length && <p className="py-2 text-[12px] text-faint">سطحی نیست؛ یکی اضافه کنید.</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className="btn-soft h-8 px-2.5 text-[12px]" onClick={add}>
          <Plus size={14} />
          افزودن سطح
        </button>
        <button type="button" className="btn-ghost h-8 px-2.5 text-[12px]" onClick={() => onChange(structuredClone(defaults))}>
          <RotateCcw size={14} />
          سطوح پیش‌فرض
        </button>
      </div>
    </div>
  );
}

// ---------- the dialog ----------
export function DrawingSettings({ api, id }: { api: DrawingApi; id: string }) {
  const chartTz = useStore((s) => s.chartTz);
  const start = api.list().find((x) => x.id === id);
  const [d, setD] = useState<Drawing | null>(() => (start ? withDefaults(start) : null));
  const spec = d ? TOOL_SPECS[d.type] : null;
  const textMain = !!d && TEXT_MAIN.has(d.type);
  const tabs = useMemo(() => {
    if (!d || !spec) return [] as { id: Tab; label: string }[];
    const t: { id: Tab; label: string }[] = [];
    if (textMain) t.push({ id: 'text', label: 'متن' });
    else if (!NO_STYLE.has(d.type)) t.push({ id: 'style', label: 'سبک' });
    if (!textMain && spec.text === 'label') t.push({ id: 'text', label: 'متن' });
    t.push({ id: 'coords', label: 'مختصات' }, { id: 'visibility', label: 'نمایش' });
    return t;
  }, [d?.type]);
  const [tab, setTab] = useState<Tab>(tabs[0]?.id ?? 'coords');
  const [templateOpen, setTemplateOpen] = useState(false);
  const templateRef = useRef<HTMLButtonElement>(null);
  if (!d || !spec) return null;

  const set = (next: Drawing) => {
    setD(next);
    api.previewEdit(next);
  };
  const st = <K extends keyof DrawingStyle>(k: K) => styleOf(d, k);
  const setStyle = (p: Partial<DrawingStyle>) => set({ ...d, style: { ...(d.style ?? {}), ...p } });
  const opts = spec.options ?? [];
  const has = (k: keyof DrawingStyle) => opts.some((o) => o.key === k);
  const toggles = new Set((spec.levels ?? []).map((l) => l.toggle).filter(Boolean) as (keyof DrawingStyle)[]);
  const trendRow = has('showTrend');
  const apply = (p: ReturnType<typeof newProps>) =>
    set({
      ...d,
      color: p.color,
      width: p.width,
      style: { ...p.style },
      levels: p.levels && structuredClone(p.levels),
      levels2: p.levels2 && structuredClone(p.levels2),
      levels3: p.levels3 && structuredClone(p.levels3),
    });

  const lineLabel = d.type.includes('pitchfork') || d.type === 'schiff' || d.type === 'modschiff' || d.type === 'pitchfan' ? 'خط میانه' : 'خط';

  const option = (o: OptionSpec) => {
    if (o.key === 'showTrend' || toggles.has(o.key)) return null;
    const v = st(o.key);
    switch (o.kind) {
      case 'bool':
        return <CheckRow key={o.key} label={o.label} checked={!!v} onChange={(c) => setStyle({ [o.key]: c })} />;
      case 'select':
        return (
          <Row key={o.key} label={o.label}>
            {(o.choices?.length ?? 0) <= 3 ? (
              <Seg label={o.label} value={String(v ?? o.choices?.[0]?.value)} options={o.choices ?? []} onChange={(c) => setStyle({ [o.key]: c } as Partial<DrawingStyle>)} />
            ) : (
              <div className="w-56">
                <Select compact value={String(v ?? o.choices?.[0]?.value)} options={o.choices ?? []} onChange={(c) => setStyle({ [o.key]: c } as Partial<DrawingStyle>)} />
              </div>
            )}
          </Row>
        );
      case 'number':
        if (o.key === 'levelWidth')
          return (
            <Row key={o.key} label={o.label}>
              <WidthPicker value={Number(v ?? 1)} onChange={(w) => setStyle({ levelWidth: w })} />
            </Row>
          );
        if (o.key === 'fontSize')
          return (
            <Row key={o.key} label={o.label}>
              <div className="w-24">
                <Select
                  compact
                  value={String(v ?? 11)}
                  options={FONT_SIZES.map((f) => ({ value: String(f), label: String(f) }))}
                  onChange={(f) => setStyle({ fontSize: Number(f) })}
                />
              </div>
            </Row>
          );
        return (
          <Row key={o.key} label={o.label}>
            <NumberField className="w-28" value={Number(v ?? 0)} min={o.min} max={o.max} step={o.step} label={o.label} onChange={(n) => setStyle({ [o.key]: n })} />
          </Row>
        );
      case 'color':
        return (
          <Row key={o.key} label={o.label}>
            <ColorButton value={String(v ?? d.color)} label={o.label} onChange={(c) => setStyle({ [o.key]: c })} />
          </Row>
        );
    }
  };

  const styleTab = (
    <div className="flex flex-col gap-3">
      <Section title="ظاهر">
        {spec.line ? (
          <Row label={trendRow ? 'خط روند' : lineLabel}>
            {trendRow && (
              <input
                type="checkbox"
                aria-label="نمایش خط روند"
                className="h-4 w-4 cursor-pointer accent-[rgb(var(--accent))]"
                checked={st('showTrend') !== false}
                onChange={(e) => setStyle({ showTrend: e.target.checked })}
              />
            )}
            <ColorButton value={d.color} label="رنگ خط" onChange={(c) => set({ ...d, color: c })} />
            <WidthPicker value={d.width} onChange={(w) => set({ ...d, width: w })} />
            <DashPicker value={(st('dash') ?? 'solid') as LineDash} onChange={(x) => setStyle({ dash: x })} />
          </Row>
        ) : (
          <Row label="رنگ">
            <ColorButton value={d.color} label="رنگ" onChange={(c) => set({ ...d, color: c })} />
            {(d.type === 'arrowup' || d.type === 'arrowdown' || d.type === 'flag') && <WidthPicker value={d.width} onChange={(w) => set({ ...d, width: w })} />}
          </Row>
        )}
        {spec.fill && (
          <Row label="پس‌زمینه">
            <input
              type="checkbox"
              aria-label="نمایش پس‌زمینه"
              className="h-4 w-4 cursor-pointer accent-[rgb(var(--accent))]"
              checked={!!st('showFill')}
              onChange={(e) => setStyle({ showFill: e.target.checked })}
            />
            {!spec.levels && <ColorButton value={st('fill') ?? d.color} label="رنگ پس‌زمینه" onChange={(c) => setStyle({ fill: c })} />}
            <input
              type="range"
              min={0}
              max={100}
              aria-label="شفافیت پس‌زمینه"
              title="پررنگی پس‌زمینه"
              className="slider w-32"
              style={{ ['--fill' as string]: `${Math.round((st('fillOpacity') ?? 0.15) * 100)}%` }}
              value={Math.round((st('fillOpacity') ?? 0.15) * 100)}
              onChange={(e) => setStyle({ fillOpacity: Number(e.target.value) / 100 })}
            />
            <span className="num w-10 text-[12px] text-faint" dir="ltr">
              {Math.round((st('fillOpacity') ?? 0.15) * 100)}%
            </span>
          </Row>
        )}
        {spec.extend && (
          <Row label="ادامه‌ی خط">
            <CheckRow label="به چپ" checked={!!st('extendLeft')} onChange={(c) => setStyle({ extendLeft: c })} />
            <CheckRow label="به راست" checked={!!st('extendRight')} onChange={(c) => setStyle({ extendRight: c })} />
          </Row>
        )}
        {spec.arrows && (
          <Row label="سر پیکان">
            <CheckRow label="ابتدا" checked={!!st('arrowStart')} onChange={(c) => setStyle({ arrowStart: c })} />
            <CheckRow label="انتها" checked={!!st('arrowEnd')} onChange={(c) => setStyle({ arrowEnd: c })} />
          </Row>
        )}
      </Section>
      {spec.levels?.map((set_) => {
        const on = set_.toggle ? st(set_.toggle) !== false : true;
        return (
          <Section
            key={set_.key}
            title={set_.name}
            extra={
              set_.toggle && (
                <input
                  type="checkbox"
                  aria-label={`نمایش ${set_.name}`}
                  className="h-4 w-4 cursor-pointer accent-[rgb(var(--accent))]"
                  checked={on}
                  onChange={(e) => setStyle({ [set_.toggle!]: e.target.checked })}
                />
              )
            }
          >
            <div className={clsx(!on && 'pointer-events-none opacity-50')}>
              <LevelsEditor
                set={set_}
                levels={d[set_.key] ?? []}
                oneColor={!!st('oneColor')}
                defaults={factoryProps(d.type)[set_.key] ?? []}
                lineDash={(st('levelDash') ?? 'solid') as LineDash}
                onChange={(l) => set({ ...d, [set_.key]: l })}
              />
            </div>
          </Section>
        );
      })}
      {opts.some((o) => o.key !== 'showTrend' && !toggles.has(o.key)) && (
        <Section title="گزینه‌ها">
          <div className="grid gap-x-6 sm:grid-cols-2">{opts.filter((o) => o.kind === 'bool').map(option)}</div>
          {opts.filter((o) => o.kind !== 'bool').map(option)}
          {st('oneColor') && (
            <Row label="رنگ سطوح">
              <ColorButton value={d.color} label="رنگ همه‌ی سطوح" onChange={(c) => set({ ...d, color: c })} />
            </Row>
          )}
        </Section>
      )}
    </div>
  );

  const size = d.type === 'text' ? (d.style?.fontSize ?? [12, 14, 18, 24][Math.max(0, Math.min(3, d.width - 1))]) : (st('fontSize') ?? 14);
  const textColorIsMain = d.type === 'text' || d.type === 'anchoredtext';
  const boxed = d.type === 'comment' || d.type === 'callout' || d.type === 'signpost';
  const textTab = (
    <div className="flex flex-col gap-1">
      <textarea
        className="field min-h-[96px] resize-y text-[14px] leading-7"
        dir="auto"
        aria-label="متن"
        placeholder={textMain ? 'متن' : 'متن روی رسم (اختیاری)'}
        value={d.text ?? ''}
        onChange={(e) => set({ ...d, text: e.target.value })}
        onKeyDown={(e) => e.stopPropagation()}
      />
      <Row label="قلم">
        <div className="w-24">
          <Select compact value={String(size)} options={FONT_SIZES.map((s) => ({ value: String(s), label: String(s) }))} onChange={(v) => setStyle({ fontSize: Number(v) })} />
        </div>
        <button
          type="button"
          aria-pressed={!!st('bold')}
          title="درشت"
          aria-label="درشت"
          onClick={() => setStyle({ bold: !st('bold') })}
          className={clsx('icon-btn h-8 w-8', st('bold') && 'bg-accent/15 text-accent-ink')}
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          aria-pressed={!!st('italic')}
          title="کج"
          aria-label="کج"
          onClick={() => setStyle({ italic: !st('italic') })}
          className={clsx('icon-btn h-8 w-8', st('italic') && 'bg-accent/15 text-accent-ink')}
        >
          <Italic size={16} />
        </button>
      </Row>
      {textMain && d.type !== 'note' && d.type !== 'pin' && (
        <Row label="رنگ متن">
          {textColorIsMain ? (
            <ColorButton value={d.color} label="رنگ متن" onChange={(c) => set({ ...d, color: c })} />
          ) : (
            <ColorButton value={st('textColor') ?? '#ffffff'} label="رنگ متن" onChange={(c) => setStyle({ textColor: c })} />
          )}
        </Row>
      )}
      {!textMain && (
        <Row label="رنگ متن">
          <ColorButton value={st('textColor') ?? d.color} label="رنگ متن" onChange={(c) => setStyle({ textColor: c })} />
        </Row>
      )}
      {(d.type === 'note' || d.type === 'pin') && (
        <Row label="رنگ نشانه">
          <ColorButton value={d.color} label="رنگ نشانه" onChange={(c) => set({ ...d, color: c })} />
        </Row>
      )}
      {boxed && (
        <Row label="رنگ کادر">
          <ColorButton value={st('textBg') ?? d.color} label="رنگ کادر" onChange={(c) => setStyle({ textBg: c })} />
          {d.type === 'callout' && <ColorButton value={d.color} label="رنگ حاشیه" onChange={(c) => set({ ...d, color: c })} />}
        </Row>
      )}
      {textColorIsMain && (
        <>
          <Row label="پس‌زمینه">
            <input
              type="checkbox"
              aria-label="پس‌زمینه‌ی متن"
              className="h-4 w-4 cursor-pointer accent-[rgb(var(--accent))]"
              checked={!!st('showTextBg')}
              onChange={(e) => setStyle({ showTextBg: e.target.checked })}
            />
            <ColorButton value={st('textBg') ?? d.color} label="رنگ پس‌زمینه" onChange={(c) => setStyle({ textBg: c, showTextBg: true })} />
          </Row>
          <Row label="حاشیه">
            <input
              type="checkbox"
              aria-label="حاشیه‌ی متن"
              className="h-4 w-4 cursor-pointer accent-[rgb(var(--accent))]"
              checked={!!st('showTextBorder')}
              onChange={(e) => setStyle({ showTextBorder: e.target.checked })}
            />
            <ColorButton value={st('textBorder') ?? d.color} label="رنگ حاشیه" onChange={(c) => setStyle({ textBorder: c, showTextBorder: true })} />
          </Row>
        </>
      )}
      {spec.text === 'label' && (
        <>
          <Row label="جای عمودی">
            <Seg
              label="جای عمودی"
              value={st('textV') ?? (['rect', 'circle', 'ellipse', 'rotrect', 'triangle'].includes(d.type) ? 'middle' : 'top')}
              options={[
                { value: 'top', label: 'بالا' },
                { value: 'middle', label: 'وسط' },
                { value: 'bottom', label: 'پایین' },
              ]}
              onChange={(v) => setStyle({ textV: v })}
            />
          </Row>
          <Row label="جای افقی">
            <Seg
              label="جای افقی"
              value={st('textH') ?? (d.type === 'hline' || d.type === 'hray' ? 'right' : 'center')}
              options={[
                { value: 'left', label: 'چپ' },
                { value: 'center', label: 'وسط' },
                { value: 'right', label: 'راست' },
              ]}
              onChange={(v) => setStyle({ textH: v })}
            />
          </Row>
        </>
      )}
    </div>
  );

  // ---------- coordinates ----------
  const setPoint = (i: number, p: { time?: number; price?: number }) => set({ ...d, points: d.points.map((q, j) => (j === i ? { ...q, ...p } : q)) });
  const digits = api.ui().digits;
  const priceField = (value: number, onChange: (v: number) => void, label: string) => (
    <NumberField className="w-32" value={Number(value.toFixed(digits))} step={10 ** -digits} label={label} onChange={onChange} />
  );
  const coordsTab = (() => {
    if (d.type === 'brush' || d.type === 'highlighter') return <p className="py-4 text-[13px] leading-7 text-muted">این رسم آزاد است؛ برای جابه‌جایی آن را روی چارت بکشید.</p>;
    if (d.type === 'anchoredtext') {
      const a = d.anchor ?? { x: 0.5, y: 0.2 };
      return (
        <div>
          <p className="mb-2 text-[12px] text-faint">جای متن روی صفحه (درصد از چپ و از بالا)؛ با جابه‌جایی چارت حرکت نمی‌کند.</p>
          <Row label="از چپ ٪">
            <NumberField
              className="w-24"
              value={Math.round(a.x * 1000) / 10}
              min={0}
              max={100}
              step={1}
              label="از چپ"
              onChange={(v) => set({ ...d, anchor: { ...a, x: v / 100 } })}
            />
          </Row>
          <Row label="از بالا ٪">
            <NumberField
              className="w-24"
              value={Math.round(a.y * 1000) / 10}
              min={0}
              max={100}
              step={1}
              label="از بالا"
              onChange={(v) => set({ ...d, anchor: { ...a, y: v / 100 } })}
            />
          </Row>
        </div>
      );
    }
    if (d.type === 'long' || d.type === 'short') {
      return (
        <div>
          <Row label="قیمت ورود">{priceField(d.points[0].price, (v) => set({ ...d, points: d.points.map((q) => ({ ...q, price: v })) }), 'قیمت ورود')}</Row>
          <Row label="حد ضرر">{priceField(d.stop ?? d.points[0].price, (v) => set({ ...d, stop: v }), 'حد ضرر')}</Row>
          <Row label="حد سود">{priceField(d.target ?? d.points[0].price, (v) => set({ ...d, target: v }), 'حد سود')}</Row>
          <Row label={`زمان شروع (${tzName(chartTz)})`}>
            <TimeField value={d.points[0].time} label="زمان شروع" onChange={(t) => setPoint(0, { time: api.snapTime(t) })} />
          </Row>
          <Row label={`زمان پایان (${tzName(chartTz)})`}>
            <TimeField value={d.points[1].time} label="زمان پایان" onChange={(t) => setPoint(1, { time: api.snapTime(t) })} />
          </Row>
        </div>
      );
    }
    const onlyFirst = d.type === 'barspattern';
    const noPrice = d.type === 'vline' || d.type === 'regression';
    const noTime = d.type === 'hline';
    const pts = onlyFirst ? d.points.slice(0, 1) : d.points;
    return (
      <div className="flex flex-col">
        <p className="mb-1 text-[12px] text-faint">زمان‌ها به وقت {tzName(chartTz)} (منطقه‌ی زمانی زیر چارت) و روی نزدیک‌ترین کندل می‌نشینند.</p>
        {pts.map((p, i) => (
          <Row key={i} label={spec.labels?.[i] ? `نقطه‌ی ${spec.labels[i]}` : `نقطه‌ی ${(i + 1).toLocaleString('fa-IR')}`}>
            {!noPrice && priceField(p.price, (v) => setPoint(i, { price: v }), `قیمت نقطه‌ی ${i + 1}`)}
            {!noTime && <TimeField value={p.time} label={`زمان نقطه‌ی ${i + 1}`} onChange={(t) => setPoint(i, { time: api.snapTime(t) })} />}
          </Row>
        ))}
      </div>
    );
  })();

  // ---------- visibility ----------
  const groups: { id: TfGroup; label: string; hint: string }[] = [
    { id: 's', label: 'ثانیه‌ای', hint: '1s – 30s' },
    { id: 'm', label: 'دقیقه‌ای', hint: '1m – 30m' },
    { id: 'h', label: 'ساعتی', hint: '1h – 4h' },
    { id: 'd', label: 'روزانه و بیشتر', hint: 'D' },
  ];
  const hiddenOn = d.hiddenOn ?? [];
  const current = api.ui().tfGroup;
  const visibilityTab = (
    <div className="flex flex-col gap-1">
      <p className="mb-1 text-[12px] text-faint">این رسم در کدام تایم‌فریم‌ها دیده شود؟</p>
      {groups.map((g) => (
        <CheckRow
          key={g.id}
          label={g.label}
          checked={!hiddenOn.includes(g.id)}
          onChange={(c) => {
            const next = c ? hiddenOn.filter((x) => x !== g.id) : [...hiddenOn, g.id];
            set({ ...d, hiddenOn: next.length ? next : undefined });
          }}
        >
          <span className="num text-[11px] text-faint" dir="ltr">
            {g.hint}
          </span>
          {g.id === current && <span className="chip">تایم‌فریم فعلی</span>}
        </CheckRow>
      ))}
      <div className="mt-2 border-t border-line/60 pt-2">
        <CheckRow label="پنهان کردن این رسم (از فهرست رسم‌ها دوباره نمایان می‌شود)" checked={!!d.hidden} onChange={(c) => set({ ...d, hidden: c || undefined })} />
        <CheckRow label="قفل (جابه‌جا نشود)" checked={!!d.locked} onChange={(c) => set({ ...d, locked: c || undefined })} />
      </div>
    </div>
  );

  const name = TOOLS[d.type];
  return (
    <Modal
      open
      onClose={() => api.cancelEdit()}
      size="lg"
      title={
        <span className="flex items-baseline gap-2">
          {name.name}
          <span className="text-[12px] font-normal text-faint" dir="ltr">
            {name.hint.split(' · ')[0]}
          </span>
        </span>
      }
      footer={
        <>
          <div className="me-auto">
            <button ref={templateRef} type="button" className="btn-ghost" onClick={() => setTemplateOpen((o) => !o)} aria-expanded={templateOpen}>
              قالب
              <ChevronDown size={14} />
            </button>
            {templateOpen && (
              <FloatingPanel anchor={templateRef} onClose={() => setTemplateOpen(false)} className="w-72 p-1">
                {[
                  {
                    label: 'ذخیره به‌عنوان پیش‌فرض این ابزار',
                    hint: 'رسم‌های بعدیِ این ابزار با همین تنظیمات کشیده می‌شوند',
                    run: () => {
                      saveDefault(d);
                      toast(`پیش‌فرض «${name.name}» ذخیره شد`);
                    },
                  },
                  { label: 'اعمال پیش‌فرض', hint: 'تنظیمات پیش‌فرض روی همین رسم', run: () => apply(newProps(d.type)) },
                  {
                    label: 'بازگشت به تنظیمات اولیه',
                    hint: 'پیش‌فرض ذخیره‌شده پاک و تنظیمات کارخانه اعمال می‌شود',
                    run: () => {
                      clearDefault(d.type);
                      apply(factoryProps(d.type));
                      toast(`پیش‌فرض «${name.name}» به حالت اولیه برگشت`);
                    },
                  },
                ].map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => {
                      m.run();
                      setTemplateOpen(false);
                    }}
                    className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-start hover:bg-raised"
                  >
                    <span className="text-[13px] font-semibold">{m.label}</span>
                    <span className="text-[11px] text-faint">{m.hint}</span>
                  </button>
                ))}
              </FloatingPanel>
            )}
          </div>
          <button type="button" className="btn-ghost" onClick={() => api.cancelEdit()}>
            انصراف
          </button>
          <button type="button" className="btn-primary" data-autofocus onClick={() => api.commitEdit()}>
            تأیید
          </button>
        </>
      }
    >
      <div className="-mt-2 mb-4 flex gap-1 border-b border-line/70" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              '-mb-px border-b-2 px-3 py-2 text-[13px] font-semibold transition',
              tab === t.id ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'style' && styleTab}
      {tab === 'text' && textTab}
      {tab === 'coords' && coordsTab}
      {tab === 'visibility' && visibilityTab}
    </Modal>
  );
}
