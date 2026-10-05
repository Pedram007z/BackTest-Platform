import clsx from 'clsx';
import { CalendarDays, Info, LoaderCircle, X } from 'lucide-react';
import { fmtDayLong, msToKey } from '../../lib/calendar';
import { CURRENCY_COUNTRY, IMPACT_LABEL, NEWS_CURRENCIES, newsTitleFa, type NewsEvent } from '../../lib/news';
import { fmtTehran } from '../../lib/timezone';
import type { Impact, NewsFilters } from '../../lib/types';
import type { NewsSource } from '../../hooks/useNews';
import { Flag } from '../ui/Flag';
import { Toggle } from '../ui/controls';

const IMPACT_DOT: Record<Impact, string> = { high: 'bg-loss', medium: 'bg-amber', low: 'bg-[#e8d44d]', holiday: 'bg-faint' };

interface Props {
  events: NewsEvent[];
  source: NewsSource;
  loading: boolean;
  cursor: number;
  filters: NewsFilters;
  /** currencies of the session's symbols, used when no country is picked */
  autoCurrencies: string[];
  onFilters: (patch: Partial<NewsFilters>) => void;
  onClose: () => void;
}

/** Economic calendar beside the chart. Actual numbers stay hidden until the replay reaches the release. */
export function NewsPanel({ events, source, loading, cursor, filters, autoCurrencies, onFilters, onClose }: Props) {
  const picked = filters.currencies.length ? filters.currencies : autoCurrencies;
  const toggleCcy = (c: string) => {
    const base = filters.currencies.length ? filters.currencies : autoCurrencies;
    onFilters({ currencies: base.includes(c) ? base.filter((x) => x !== c) : [...base, c] });
  };
  const toggleImpact = (i: Impact) => onFilters({ impacts: filters.impacts.includes(i) ? filters.impacts.filter((x) => x !== i) : [...filters.impacts, i] });

  const visible = events
    .filter((e) => picked.includes(e.currency) && filters.impacts.includes(e.impact))
    .filter((e) => (e.time <= cursor ? filters.showPast : filters.showFuture))
    .filter((e) => Math.abs(e.time - cursor) < 10 * 86_400_000);
  const days = new Map<string, NewsEvent[]>();
  for (const e of visible) {
    const k = msToKey(e.time);
    if (!days.has(k)) days.set(k, []);
    days.get(k)!.push(e);
  }
  const nextId = visible.find((e) => e.time > cursor)?.id;

  return (
    <aside className="anim-left flex h-full min-h-0 w-full flex-col border-line/70 bg-side lg:w-[330px] lg:border-r" aria-label="تقویم اقتصادی">
      <div className="flex items-center gap-2 border-b border-line/70 px-4 py-3">
        <CalendarDays size={17} className="text-accent-ink" />
        <h2 className="text-sm font-bold">تقویم اقتصادی</h2>
        {loading && <LoaderCircle size={14} className="animate-spin text-faint" />}
        <button type="button" className="icon-btn ms-auto h-8 w-8" onClick={onClose} aria-label="بستن تقویم اقتصادی">
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-3 border-b border-line/70 p-4">
        <div>
          <p className="mb-1.5 text-[12px] font-medium text-muted">کشورها {filters.currencies.length === 0 && <span className="text-faint">(خودکار بر اساس نمادهای جلسه)</span>}</p>
          <div className="flex flex-wrap gap-1.5">
            {NEWS_CURRENCIES.map((c) => {
              const on = picked.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCcy(c)}
                  aria-pressed={on}
                  title={CURRENCY_COUNTRY[c]}
                  className={clsx('flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-bold transition', on ? 'border-accent/60 bg-accent/12 text-ink' : 'border-line text-faint hover:text-ink')}
                >
                  <Flag currency={c} size={16} />
                  {c}
                </button>
              );
            })}
          </div>
          {filters.currencies.length > 0 && (
            <button type="button" className="mt-1.5 text-[11px] font-semibold text-accent-ink hover:underline" onClick={() => onFilters({ currencies: [] })}>
              بازگشت به انتخاب خودکار
            </button>
          )}
        </div>
        <div>
          <p className="mb-1.5 text-[12px] font-medium text-muted">نمایش روی چارت</p>
          <div className="flex gap-4 text-[13px]">
            <label className="flex items-center gap-2">
              <Toggle checked={filters.showPast} onChange={(v) => onFilters({ showPast: v })} label="خبرهای گذشته" />
              گذشته
            </label>
            <label className="flex items-center gap-2">
              <Toggle checked={filters.showFuture} onChange={(v) => onFilters({ showFuture: v })} label="خبرهای پیش رو" />
              پیش رو
            </label>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[12px] font-medium text-muted">اهمیت خبر</p>
          <div className="flex flex-wrap gap-1.5">
            {(['high', 'medium', 'low'] as const).map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleImpact(i)}
                aria-pressed={filters.impacts.includes(i)}
                className={clsx('flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-semibold transition', filters.impacts.includes(i) ? 'border-accent/60 bg-accent/12 text-ink' : 'border-line text-faint hover:text-ink')}
              >
                <span className={clsx('h-2 w-2 rounded-sm', IMPACT_DOT[i])} />
                {IMPACT_LABEL[i]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {visible.length === 0 && <p className="px-3 py-8 text-center text-xs leading-6 text-muted">با این فیلترها خبری در ۱۰ روز قبل و بعد از این لحظه نیست.</p>}
        {[...days.entries()].map(([day, list]) => (
          <section key={day} className="mb-2">
            <h3 className="sticky top-0 z-[1] bg-side px-2 py-1.5 text-[12px] font-bold text-muted">{fmtDayLong(day, 'jalali', true)}</h3>
            <ul className="flex flex-col gap-1">
              {list.map((e) => {
                const past = e.time <= cursor;
                return (
                  <li
                    key={e.id}
                    className={clsx('rounded-xl border px-3 py-2', e.id === nextId ? 'border-accent/60 bg-accent/10' : 'border-transparent hover:bg-raised/50', !past && 'opacity-95')}
                  >
                    <div className="flex items-center gap-2 text-[11px] text-muted">
                      <span className={clsx('h-2 w-2 shrink-0 rounded-sm', IMPACT_DOT[e.impact])} title={IMPACT_LABEL[e.impact]} />
                      <Flag currency={e.currency} size={15} />
                      <span className="font-bold text-ink">{e.currency}</span>
                      <span className="num">{e.allDay ? 'کل روز' : `${fmtTehran(e.time)} تهران`}</span>
                      {e.id === nextId && <span className="ms-auto rounded bg-accent px-1.5 text-[10px] font-bold text-white">بعدی</span>}
                    </div>
                    <p className="mt-0.5 text-[13px] font-medium leading-6">{newsTitleFa(e.title)}</p>
                    {(e.forecast || e.previous || e.actual) && (
                      <p className="num mt-0.5 flex gap-3 text-[11px] text-faint" dir="ltr" style={{ justifyContent: 'flex-end' }}>
                        <span>
                          A: <b className={clsx(past ? 'text-ink' : 'text-faint')}>{past ? e.actual ?? '—' : '—'}</b>
                        </span>
                        <span>F: {e.forecast ?? '—'}</span>
                        <span>P: {e.previous ?? '—'}</span>
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      <p className="flex items-start gap-1.5 border-t border-line/70 px-4 py-2.5 text-[11px] leading-5 text-faint">
        <Info size={13} className="mt-0.5 shrink-0" />
        {source === 'forexfactory'
          ? 'داده از تقویم ForexFactory. عدد واقعی (A) هر خبر فقط بعد از رسیدن بازپخش به زمان انتشار نمایش داده می‌شود.'
          : 'داده‌ی نمونه بر اساس زمان‌بندی واقعی انتشارها؛ اعداد ساختگی هستند. برای داده‌ی ForexFactory سرور برنامه را راه‌اندازی کنید.'}
      </p>
    </aside>
  );
}
