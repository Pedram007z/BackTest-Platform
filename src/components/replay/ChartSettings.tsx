import clsx from 'clsx';
import { Check, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CHART_PRESETS, FONT_SIZES, resolveChartStyle, withOpacity, type ChartStyle, type ChartStyleOverrides } from '../../chart/style';
import { faDigits } from '../../lib/format';
import { useStore } from '../../store/useStore';
import { Modal } from '../ui/Modal';
import { CheckRow, ColorButton, Seg } from './drawingControls';

type Tab = 'candles' | 'canvas' | 'presets';
const TABS: { id: Tab; label: string }[] = [
  { id: 'candles', label: 'کندل‌ها' },
  { id: 'canvas', label: 'پس‌زمینه و مقیاس' },
  { id: 'presets', label: 'قالب‌های آماده' },
];

/** A few made-up candles in the given colours, so the effect shows inside the window too. */
function Preview({ st, className, wide }: { st: ChartStyle; className?: string; wide?: boolean }) {
  const id = useRef(`g${Math.random().toString(36).slice(2, 8)}`).current;
  const bars: [number, number, number, number][] = [
    [60, 40, 70, 30],
    [40, 52, 58, 34],
    [52, 30, 56, 24],
    [30, 46, 50, 26],
    [46, 62, 68, 42],
    [62, 50, 66, 44],
    [50, 70, 76, 48],
    [70, 58, 74, 52],
  ];
  const grid = withOpacity(st.gridColor, st.gridOpacity);
  const y = (v: number) => 92 - v;
  // the wide one (top of the window) has twice the candles and fills its frame
  const all = wide ? [...bars, ...bars.map(([o, c, h, l]) => [o + 8, c + 8, h + 8, l + 8] as [number, number, number, number])] : bars;
  const W = 30 + all.length * 22;
  return (
    <svg viewBox={`0 0 ${W} 100`} preserveAspectRatio={wide ? 'none' : 'xMidYMid meet'} className={clsx('block w-full rounded-xl border border-line', className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={st.bg} />
          <stop offset="1" stopColor={st.bgType === 'gradient' ? st.bg2 : st.bg} />
        </linearGradient>
      </defs>
      <rect width={W} height="100" fill={`url(#${id})`} />
      {st.horzGrid && [20, 45, 70].map((g) => <line key={g} x1="0" x2={W} y1={g} y2={g} stroke={grid} strokeWidth="0.8" />)}
      {st.vertGrid && Array.from({ length: Math.floor(W / 50) }, (_, i) => 40 + i * 50).map((g) => <line key={g} y1="0" y2="100" x1={g} x2={g} stroke={grid} strokeWidth="0.8" />)}
      {all.map(([o, c, h, l], i) => {
        const up = c >= o;
        const x = 20 + i * 22;
        const top = y(Math.max(o, c));
        const hgt = Math.max(1.5, Math.abs(c - o));
        return (
          <g key={i}>
            {st.wick && <line x1={x} x2={x} y1={y(h)} y2={y(l)} stroke={up ? st.wickUpColor : st.wickDownColor} strokeWidth="1.2" />}
            <rect
              x={x - 6}
              y={top}
              width="12"
              height={hgt}
              fill={st.body ? (up ? st.upColor : st.downColor) : 'none'}
              stroke={st.borders ? (up ? st.borderUpColor : st.borderDownColor) : 'none'}
              strokeWidth="1.2"
            />
          </g>
        );
      })}
      {!wide && (
        <text x={W - 6} y="96" textAnchor="end" fontSize={st.fontSize * 0.75} fill={st.textColor} fontFamily="sans-serif">
          1.0850
        </text>
      )}
    </svg>
  );
}

/** Up and down colours side by side, with a checkbox for the part (body, border, wick). */
function PartRow({
  label,
  on,
  onToggle,
  up,
  down,
  onUp,
  onDown,
}: {
  label: string;
  on: boolean;
  onToggle: (v: boolean) => void;
  up: string;
  down: string;
  onUp: (c: string) => void;
  onDown: (c: string) => void;
}) {
  return (
    <CheckRow checked={on} onChange={onToggle} label={label}>
      <div className={clsx('flex items-center gap-2', !on && 'pointer-events-none opacity-40')}>
        <span className="text-[11px] text-faint">صعودی</span>
        <ColorButton value={up} onChange={onUp} label={`${label} صعودی`} />
        <span className="ms-2 text-[11px] text-faint">نزولی</span>
        <ColorButton value={down} onChange={onDown} label={`${label} نزولی`} />
      </div>
    </CheckRow>
  );
}

/**
 * «تنظیمات چارت»: the chart's colours, like TradingView's chart settings. Changes show on the chart at once;
 * «تأیید» keeps them (saved with the account), «انصراف» puts back what there was.
 */
export function ChartSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const theme = useStore((s) => s.theme);
  const changes = useStore((s) => s.chartStyle);
  const setChanges = useStore((s) => s.setChartStyle);
  const [tab, setTab] = useState<Tab>('candles');
  const before = useRef<ChartStyleOverrides>(changes);
  useEffect(() => {
    if (open) {
      before.current = useStore.getState().chartStyle;
      setTab('candles');
    }
  }, [open]);

  const st = resolveChartStyle(theme, changes);
  const set = (patch: Partial<ChartStyle>) => setChanges({ ...changes, ...patch });
  const cancel = () => {
    setChanges(before.current);
    onClose();
  };

  const candlesTab = (
    <div className="flex flex-col gap-1">
      <PartRow
        label="بدنه"
        on={st.body}
        onToggle={(body) => set({ body })}
        up={st.upColor}
        down={st.downColor}
        onUp={(upColor) => set({ upColor })}
        onDown={(downColor) => set({ downColor })}
      />
      <PartRow
        label="حاشیه"
        on={st.borders}
        onToggle={(borders) => set({ borders })}
        up={st.borderUpColor}
        down={st.borderDownColor}
        onUp={(borderUpColor) => set({ borderUpColor })}
        onDown={(borderDownColor) => set({ borderDownColor })}
      />
      <PartRow
        label="فتیله (سایه)"
        on={st.wick}
        onToggle={(wick) => set({ wick })}
        up={st.wickUpColor}
        down={st.wickDownColor}
        onUp={(wickUpColor) => set({ wickUpColor })}
        onDown={(wickDownColor) => set({ wickDownColor })}
      />
      <button
        type="button"
        className="btn-ghost mt-1 w-fit px-2 py-1 text-[12px]"
        onClick={() => set({ borderUpColor: st.upColor, borderDownColor: st.downColor, wickUpColor: st.upColor, wickDownColor: st.downColor })}
      >
        هم‌رنگ کردن حاشیه و فتیله با بدنه
      </button>
    </div>
  );

  const canvasTab = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-28 text-[13px]">پس‌زمینه</span>
        <Seg
          label="نوع پس‌زمینه"
          value={st.bgType}
          options={[
            { value: 'solid', label: 'یک‌رنگ' },
            { value: 'gradient', label: 'گرادیان' },
          ]}
          onChange={(bgType) => set({ bgType, bg2: changes.bg2 ?? st.bg })}
        />
        <ColorButton value={st.bg} onChange={(bg) => set(st.bgType === 'solid' ? { bg, bg2: bg } : { bg })} label={st.bgType === 'gradient' ? 'رنگ بالا' : 'رنگ پس‌زمینه'} />
        {st.bgType === 'gradient' && <ColorButton value={st.bg2} onChange={(bg2) => set({ bg2 })} label="رنگ پایین" />}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="w-28 text-[13px]">خطوط شبکه</span>
        <CheckRow checked={st.vertGrid} onChange={(vertGrid) => set({ vertGrid })} label="عمودی" />
        <CheckRow checked={st.horzGrid} onChange={(horzGrid) => set({ horzGrid })} label="افقی" />
        <ColorButton value={st.gridColor} onChange={(gridColor) => set({ gridColor })} label="رنگ خطوط شبکه" />
        <label className="flex items-center gap-2 text-[12px] text-muted">
          شفافیت
          <input
            type="range"
            min={0}
            max={100}
            value={st.gridOpacity}
            onChange={(e) => set({ gridOpacity: Number(e.target.value) })}
            className="w-28 accent-[rgb(var(--accent))]"
            aria-label="شفافیت خطوط شبکه"
          />
          <span className="num w-8">{faDigits(String(st.gridOpacity))}٪</span>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-28 text-[13px]">متن مقیاس‌ها</span>
        <ColorButton value={st.textColor} onChange={(textColor) => set({ textColor })} label="رنگ متن مقیاس‌ها" />
        <select className="field h-8 w-20 py-0 text-[13px]" value={st.fontSize} onChange={(e) => set({ fontSize: Number(e.target.value) })} aria-label="اندازه‌ی قلم مقیاس‌ها">
          {FONT_SIZES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-28 text-[13px]">خط نشانگر</span>
        <ColorButton value={st.crosshairColor} onChange={(crosshairColor) => set({ crosshairColor })} label="رنگ خط نشانگر" />
      </div>
    </div>
  );

  const presetsTab = (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {CHART_PRESETS.map((p) => {
        const look = resolveChartStyle(theme, p.style);
        const on = JSON.stringify(resolveChartStyle(theme, changes)) === JSON.stringify(look);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => setChanges({ ...p.style })}
            className={clsx('rounded-2xl border p-2 text-start transition hover:border-accent/60', on ? 'border-accent bg-accent/10' : 'border-line')}
          >
            <Preview st={look} />
            <span className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold">
              {on && <Check size={13} className="text-accent-ink" />}
              {p.name}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={cancel}
      size="lg"
      title="تنظیمات چارت"
      footer={
        <>
          <button type="button" className="btn-ghost me-auto" onClick={() => setChanges({})} title="رنگ‌های پیش‌فرض بک‌تست‌لب (پیرو تم روشن یا تیره)">
            <RotateCcw size={15} /> پیش‌فرض
          </button>
          <button type="button" className="btn-ghost" onClick={cancel}>
            انصراف
          </button>
          <button type="button" className="btn-primary" onClick={onClose} data-autofocus>
            تأیید
          </button>
        </>
      }
    >
      <Preview st={st} wide className="mb-4 h-28" />
      <div className="mb-4 flex gap-1 border-b border-line/70" role="tablist">
        {TABS.map((t) => (
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
      {tab === 'candles' && candlesTab}
      {tab === 'canvas' && canvasTab}
      {tab === 'presets' && presetsTab}
      <p className="mt-4 text-[11px] leading-5 text-faint">
        تغییرها همان لحظه روی چارت دیده می‌شوند و با حساب شما ذخیره می‌شوند (در همه‌ی دستگاه‌ها). رنگ‌هایی که تغییر نداده‌اید با تم روشن یا تیره عوض می‌شوند.
      </p>
    </Modal>
  );
}
