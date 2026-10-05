import clsx from 'clsx';
import { ChartColumn, Dices, RotateCcw, Trash2, X } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PerformanceCalendar } from '../components/analytics/PerformanceCalendar';
import {
  BalanceEquityChart,
  DailyPnlChart,
  HourChart,
  MonteCarloChart,
  MonthBars,
  SessionRadar,
  SideDonut,
  SideWinRings,
  Sparkline,
  WeekdayChart,
} from '../components/charts/AnalyticsCharts';
import { DatePicker } from '../components/ui/DatePicker';
import { EmptyState, InfoTip, MultiSelect, Select } from '../components/ui/controls';
import { GREGORIAN_MONTHS, JALALI_MONTHS, WEEKDAY_NAMES, fmtDayLong, msToKey, type CalendarKind } from '../lib/calendar';
import { faDigits, fmtNum, fmtPct, fmtUsd, toLatinDigits } from '../lib/format';
import { DATA_START, SYMBOL_MAP, dataEnd, groupLabel } from '../lib/market';
import {
  balanceEquitySeries,
  byHour,
  byMarketSession,
  bySide,
  byWeekday,
  calendarData,
  closedOnly,
  dailyPnl,
  monteCarlo,
  monthlyTable,
  rrStats,
  summarize,
  tradeReturns,
  winnersLosers,
} from '../lib/stats';
import { SESSION_SHORT, TZ_OPTIONS } from '../lib/timezone';
import { useStore } from '../store/useStore';

