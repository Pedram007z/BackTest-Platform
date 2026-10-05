import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { WEEKDAY_SHORT, firstColumn, fromKey, monthLength, monthName, toKey, type CalendarKind, type DayKey } from '../../lib/calendar';
import { faDigits, fmtNum, fmtPct, fmtUsd, fmtUsdShort } from '../../lib/format';

interface Props {
  /** P&L and trade count per market day */
  days: Map<DayKey, { pnl: number; count: number }>;
  startBalance: number;
}

type Unit = 'usd' | 'pct';
type Base = 'initial' | 'current';

/**
 * Profit or loss per day, in a month grid or a year of small months.
 * Percentages are of the starting balance or of the balance at the start of that day.
 */
export function PerformanceCalendar({ days, startBalance }: Props) {
  const keys = useMemo(() => [...days.keys()].sort(), [days]);
  const [cal, setCal] = useState<CalendarKind>('jalali');
  const latest = keys[keys.length - 1];
  const initial = fromKey(cal, latest ?? toKey('gregorian', { y: 2024, m: 1, d: 1 }));
  const [view, setView] = useState<'month' | 'year'>('month');
  const [ym, setYm] = useState({ y: initial.y, m: initial.m });
  const [unit, setUnit] = useState<Unit>('usd');
  const [base, setBase] = useState<Base>('current');

  // balance at the start of each day, for "% of current balance"
  const before = useMemo(() => {
    const m = new Map<DayKey, number>();
    let bal = startBalance;
    for (const k of keys) {
      m.set(k, bal);
      bal += days.get(k)!.pnl;
    }
    return m;
  }, [keys, days, startBalance]);

  const value = (k: DayKey) => {
    const d = days.get(k);
    if (!d) return null;
    if (unit === 'usd') return d.pnl;
    const b = base === 'initial' ? startBalance : before.get(k) ?? startBalance;
    return b > 0 ? (d.pnl / b) * 100 : 0;
  };
  const fmtV = (v: number, short = false) => (unit === 'usd' ? (short ? fmtUsdShort(v, true) : fmtUsd(v, 2, true)) : fmtPct(v, 2));

  const switchCal = (next: CalendarKind) => {
    if (next === cal) return;
    const anchor = toKey(cal, { y: ym.y, m: ym.m, d: 10 });
    const v = fromKey(next, anchor);
    setCal(next);
    setYm({ y: v.y, m: v.m });
  };

  const shift = (n: number) => {
    if (view === 'year') return setYm((s) => ({ ...s, y: s.y + n }));
    setYm((s) => {
      let m = s.m + n;
      let y = s.y;
      if (m < 1) {
        m = 12;
        y--;
      }
      if (m > 12) {
        m = 1;
        y++;
      }
      return { y, m };
    });
  };

  const monthCells = (y: number, m: number) => {
    const lead = firstColumn(cal, y, m);
    const len = monthLength(cal, y, m);
    return [...Array(lead).fill(null), ...Array.from({ length: len }, (_, i) => toKey(cal, { y, m, d: i + 1 }))] as (DayKey | null)[];
  };

  const monthTotal = (y: number, m: number) => {
    let pnl = 0;
    let count = 0;
    for (const k of monthCells(y, m)) {
      if (!k) continue;
      const d = days.get(k);
      if (d) {
        pnl += d.pnl;
        count += d.count;
      }
    }
    return { pnl, count };
  };

  const tone = (v: number | null) => (v === null ? '' : v > 0 ? 'bg-gain/80 text-white' : v < 0 ? 'bg-loss/80 text-white' : 'bg-raised text-ink');

  const seg = (items: { v: string; l: string }[], cur: string, set: (v: any) => void, label: string) => (
    <div className="seg" role="group" aria-label={label}>
      {items.map((it) => (
        <button key={it.v} type="button" onClick={() => set(it.v)} aria-pressed={cur === it.v} className={clsx('seg-item', cur === it.v && 'seg-item-on')}>
          {it.l}
        </button>
      ))}
    </div>
  );

  const mt = monthTotal(ym.y, ym.m);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {seg(
          [
            { v: 'usd', l: 'دلار' },
            { v: 'pct', l: 'درصد' },
          ],
          unit,
          setUnit,
          'واحد',
        )}
        {unit === 'pct' &&
          seg(
            [
              { v: 'initial', l: 'از موجودی اولیه' },
              { v: 'current', l: 'از موجودی همان روز' },
            ],
            base,
            setBase,
            'مبنای درصد',
          )}
        <div className="ms-auto flex items-center gap-2">
          {seg(
            [
              { v: 'jalali', l: 'شمسی' },
              { v: 'gregorian', l: 'میلادی' },
            ],
            cal,
            switchCal,
            'تقویم',
          )}
          {seg(
            [
              { v: 'month', l: 'ماه' },
              { v: 'year', l: 'سال' },
            ],
            view,
            setView,
            'نمای تقویم',
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="قبلی">
          <ChevronRight size={18} />
        </button>
        <div className="text-center">
          <p className="text-base font-bold">{view === 'month' ? `${monthName(cal, ym.m)} ${faDigits(ym.y)}` : faDigits(ym.y)}</p>
          {view === 'month' && (
            <p className={clsx('num text-xs', mt.pnl > 0 ? 'text-gain' : mt.pnl < 0 ? 'text-loss' : 'text-muted')}>
              {mt.count ? `${fmtUsd(mt.pnl, 2, true)} · ${fmtNum(mt.count)} معامله` : 'بدون معامله'}
            </p>
          )}
        </div>
        <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="بعدی">
          <ChevronLeft size={18} />
        </button>
      </div>

      {view === 'month' ? (
        <div className="overflow-x-auto">
          <div className="grid min-w-[560px] grid-cols-7 gap-1.5">
            {WEEKDAY_SHORT.map((w) => (
              <div key={w} className="pb-1 text-center text-[12px] font-semibold text-faint">
                {w}
              </div>
            ))}
            {monthCells(ym.y, ym.m).map((k, i) => {
              if (!k) return <div key={`e${i}`} />;
              const v = value(k);
              const d = days.get(k);
              return (
                <div key={k} className={clsx('flex min-h-[78px] flex-col rounded-xl border p-2', v === null ? 'border-line/60 bg-raised/30' : clsx('border-transparent', tone(v)))}>
                  <span className={clsx('num text-[12px] font-semibold', v === null ? 'text-faint' : 'opacity-90')}>{faDigits(fromKey(cal, k).d)}</span>
                  {v !== null && d && (
                    <span className="mt-auto">
                      <span className="num block text-[13px] font-bold">{fmtV(v)}</span>
                      <span className="num block text-[11px] opacity-85">{fmtNum(d.count)} معامله</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
            const tot = monthTotal(ym.y, m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setYm({ y: ym.y, m });
                  setView('month');
                }}
                className="rounded-xl p-2 text-start transition hover:bg-raised/50"
              >
                <p className="mb-1.5 flex items-center justify-between text-[13px] font-bold">
                  {monthName(cal, m)}
                  {tot.count > 0 && <span className={clsx('num text-[11px]', tot.pnl >= 0 ? 'text-gain' : 'text-loss')}>{fmtUsdShort(tot.pnl, true)}</span>}
                </p>
                <div className="grid grid-cols-7 gap-[3px]">
                  {monthCells(ym.y, m).map((k, j) => {
                    if (!k) return <span key={`e${j}`} />;
                    const v = value(k);
                    return (
                      <span
                        key={k}
                        title={v === null ? undefined : `${faDigits(fromKey(cal, k).d)} ${monthName(cal, m)}: ${fmtV(v)}`}
                        className={clsx('num flex aspect-square items-center justify-center rounded-[4px] text-[9px]', v === null ? 'bg-raised/40 text-faint' : tone(v))}
                      >
                        {faDigits(fromKey(cal, k).d)}
                      </span>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
