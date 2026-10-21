import clsx from 'clsx';
import { Check, ChevronUp, Globe2, Search } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { faDigits } from '../../lib/format';
import { DEFAULT_CHART_TZ, allTimeZones, fmtClock, fmtOffset, tzName, tzOffset } from '../../lib/timezone';

interface Props {
  /** Replay time (UTC ms): offsets are shown as they were then (daylight saving). */
  cursor: number;
  tz: string;
  onChange: (tz: string) => void;
}

/** Zones near the top of the list, like TradingView's. */
const POPULAR = ['UTC', 'Asia/Tehran', 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney', 'Asia/Dubai', 'Europe/Berlin', 'Asia/Hong_Kong'];

/** The chart's time zone, picked under the chart: the axis, the replay clock and Go To all follow it. */
export function TimezoneMenu({ cursor, tz, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const box = useRef<HTMLDivElement>(null);
  useClickOutside([box], () => setOpen(false), open);

  // every zone with its offset at the replay time, west to east
  const zones = useMemo(() => {
    if (!open) return [];
    const at = cursor || Date.now();
    return allTimeZones()
      .map((id) => ({ id, name: tzName(id), offset: tzOffset(at, id), label: fmtOffset(at, id) }))
      .sort((a, b) => a.offset - b.offset || a.id.localeCompare(b.id));
  }, [open, cursor]);

  const needle = q.trim().toLowerCase();
  const match = (z: (typeof zones)[number]) => !needle || z.id.toLowerCase().includes(needle) || z.name.toLowerCase().includes(needle) || z.label.toLowerCase().includes(needle);
  const popular = needle ? [] : POPULAR.map((id) => zones.find((z) => z.id === id)).filter((z): z is (typeof zones)[number] => !!z);
  const rest = zones.filter(match);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQ('');
  };
  const row = (z: (typeof zones)[number]) => (
    <li key={`${z.id}`}>
      <button
        type="button"
        onClick={() => pick(z.id)}
        className={clsx('flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-start text-[12px] hover:bg-raised', z.id === tz && 'bg-raised text-accent-ink')}
      >
        <span className="num w-[74px] shrink-0 text-faint" dir="ltr" style={{ textAlign: 'right' }}>
          {z.label}
        </span>
        <span className="min-w-0 flex-1 truncate">
          {z.name}
          {z.name !== z.id && (
            <span className="ms-1.5 text-[11px] text-faint" dir="ltr">
              {z.id}
            </span>
          )}
        </span>
        {z.id === tz && <Check size={14} className="shrink-0" />}
      </button>
    </li>
  );

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={clsx('icon-btn h-8 w-auto gap-1.5 px-2 text-[12px]', open && 'bg-raised text-ink')}
        title="منطقه‌ی زمانی چارت (محور زمان، ساعت بالای چارت و «برو به»)"
      >
        <Globe2 size={15} />
        <span className="num">{fmtClock(cursor, tz)}</span>
        <span className="num text-faint" dir="ltr">
          ({fmtOffset(cursor, tz)})
        </span>
        <span className="hidden sm:inline">{tzName(tz)}</span>
        <ChevronUp size={14} className={clsx('transition', !open && 'rotate-180')} />
      </button>
      {open && (
        <div className="anim-pop absolute bottom-full right-0 z-50 mb-2 flex max-h-[min(70vh,520px)] w-[min(92vw,340px)] flex-col rounded-2xl border border-line bg-surface p-2 shadow-pop">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-[13px] font-bold">منطقه‌ی زمانی</p>
            {tz !== DEFAULT_CHART_TZ && (
              <button type="button" className="btn-ghost px-2 py-1 text-[11px]" onClick={() => pick(DEFAULT_CHART_TZ)}>
                تهران (پیش‌فرض)
              </button>
            )}
          </div>
          <label className="relative mb-2 block">
            <Search size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-faint" />
            <input
              className="field h-9 py-1 pr-8 text-[12px]"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجو: شهر، Europe/Paris یا UTC+2"
              autoFocus
              aria-label="جستجوی منطقه‌ی زمانی"
            />
          </label>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {popular.length > 0 && (
              <>
                {popular.map(row)}
                <li className="my-1 h-px bg-line" aria-hidden />
              </>
            )}
            {rest.length ? rest.map(row) : <li className="px-2 py-4 text-center text-[12px] text-muted">منطقه‌ای پیدا نشد.</li>}
          </ul>
          <p className="mt-2 px-1 text-[11px] leading-5 text-faint">{faDigits(String(zones.length))} منطقه‌ی زمانی؛ ساعت تابستانی هر منطقه در تاریخِ بازپخش حساب می‌شود.</p>
        </div>
      )}
    </div>
  );
}