function Box({ title, info, children, className, action }: { title?: string; info?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={clsx('card p-5', className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center gap-2">
          {title && <h3 className="text-[14px] font-bold">{title}</h3>}
          {info && <InfoTip text={info} />}
          {action && <div className="ms-auto">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

function SectionTitle({ children, info, action }: { children: ReactNode; info?: string; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-10 flex items-center gap-2">
      <h2 className="font-display text-lg font-bold">{children}</h2>
      {info && <InfoTip text={info} />}
      {action && <div className="ms-auto">{action}</div>}
    </div>
  );
}

const fmtDur = (ms: number) => {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.round((ms % 3_600_000) / 60_000);
  return h ? `${fmtNum(h)} ساعت ${m ? `${fmtNum(m)} دقیقه` : ''}` : `${fmtNum(m)} دقیقه`;
};

export default function Analytics() {
  const trades = useStore((s) => s.trades);
  const sessions = useStore((s) => s.sessions);
  const strategies = useStore((s) => s.strategies);
  const [params] = useSearchParams();

  // ---------- filters ----------
  const [session, setSession] = useState(params.get('session') ?? 'all');
  const [strategy, setStrategy] = useState('all');
  const [assets, setAssets] = useState<string[]>([]);
  const [side, setSide] = useState<'all' | 'buy' | 'sell'>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [tz, setTz] = useState('Asia/Tehran');
  const [beInput, setBeInput] = useState('0');
  const [be, setBe] = useState(0);
  const [pnlView, setPnlView] = useState<'all' | 'day'>('all');
  const [hourMode, setHourMode] = useState<'pnl' | 'rr' | 'pct'>('pnl');
  const [monthCal, setMonthCal] = useState<CalendarKind>('gregorian');
  const [monthYear, setMonthYear] = useState<number | null>(null);
  const [mcSteps, setMcSteps] = useState('100');
  const [mcSeed, setMcSeed] = useState(1);

  const list = useMemo(
    () =>
      trades.filter((t) => {
        if (session !== 'all' && t.sessionId !== session) return false;
        if (strategy !== 'all' && t.strategyId !== strategy) return false;
        if (assets.length && !assets.includes(t.symbol)) return false;
        if (side !== 'all' && t.side !== side) return false;
        const day = msToKey(t.openTime);
        if (from && day < from) return false;
        if (to && day > to) return false;
        return t.status === 'closed' || t.status === 'open';
      }),
    [trades, session, strategy, assets, side, from, to],
  );
  const usedSessions = useMemo(() => sessions.filter((s) => (session === 'all' ? list.some((t) => t.sessionId === s.id) : s.id === session)), [sessions, session, list]);
  const startBalance = usedSessions.reduce((s, x) => s + x.balance, 0);
  const closed = closedOnly(list);
  const s = summarize(list, be);
  const returns = useMemo(() => tradeReturns(trades, sessions), [trades, sessions]);
  const rr = useMemo(() => rrStats(list), [list]);
  const wl = useMemo(() => winnersLosers(list, returns, be), [list, returns, be]);
  const sides = bySide(list, be);
  const sess = byMarketSession(list, be);
  const hours = useMemo(() => byHour(list, returns, tz), [list, returns, tz]);
  const weekdays = byWeekday(list, returns).map((r) => ({ ...r, label: WEEKDAY_NAMES[r.wd] }));
  const table = useMemo(() => monthlyTable(list, returns, monthCal), [list, returns, monthCal]);
  const selYear = monthYear ?? table[0]?.year;
  const yearRow = table.find((r) => r.year === selYear);
  const monthNames = monthCal === 'jalali' ? JALALI_MONTHS : GREGORIAN_MONTHS;
  const series = useMemo(() => balanceEquitySeries(list, startBalance), [list, startBalance]);
  const daily = useMemo(() => dailyPnl(list), [list]);
  const calDays = useMemo(() => calendarData(list), [list]);
  const mc = useMemo(() => {
    const rets = closed.map((t) => returns.get(t.id) ?? 0);
    return monteCarlo(rets, startBalance || 10000, Number(mcSteps), 400, mcSeed);
  }, [closed, returns, startBalance, mcSteps, mcSeed]);

  const chips: { label: string; clear: () => void }[] = [];
  if (session !== 'all') chips.push({ label: `جلسه: ${sessions.find((x) => x.id === session)?.name ?? ''}`, clear: () => setSession('all') });
  if (strategy !== 'all') chips.push({ label: `استراتژی: ${strategies.find((x) => x.id === strategy)?.name ?? ''}`, clear: () => setStrategy('all') });
  for (const a of assets) chips.push({ label: a, clear: () => setAssets(assets.filter((x) => x !== a)) });
  if (side !== 'all') chips.push({ label: side === 'buy' ? 'فقط خرید' : 'فقط فروش', clear: () => setSide('all') });
  if (from) chips.push({ label: `از ${fmtDayLong(from)}`, clear: () => setFrom('') });
  if (to) chips.push({ label: `تا ${fmtDayLong(to)}`, clear: () => setTo('') });
  const clearAll = () => {
    setSession('all');
    setStrategy('all');
    setAssets([]);
    setSide('all');
    setFrom('');
    setTo('');
  };

  const usedSymbols = [...new Set(trades.map((t) => t.symbol))].sort();
  const sessionData = (key: 'winRate' | 'total' | 'maxRR' | 'profit') => sess.map((x) => ({ label: SESSION_SHORT[x.key], value: x[key] }));

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold">آنالیز</h1>
        <p className="mt-1 text-sm text-muted">عملکرد معاملات بک‌تست؛ همه‌ی نمودارها با فیلترهای بالای صفحه به‌روز می‌شوند.</p>
      </div>

      {/* filters */}
      <div className="card mb-3 grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={session} onChange={setSession} options={[{ value: 'all', label: 'همه‌ی جلسات' }, ...sessions.map((x) => ({ value: x.id, label: x.name }))]} />
        <Select value={strategy} onChange={setStrategy} options={[{ value: 'all', label: 'همه‌ی استراتژی‌ها' }, ...strategies.map((x) => ({ value: x.id, label: x.name }))]} />
        <MultiSelect
          id="an-assets"
          values={assets}
          onChange={setAssets}
          placeholder="همه‌ی دارایی‌ها"
          options={usedSymbols.map((id) => ({ value: id, label: id, hint: SYMBOL_MAP[id]?.name, group: SYMBOL_MAP[id] ? groupLabel(SYMBOL_MAP[id]) : '' }))}
        />
        <Select
          value={side}
          onChange={setSide}
          options={[
            { value: 'all', label: 'خرید و فروش' },
            { value: 'buy', label: 'فقط خرید' },
            { value: 'sell', label: 'فقط فروش' },
          ]}
        />
        <div>
          <DatePicker id="an-from" value={from} onChange={setFrom} min={DATA_START} max={to || dataEnd()} rangeWith={to} placeholder="از تاریخ (بک‌تست)" />
        </div>
        <div>
          <DatePicker id="an-to" value={to} onChange={setTo} min={from || DATA_START} max={dataEnd()} rangeWith={from} placeholder="تا تاریخ (بک‌تست)" />
        </div>
        <Select value={tz} onChange={setTz} options={TZ_OPTIONS.map((o) => ({ value: o.value, label: `ساعت به وقت ${o.label}` }))} />
        <button type="button" className="btn-ghost justify-center" onClick={clearAll} disabled={!chips.length}>
          <Trash2 size={15} /> پاک کردن فیلترها
        </button>
      </div>
      {chips.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted">فیلترهای فعال:</span>
          {chips.map((c) => (
            <span key={c.label} className="inline-flex items-center gap-1 rounded-lg bg-accent/15 px-2 py-1 font-semibold text-accent-ink">
              {c.label}
              <button type="button" onClick={c.clear} aria-label={`حذف فیلتر ${c.label}`}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {closed.length === 0 ? (
        <div className="card">
          <EmptyState icon={<ChartColumn size={24} />} title="داده‌ای برای تحلیل نیست" text="با این فیلترها معامله‌ی بسته‌شده‌ای وجود ندارد." />
        </div>
      ) : (
        <>
          {/* profit & loss */}
          <Box
            title="سود و زیان"
            info="اکوئیتی = بالانس به‌علاوه‌ی سود/زیان شناور پوزیشن‌های باز در همان لحظه."
            action={
              <div className="seg">
                {(['all', 'day'] as const).map((v) => (
                  <button key={v} type="button" onClick={() => setPnlView(v)} aria-pressed={pnlView === v} className={clsx('seg-item', pnlView === v && 'seg-item-on')}>
                    {v === 'all' ? 'کل دوره' : 'روزانه'}
                  </button>
                ))}
              </div>
            }
          >
            <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
              <div>
                <dt className="text-xs text-muted">سود/زیان کل</dt>
                <dd className={clsx('num text-lg font-bold', s.netPnl >= 0 ? 'text-gain' : 'text-loss')}>{fmtUsd(s.netPnl, 2, true)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">موجودی حساب</dt>
                <dd className="num text-lg font-bold">{fmtUsd(startBalance + s.netPnl)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">وین‌ریت</dt>
                <dd className="num text-lg font-bold">{fmtPct(s.winRate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">کل معاملات</dt>
                <dd className="num text-lg font-bold">
                  {fmtNum(s.total)}{' '}
                  <span className="text-xs font-semibold">
                    <span className="text-gain">{fmtNum(s.wins)}</span>/<span className="text-loss">{fmtNum(s.losses)}</span>
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">معاملات سربه‌سر</dt>
                <dd className="num text-lg font-bold">{fmtNum(s.breakeven)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-xs text-muted">
                  آستانه‌ی سربه‌سر ($) <InfoTip text="معاملاتی که سود یا زیانشان کمتر از این مبلغ است سربه‌سر حساب می‌شوند." />
                </dt>
                <dd className="mt-0.5 flex gap-1">
                  <input
                    id="be-threshold"
                    className="field num w-20 py-1"
                    dir="ltr"
                    inputMode="decimal"
                    value={beInput}
                    onChange={(e) => setBeInput(toLatinDigits(e.target.value).replace(/[^\d.]/g, ''))}
                  />
                  <button type="button" className="btn-soft px-2.5 py-1" onClick={() => setBe(Number(beInput) || 0)}>
                    اعمال
                  </button>
                </dd>
              </div>
            </dl>
            {pnlView === 'all' ? <BalanceEquityChart data={series} /> : <DailyPnlChart data={daily} />}
          </Box>

          {/* RR boxes */}
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Box>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="flex items-center gap-1 text-xs text-muted">
                    میانگین RR <InfoTip text="میانگین R معاملات برنده (سود ÷ ریسک)." />
                  </p>
                  <p className="num text-xl font-bold">{fmtNum(rr.avgRR, 2)}</p>
                </div>
                <div className="text-end">
                  <p className="text-xs text-muted">بیشترین RR</p>
                  <p className="num text-xl font-bold">{fmtNum(rr.maxRR, 2)}</p>
                </div>
              </div>
              <Sparkline data={rr.rrLine} signed />
            </Box>
            <Box>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="flex items-center gap-1 text-xs text-muted">
                    میانگین RR ایده‌آل <InfoTip text="بیشترین فاصله‌ای که قیمت بعد از ورود به نفع شما رفت، پیش از رسیدن به حد ضرر اولیه (تا ۵ روز)، بر حسب R." />
                  </p>
                  <p className="num text-xl font-bold">{fmtNum(rr.idealAvg, 2)}</p>
                </div>
                <div className="text-end">
                  <p className="text-xs text-muted">بیشترین RR ایده‌آل</p>
                  <p className="num text-xl font-bold">{fmtNum(rr.idealMax, 2)}</p>
                </div>
              </div>
              <Sparkline data={rr.idealLine} />
            </Box>
            <Box>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="flex items-center gap-1 text-xs text-muted">
                    می‌توانست سود/سربه‌سر شود <InfoTip text="معاملات بازنده‌ای که قبل از بسته شدن دست‌کم ۱R در سود بودند." />
                  </p>
                  <p className="num text-xl font-bold">{fmtNum(rr.couldHave)}</p>
                </div>
                <div className="text-end">
                  <p className="text-xs text-muted">بیشترین RR ایده‌آل</p>
                  <p className="num text-xl font-bold">{fmtNum(rr.idealMax, 2)}</p>
                </div>
              </div>
              <Sparkline data={rr.couldLine} />
            </Box>
          </div>

          {/* winners / losers */}
          <SectionTitle>برنده‌ها و بازنده‌ها</SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            {(
              [
                ['winners', 'برنده‌ها', 'border-gain/60', wl.winners, 'بهترین سود', 'میانگین سود', 'بیشترین بردهای پیاپی', 'میانگین بردهای پیاپی', 'کل برنده‌ها'],
                ['losers', 'بازنده‌ها', 'border-loss/60', wl.losers, 'بدترین ضرر', 'میانگین ضرر', 'بیشترین باخت‌های پیاپی', 'میانگین باخت‌های پیاپی', 'کل بازنده‌ها'],
              ] as const
            ).map(([key, title, border, st, bestL, avgL, maxL, avgSL, totalL]) => (
              <section key={key} className={clsx('card border-2 p-5', border)}>
                <h3 className={clsx('mb-3 text-[15px] font-bold', key === 'winners' ? 'text-gain' : 'text-loss')}>{title}</h3>
                <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-[13px]">
                  {(
                    [
                      [totalL, fmtNum(st.total)],
                      [bestL, fmtPct(st.best, 2)],
                      [avgL, fmtPct(st.avg, 2)],
                      ['میانگین مدت معامله', fmtDur(st.avgDurationMs)],
                      [maxL, fmtNum(st.maxStreak)],
                      [avgSL, fmtNum(st.avgStreak, 2)],
                    ] as const
                  ).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-muted">{k}</dt>
                      <dd className="num text-end font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>

          {/* by side */}
          <SectionTitle info="سهم خرید و فروش از معاملات، و وین‌ریت هر کدام.">عملکرد بر اساس جهت</SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            <Box title="تعداد معاملات">
              <SideDonut buys={sides[0].total} sells={sides[1].total} />
              <div className="num mt-2 flex justify-center gap-5 text-[13px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-gain" /> خرید {fmtPct((sides[0].total / Math.max(1, sides[0].total + sides[1].total)) * 100, 1)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-loss" /> فروش {fmtPct((sides[1].total / Math.max(1, sides[0].total + sides[1].total)) * 100, 1)}
                </span>
              </div>
            </Box>
            <Box title="وین‌ریت">
              <SideWinRings buy={sides[0].winRate} sell={sides[1].winRate} />
              <div className="num mt-2 flex justify-center gap-5 text-[13px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-gain" /> حلقه‌ی بیرونی، خرید: {fmtPct(sides[0].winRate, 1)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-loss" /> حلقه‌ی داخلی، فروش: {fmtPct(sides[1].winRate, 1)}
                </span>
              </div>
            </Box>
          </div>

          {/* by market session */}
          <SectionTitle info="سشن بر اساس زمان ورود: آسیا (توکیو ۹ تا ۱۸)، لندن (۸ تا ۱۷ لندن)، نیویورک (۸ تا ۱۷ نیویورک)، بقیه خارج از سشن.">عملکرد بر اساس سشن</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Box title="وین‌ریت">
              <SessionRadar data={sessionData('winRate')} format={(v) => fmtPct(v, 1)} />
            </Box>
            <Box title="تعداد معاملات">
              <SessionRadar data={sessionData('total')} format={(v) => fmtNum(v)} />
            </Box>
            <Box title="بیشترین RR">
              <SessionRadar data={sessionData('maxRR')} format={(v) => fmtNum(v, 2)} />
            </Box>
            <Box title="سود">
              <SessionRadar data={sessionData('profit').map((d) => ({ ...d, value: Math.max(0, d.value) }))} format={(v) => fmtUsd(v, 0)} />
              <p className="num -mt-2 text-center text-[11px] text-faint">سشن‌های زیان‌ده روی صفر نمایش داده می‌شوند</p>
            </Box>
          </div>

          {/* by hour */}
          <SectionTitle
            info="بر اساس ساعت ورود، در منطقه‌ی زمانی انتخاب‌شده در فیلترها."
            action={
              <Select
                compact
                value={hourMode}
                onChange={setHourMode}
                options={[
                  { value: 'pnl', label: 'سود و زیان کل' },
                  { value: 'rr', label: 'ریسک به ریوارد' },
                  { value: 'pct', label: 'درصد سود' },
                ]}
              />
            }
          >
            عملکرد بر اساس ساعت
          </SectionTitle>
          <Box>
            <HourChart data={hours} mode={hourMode} />
          </Box>

          {/* by weekday */}
          <SectionTitle info="مجموع درصد سود (راست، سبز) و زیان (چپ، قرمز) برای هر روز هفته‌ی بسته شدن معامله.">عملکرد روزانه</SectionTitle>
          <Box>
            <WeekdayChart data={weekdays} />
          </Box>

          {/* by month */}
          <SectionTitle
            info="جمع درصد بازده معاملات بسته‌شده در هر ماه."
            action={
              <div className="seg">
                {(['gregorian', 'jalali'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setMonthCal(c);
                      setMonthYear(null);
                    }}
                    aria-pressed={monthCal === c}
                    className={clsx('seg-item', monthCal === c && 'seg-item-on')}
                  >
                    {c === 'jalali' ? 'شمسی' : 'میلادی'}
                  </button>
                ))}
              </div>
            }
          >
            عملکرد ماهانه
          </SectionTitle>
          <Box>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-[12px]">
                <thead>
                  <tr>
                    <th className="th">سال</th>
                    {monthNames.map((m) => (
                      <th key={m} className="th text-center">
                        {m}
                      </th>
                    ))}
                    <th className="th text-center">کل سال</th>
                  </tr>
                </thead>
                <tbody>
                  {table.map((row) => (
                    <tr key={row.year} className={clsx('border-t border-line/50', row.year === selYear && 'bg-raised/40')}>
                      <td className="td">
                        <button type="button" className="num font-bold hover:text-accent-ink" onClick={() => setMonthYear(row.year)}>
                          {faDigits(row.year)}
                        </button>
                      </td>
                      {row.months.map((v, i) => (
                        <td key={i} className="td p-1 text-center">
                          {Number.isNaN(v) ? (
                            <span className="text-faint">—</span>
                          ) : (
                            <span
                              className={clsx('num inline-block min-w-[56px] rounded-md px-1.5 py-1 font-semibold', v >= 0 ? 'text-gain' : 'text-loss')}
                              style={{ background: `rgb(var(--${v >= 0 ? 'gain' : 'loss'}) / ${Math.min(0.35, 0.06 + Math.abs(v) / 40)})` }}
                            >
                              {v >= 0 ? '+' : ''}
                              {fmtPct(v, 1)}
                            </span>
                          )}
                        </td>
                      ))}
                      <td className={clsx('td num text-center font-bold', row.total >= 0 ? 'text-gain' : 'text-loss')}>
                        {row.total >= 0 ? '+' : ''}
                        {fmtPct(row.total, 1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {yearRow && (
              <div className="mt-4 border-t border-line/60 pt-4">
                <p className="num mb-2 text-xs text-muted">ماه‌های سال {faDigits(yearRow.year)}</p>
                <MonthBars data={yearRow.months.map((v, i) => ({ label: monthNames[i], value: Number.isNaN(v) ? null : v }))} />
              </div>
            )}
          </Box>

          {/* calendar */}
          <SectionTitle info="سود یا زیان هر روز بازار (روز بسته شدن معامله).">تقویم عملکرد</SectionTitle>
          <Box>
            <PerformanceCalendar days={calDays} startBalance={startBalance} />
          </Box>

          {/* monte carlo */}
          <SectionTitle
            info="۴۰۰ مسیر تصادفی ساخته‌شده از درصد بازده معاملات خودتان (نمونه‌گیری با جایگذاری). نوار پررنگ ۲۵ تا ۷۵ درصد و نوار کم‌رنگ ۵ تا ۹۵ درصد مسیرهاست."
            action={
              <div className="flex items-center gap-2">
                <Select
                  compact
                  value={mcSteps}
                  onChange={setMcSteps}
                  options={[
                    { value: '50', label: '۵۰ معامله‌ی بعدی' },
                    { value: '100', label: '۱۰۰ معامله‌ی بعدی' },
                    { value: '250', label: '۲۵۰ معامله‌ی بعدی' },
                  ]}
                />
                <button type="button" className="btn-soft py-1.5" onClick={() => setMcSeed((x) => x + 1)}>
                  <RotateCcw size={14} /> اجرای دوباره
                </button>
              </div>
            }
          >
            شبیه‌سازی مونت‌کارلو
          </SectionTitle>
          <Box>
            {mc ? (
              <>
                <dl className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    ['موجودی میانه در پایان', fmtUsd(mc.medianFinal, 0)],
                    ['احتمال سودده بودن', fmtPct(mc.probProfit, 1)],
                    ['افت سرمایه در بدترین ۵٪', fmtPct(mc.worstDrawdown95, 1)],
                    ['ریسک نصف شدن حساب', fmtPct(mc.ruin, 1)],
                  ].map(([k, v]) => (
                    <div key={k} className="panel px-4 py-3">
                      <dt className="text-xs text-muted">{k}</dt>
                      <dd className="num text-base font-bold">{v}</dd>
                    </div>
                  ))}
                </dl>
                <MonteCarloChart bands={mc.bands} samples={mc.samples} start={startBalance || 10000} />
              </>
            ) : (
              <EmptyState icon={<Dices size={22} />} title="معاملات کافی نیست" text="برای شبیه‌سازی دست‌کم ۵ معامله‌ی بسته‌شده لازم است." />
            )}
          </Box>
        </>
      )}
    </div>
  );
}
