import clsx from 'clsx';
import { ArrowLeft, ChevronUp, Crown, Database, Gift } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { fmtDayLong } from '../../lib/calendar';
import { fmtNum } from '../../lib/format';
import { DATA_START, FX_CLASS_LABELS, GROUP_LABELS, SYMBOLS, TIMEFRAMES, type SymbolGroup, type SymbolInfo } from '../../lib/market';
import { MarketIcon } from './MarketIcon';

const GROUPS = Object.keys(GROUP_LABELS) as SymbolGroup[];
/** Cards shown per market before "show all". */
const FIRST = 6;

/** The free plan's five currency pairs (see the plan cards: «۵ نماد فارکس»). */
const FREE = new Set(
  SYMBOLS.filter((s) => s.fxClass === 'major')
    .slice(0, 5)
    .map((s) => s.id),
);

/** Where the server takes each symbol's real prices from (server/src/market/instruments.ts). */
const SOURCES = (s: SymbolInfo) => (s.group !== 'crypto' ? ['Dukascopy'] : ['BTCUSD', 'ETHUSD', 'LTCUSD'].includes(s.id) ? ['Binance', 'Dukascopy'] : ['Binance']);

function category(s: SymbolInfo) {
  if (s.group === 'forex' && s.fxClass) return `فارکس · ${FX_CLASS_LABELS[s.fxClass]}`;
  if (s.group === 'index') return s.id === 'NQ' || s.id === 'ES' ? 'آتی شاخص' : 'شاخص';
  return { metal: 'فلز', energy: 'انرژی', crypto: 'کریپتو' }[s.group as 'metal' | 'energy' | 'crypto'];
}

function Row({ label, children, stacked }: { label: string; children: ReactNode; stacked?: boolean }) {
  return (
    <div className={clsx(stacked ? 'space-y-2' : 'flex flex-wrap items-center justify-between gap-2')}>
      <dt className="text-[12px] text-faint">{label}:</dt>
      <dd className="flex flex-wrap items-center gap-1.5">{children}</dd>
    </div>
  );
}

function MarketCard({ s }: { s: SymbolInfo }) {
  const free = FREE.has(s.id);
  return (
    <article className="card flex flex-col gap-4 p-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_18px_40px_-28px_rgb(var(--accent)/0.7)]">
      <header className="flex items-center gap-3">
        <MarketIcon symbol={s} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[17px] font-extrabold leading-6">{s.id}</h3>
          <p className="truncate text-xs text-muted">{s.name}</p>
        </div>
        <span className="shrink-0 self-start rounded-full border border-line/80 bg-raised/60 px-2.5 py-1 text-[11px] font-semibold text-muted">{category(s)}</span>
      </header>
      <div className="h-px bg-line/60" />
      <dl className="flex flex-1 flex-col gap-3">
        <Row label="منبع داده">
          {SOURCES(s).map((src) => (
            <span key={src} className="inline-flex items-center gap-1 rounded-full bg-raised px-2.5 py-1 text-[11px] font-semibold text-ink" dir="ltr">
              <Database size={11} className="text-faint" />
              {src}
            </span>
          ))}
        </Row>
        <Row label="دسترسی پلن">
          {free ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gain/15 px-2.5 py-1 text-[11px] font-bold text-gain">
              <Gift size={12} /> رایگان و بالاتر
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold text-accent">
              <Crown size={12} /> حرفه‌ای
            </span>
          )}
        </Row>
        <Row label="تایم‌فریم‌ها" stacked>
          <span className="flex flex-wrap gap-1" dir="ltr">
            {TIMEFRAMES.map((t) => (
              <span key={t.id} className="rounded-md bg-raised px-1 py-0.5 font-mono text-[11px] font-semibold text-muted" title={t.label}>
                {t.short}
              </span>
            ))}
          </span>
        </Row>
        <Row label="شروع داده">
          <span className="text-[13px] font-semibold">{fmtDayLong(DATA_START)}</span>
        </Row>
      </dl>
    </article>
  );
}

/** Markets on the landing page: one tab per market, a card per symbol. */
export function MarketsSection() {
  const [group, setGroup] = useState<SymbolGroup>('forex');
  const [all, setAll] = useState(false);
  const list = SYMBOLS.filter((s) => s.group === group);
  const shown = all ? list : list.slice(0, FIRST);
  const more = list.length - FIRST;

  const toggle =
    more > 0 ? (
      <button type="button" className="btn-soft shrink-0 rounded-full px-5 py-2.5" onClick={() => setAll((a) => !a)} aria-expanded={all} aria-controls="market-cards">
        {all ? (
          <>
            نمایش کمتر <ChevronUp size={16} />
          </>
        ) : (
          <>
            مشاهده‌ی همه‌ی {fmtNum(list.length)} نماد {GROUP_LABELS[group]} <ArrowLeft size={16} />
          </>
        )}
      </button>
    ) : null;

  return (
    <section id="markets" className="scroll-mt-20 bg-side/60 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="mb-3 text-[13px] font-bold tracking-wide text-accent">بازارها</p>
            <h2 className="font-display text-[28px] font-extrabold leading-[1.5] sm:text-[34px]">بازارهایی که معامله می‌کنی</h2>
            <p className="mt-3 text-[15px] leading-8 text-muted">
              {fmtNum(SYMBOLS.length)} نماد در {fmtNum(GROUPS.length)} بازار، با داده‌ی تاریخی از {fmtDayLong(DATA_START)} تا دیروز و تایم‌فریم‌های ۱ ثانیه تا روزانه.
            </p>
          </div>
          <span className="hidden sm:block">{toggle}</span>
        </div>

        <div
          role="tablist"
          aria-label="بازارها"
          className="mb-6 flex gap-1 overflow-x-auto rounded-full border border-line/70 bg-surface p-1 [scrollbar-width:none] sm:grid sm:grid-cols-5"
        >
          {GROUPS.map((g) => {
            const on = g === group;
            return (
              <button
                key={g}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls="market-cards"
                onClick={() => {
                  setGroup(g);
                  setAll(false);
                }}
                className={clsx(
                  'flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-bold transition',
                  on ? 'bg-accent text-white shadow-[0_6px_20px_-10px_rgb(var(--accent)/0.9)]' : 'text-muted hover:bg-raised hover:text-ink',
                )}
              >
                {GROUP_LABELS[g]}
                <span className={clsx('num rounded-full px-1.5 text-[11px]', on ? 'bg-white/20' : 'bg-raised')}>{fmtNum(SYMBOLS.filter((s) => s.group === g).length)}</span>
              </button>
            );
          })}
        </div>

        <div id="market-cards" role="tabpanel" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((s) => (
            <MarketCard key={s.id} s={s} />
          ))}
        </div>

        {toggle && <div className="mt-8 flex justify-center sm:hidden">{toggle}</div>}
        {!all && more > 0 && (
          <p className="mt-4 hidden text-center text-sm text-faint sm:block">
            و {fmtNum(more)} نماد دیگر در {GROUP_LABELS[group]}
          </p>
        )}
      </div>
    </section>
  );
}
