import clsx from 'clsx';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useClickOutside, useRevealOnOpen } from '../../hooks/useClickOutside';
import {
  WEEKDAY_SHORT,
  firstColumn,
  fmtDay,
  fromKey,
  monthLength,
  monthName,
  toKey,
  type CalendarKind,
  type DayKey,
} from '../../lib/calendar';
import { faDigits } from '../../lib/format';

let lastCalendar: CalendarKind = 'jalali';

interface Props {
  id: string;
  value: DayKey | '';
  onChange: (key: DayKey) => void;
  min: DayKey;
  max: DayKey;
  /** The other end of a date range, shaded for context. */
  rangeWith?: DayKey | '';
  placeholder?: string;
}

/**
 * Date field whose panel picks the year and month first (two selects), then a day of that month.
 * Works in the Jalali or Gregorian calendar; the stored value is always a Gregorian day key.
 */
export function DatePicker({ id, value, onChange, min, max, rangeWith, placeholder = 'روز / ماه / سال' }: Props) {
  const [open, setOpen] = useState(false);
  const [cal, setCal] = useState<CalendarKind>(lastCalendar);
  const initial = fromKey(cal, value || max);
  const [view, setView] = useState({ y: initial.y, m: initial.m });
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const refs = useMemo(() => [ref], []);
  useClickOutside(refs, close, open);
  const panel = useRef<HTMLDivElement>(null);
  useRevealOnOpen(panel, open);

  const minY = fromKey(cal, min);
  const maxY = fromKey(cal, max);
  const years = Array.from({ length: maxY.y - minY.y + 1 }, (_, i) => maxY.y - i);

  const openPanel = () => {
    const at = fromKey(cal, value || max);
    setView({ y: at.y, m: at.m });
    setOpen((o) => !o);
  };

  const switchCal = (next: CalendarKind) => {
    if (next === cal) return;
    const anchor = toKey(cal, { y: view.y, m: view.m, d: Math.min(15, monthLength(cal, view.y, view.m)) });
    const v = fromKey(next, anchor);
    lastCalendar = next;
    setCal(next);
    setView({ y: v.y, m: v.m });
  };

  const shiftMonth = (delta: number) => {
    let { y, m } = view;
    m += delta;
    if (m < 1) {
      m = 12;
      y--;
    }
    if (m > 12) {
      m = 1;
      y++;
    }
    if (y < minY.y || y > maxY.y) return;
    setView({ y, m });
  };

  const monthDisabled = (y: number, m: number) =>
    (y === minY.y && m < minY.m) || (y === maxY.y && m > maxY.m);

  const len = monthLength(cal, view.y, view.m);
  const lead = firstColumn(cal, view.y, view.m);
  const cells: (DayKey | null)[] = [...Array(lead).fill(null), ...Array.from({ length: len }, (_, i) => toKey(cal, { y: view.y, m: view.m, d: i + 1 }))];
  const lo = value && rangeWith ? (value < rangeWith ? value : rangeWith) : '';
  const hi = value && rangeWith ? (value < rangeWith ? rangeWith : value) : '';

  return (
    <div ref={ref} className="relative">
      <button
        id={id}
        type="button"
        onClick={openPanel}
        aria-expanded={open}
        className={clsx('field flex items-center gap-2 text-start', open && 'border-accent/70 ring-2 ring-accent/20')}
      >
        <CalendarDays size={16} className="shrink-0 text-muted" />
        <span className={clsx('num', !value && 'text-faint')}>{value ? fmtDay(value, cal) : placeholder}</span>
        {value && cal === 'jalali' && <span className="ms-auto text-xs text-faint num">{faDigits(value.replaceAll('-', '/'))}</span>}
      </button>

      {open && (
        <div ref={panel} className="anim-pop absolute inset-x-0 top-full z-30 mt-1.5 min-w-[17rem] rounded-xl border border-line bg-raised p-3 shadow-pop">
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-surface p-1 text-xs font-semibold">
            {(['jalali', 'gregorian'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => switchCal(c)}
                className={clsx('rounded-md py-1.5 transition', cal === c ? 'bg-accent text-white' : 'text-muted hover:text-ink')}
              >
                {c === 'jalali' ? 'شمسی' : 'میلادی'}
              </button>
            ))}
          </div>

          {/* Year and month first */}
          <div className="mb-3 flex items-center gap-1.5">
            <button type="button" className="icon-btn h-8 w-8 shrink-0" aria-label="ماه قبل" onClick={() => shiftMonth(-1)}>
              <ChevronRight size={16} />
            </button>
            <select
              id={`${id}-year`}
              aria-label="سال"
              value={view.y}
              onChange={(e) => {
                const y = Number(e.target.value);
                let m = view.m;
                if (y === minY.y && m < minY.m) m = minY.m;
                if (y === maxY.y && m > maxY.m) m = maxY.m;
                setView({ y, m });
              }}
              className="field num min-w-0 flex-1 cursor-pointer px-2 py-1.5"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {faDigits(y)}
                </option>
              ))}
            </select>
            <select
              id={`${id}-month`}
              aria-label="ماه"
              value={view.m}
              onChange={(e) => setView({ ...view, m: Number(e.target.value) })}
              className="field min-w-0 flex-[1.3] cursor-pointer px-2 py-1.5"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m} disabled={monthDisabled(view.y, m)}>
                  {monthName(cal, m)}
                </option>
              ))}
            </select>
            <button type="button" className="icon-btn h-8 w-8 shrink-0" aria-label="ماه بعد" onClick={() => shiftMonth(1)}>
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* Then the days of that month */}
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAY_SHORT.map((w) => (
              <span key={w} className="pb-1 text-[11px] font-semibold text-faint">
                {w}
              </span>
            ))}
            {cells.map((key, i) => {
              if (!key) return <span key={`e${i}`} />;
              const disabled = key < min || key > max;
              const selected = key === value;
              const inRange = lo && hi && key > lo && key < hi;
              const isOther = key === rangeWith;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  className={clsx(
                    'num h-8 rounded-md text-[13px] transition',
                    disabled && 'cursor-not-allowed text-faint/50',
                    !disabled && !selected && 'hover:bg-surface',
                    selected && 'bg-accent font-bold text-white',
                    inRange && !selected && 'bg-accent/15 text-ink',
                    isOther && !selected && 'ring-1 ring-inset ring-accent/60',
                  )}
                >
                  {faDigits(fromKey(cal, key).d)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
