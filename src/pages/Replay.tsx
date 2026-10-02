import clsx from 'clsx';
import { ArrowRight, Check, FastForward, Pause, Play, StepForward, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CandleChart } from '../components/charts/CandleChart';
import { Meter, Select } from '../components/ui/controls';
import { fmtDay, fmtMarketTime } from '../lib/calendar';
import { faDigits, fmtNum, fmtR, fmtUsd, toLatinDigits } from '../lib/format';
import { SYMBOL_MAP, TIMEFRAMES, priceAt, stepCursor, type Timeframe } from '../lib/market';
import { rAt, sessionBalance, sessionEndMs, sessionProgress, sessionRemainingDays } from '../lib/stats';
import type { Session, Trade } from '../lib/types';
import { toast, useStore } from '../store/useStore';

const SPEEDS = [
  { value: '1', label: '۱×' },
  { value: '2', label: '۲×' },
  { value: '4', label: '۴×' },
  { value: '8', label: '۸×' },
];

const REASON: Record<NonNullable<Trade['closeReason']>, string> = { tp: 'حد سود', sl: 'حد ضرر', manual: 'دستی' };

function NumberField({ id, label, value, onChange, suffix, step = 0.1 }: { id: string; label: string; value: string; onChange: (v: string) => void; suffix: string; step?: number }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[11px] font-medium text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className="field num py-2 pl-12"
          inputMode="decimal"
          dir="ltr"
          style={{ textAlign: 'right' }}
          value={value}
          step={step}
          onChange={(e) => onChange(toLatinDigits(e.target.value).replace(/[^\d.]/g, ''))}
        />
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-faint">{suffix}</span>
      </div>
    </div>
  );
}

function OrderPanel({ session, trades, ended }: { session: Session; trades: Trade[]; ended: boolean }) {
  const strategies = useStore((s) => s.strategies);
  const checklist = useStore((s) => s.checklists.find((c) => c.id === session.checklistId));
  const placeTrade = useStore((s) => s.placeTrade);
  const symbol = session.activeSymbol;
  const info = SYMBOL_MAP[symbol];

  const [risk, setRisk] = useState('1');
  const [sl, setSl] = useState(String(info.defaultSl));
  const [rr, setRr] = useState('2');
  const [strategyId, setStrategyId] = useState(session.strategyId ?? '__none__');
  const [checked, setChecked] = useState<string[]>([]);

  useEffect(() => setSl(String(SYMBOL_MAP[symbol].defaultSl)), [symbol]);

  const price = priceAt(symbol, session.cursor);
  const balance = sessionBalance(session, trades.filter((t) => t.status === 'closed'));
  const riskUsd = (balance * Number(risk)) / 100;
  const slDist = Number(sl) * info.pip;
  const tpDist = slDist * Number(rr);
  const missing = checklist?.items.filter((i) => i.required && !checked.includes(i.id)) ?? [];
  const inputsOk = Number(risk) > 0 && Number(risk) <= 10 && Number(sl) > 0 && Number(rr) > 0;
  const blocked = ended ? 'بازه‌ی این جلسه تمام شده است.' : !inputsOk ? 'ریسک (۰ تا ۱۰٪)، حد ضرر و RR را درست وارد کنید.' : missing.length ? `${fmtNum(missing.length)} آیتم الزامی چک‌لیست تیک نخورده است.` : '';

  const submit = (side: 'buy' | 'sell') => {
    if (blocked) return;
    const dir = side === 'buy' ? 1 : -1;
    const t = placeTrade({
      sessionId: session.id,
      symbol,
      side,
      sl: price - dir * slDist,
      tp: price + dir * tpDist,
      risk: Math.round(riskUsd * 100) / 100,
      strategyId: strategyId === '__none__' ? undefined : strategyId,
    });
    if (t) {
      toast(`${side === 'buy' ? 'خرید' : 'فروش'} ${symbol} در ${price.toFixed(info.digits)} ثبت شد`);
      setChecked([]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        <NumberField id="order-risk" label="ریسک" value={risk} onChange={setRisk} suffix="٪" />
        <NumberField id="order-sl" label="حد ضرر" value={sl} onChange={setSl} suffix="پیپ" step={1} />
        <NumberField id="order-rr" label="ریسک به ریوارد" value={rr} onChange={setRr} suffix="R" />
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg bg-raised/60 px-3 py-2.5 text-xs">
        <dt className="text-muted">مبلغ ریسک</dt>
        <dd className="num text-end font-semibold">{fmtUsd(riskUsd)}</dd>
        <dt className="text-muted">سود هدف</dt>
        <dd className="num text-end font-semibold text-gain">{fmtUsd(riskUsd * Number(rr || 0))}</dd>
        <dt className="text-muted">قیمت فعلی</dt>
        <dd className="num text-end font-semibold" dir="ltr" style={{ textAlign: 'left' }}>
          {price.toFixed(info.digits)}
        </dd>
      </dl>

      <div>
        <label className="mb-1 block text-[11px] font-medium text-muted" htmlFor="order-strategy">
          استراتژی این معامله
        </label>
        <Select
          id="order-strategy"
          compact
          value={strategyId}
          onChange={setStrategyId}
          options={[{ value: '__none__', label: 'بدون استراتژی' }, ...strategies.map((s) => ({ value: s.id, label: s.name }))]}
        />
      </div>

      {checklist && (
        <fieldset className="rounded-lg border border-line/70 p-3">
          <legend className="px-1 text-[11px] font-semibold text-muted">چک‌لیست: {checklist.name}</legend>
          <ul className="flex flex-col gap-1">
            {checklist.items.map((it) => {
              const on = checked.includes(it.id);
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => setChecked((c) => (on ? c.filter((x) => x !== it.id) : [...c, it.id]))}
                    className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-start text-[13px] hover:bg-raised/60"
                    aria-pressed={on}
                  >
                    <span className={clsx('flex h-4 w-4 shrink-0 items-center justify-center rounded border', on ? 'border-gain bg-gain text-white' : 'border-faint')}>
                      {on && <Check size={11} strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1">{it.text}</span>
                    {it.required && <span className="text-[10px] font-bold text-amber">الزامی</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={!!blocked} onClick={() => submit('buy')} className="btn flex-col gap-0 bg-gain py-2.5 text-white hover:brightness-110">
          <span className="text-sm">خرید</span>
          <span className="num text-[11px] font-medium opacity-80" dir="ltr">
            SL {(price - slDist).toFixed(info.digits)}
          </span>
        </button>
        <button type="button" disabled={!!blocked} onClick={() => submit('sell')} className="btn flex-col gap-0 bg-loss py-2.5 text-white hover:brightness-110">
          <span className="text-sm">فروش</span>
          <span className="num text-[11px] font-medium opacity-80" dir="ltr">
            SL {(price + slDist).toFixed(info.digits)}
          </span>
        </button>
      </div>
      {blocked && <p className="-mt-2 text-xs text-amber">{blocked}</p>}
    </div>
  );
}

function Positions({ session, trades }: { session: Session; trades: Trade[] }) {
  const closeTrade = useStore((s) => s.closeTrade);
  const [tab, setTab] = useState<'open' | 'closed'>('open');
  const open = trades.filter((t) => t.status === 'open');
  const closed = trades.filter((t) => t.status === 'closed').sort((a, b) => (b.closeTime ?? 0) - (a.closeTime ?? 0)).slice(0, 30);
  const list = tab === 'open' ? open : closed;

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center gap-1 border-b border-line/70 px-3">
        {(['open', 'closed'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={clsx('relative px-3 py-2.5 text-[13px] font-semibold transition', tab === k ? 'text-ink' : 'text-muted hover:text-ink')}
          >
            {k === 'open' ? 'پوزیشن‌های باز' : 'بسته‌شده'}
            <span className="num ms-1.5 rounded bg-raised px-1.5 text-[11px]">{fmtNum(k === 'open' ? open.length : trades.length - open.length)}</span>
            {tab === k && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent" />}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {list.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted">{tab === 'open' ? 'پوزیشن بازی ندارید. از پنل سفارش خرید یا فروش ثبت کنید.' : 'هنوز معامله‌ای بسته نشده.'}</p>
        ) : (
          <table className="w-full min-w-[560px] text-[12px]">
            <thead className="text-faint">
              <tr className="text-start">
                <th className="px-3 py-2 text-start font-medium">نماد</th>
                <th className="px-3 py-2 text-start font-medium">جهت</th>
                <th className="px-3 py-2 text-start font-medium">ورود</th>
                <th className="px-3 py-2 text-start font-medium">{tab === 'open' ? 'قیمت فعلی' : 'خروج'}</th>
                <th className="px-3 py-2 text-start font-medium">R</th>
                <th className="px-3 py-2 text-start font-medium">سود / زیان</th>
                <th className="px-3 py-2 text-start font-medium">{tab === 'open' ? '' : 'دلیل'}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => {
                const info = SYMBOL_MAP[t.symbol];
                const now = t.status === 'open' ? priceAt(t.symbol, session.cursor) : t.exit ?? t.entry;
                const r = t.status === 'open' ? rAt(t, now) : t.r ?? 0;
                const pnl = t.status === 'open' ? r * t.risk : t.pnl ?? 0;
                return (
                  <tr key={t.id} className="border-t border-line/50">
                    <td className="px-3 py-2 font-semibold" dir="ltr" style={{ textAlign: 'right' }}>
                      {t.symbol}
                    </td>
                    <td className="px-3 py-2">
                      <span className={clsx('rounded px-1.5 py-0.5 text-[11px] font-bold', t.side === 'buy' ? 'bg-gain/15 text-gain' : 'bg-loss/15 text-loss')}>
                        {t.side === 'buy' ? 'خرید' : 'فروش'}
                      </span>
                    </td>
                    <td className="num px-3 py-2" dir="ltr" style={{ textAlign: 'right' }}>
                      {t.entry.toFixed(info.digits)}
                    </td>
                    <td className="num px-3 py-2" dir="ltr" style={{ textAlign: 'right' }}>
                      {now.toFixed(info.digits)}
                    </td>
                    <td className={clsx('num px-3 py-2 font-semibold', r >= 0 ? 'text-gain' : 'text-loss')}>{fmtR(r)}</td>
                    <td className={clsx('num px-3 py-2 font-semibold', pnl >= 0 ? 'text-gain' : 'text-loss')}>{fmtUsd(pnl, 2, true)}</td>
                    <td className="px-3 py-2 text-end">
                      {t.status === 'open' ? (
                        <button type="button" className="btn-soft px-2 py-1 text-[11px]" onClick={() => closeTrade(t.id)}>
                          <X size={12} /> بستن
                        </button>
                      ) : (
                        <span className="text-[11px] text-muted">{REASON[t.closeReason ?? 'manual']}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function Replay() {
  const { id } = useParams();
  const session = useStore((s) => s.sessions.find((x) => x.id === id));
  const allTrades = useStore((s) => s.trades);
  const updateSession = useStore((s) => s.updateSession);
  const addPracticeSeconds = useStore((s) => s.addPracticeSeconds);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState('1');

  const trades = useMemo(() => allTrades.filter((t) => t.sessionId === id), [allTrades, id]);

  const step = useCallback(
    (tf?: Timeframe) => {
      const st = useStore.getState();
      const s = st.sessions.find((x) => x.id === id);
      if (!s) return;
      const end = sessionEndMs(s);
      if (s.cursor >= end) {
        setPlaying(false);
        return;
      }
      const next = Math.min(end, stepCursor(s.cursor, tf ?? s.timeframe, s.symbols));
      const closed = st.advance(s.id, next);
      for (const t of closed) {
        toast(`${t.symbol} با ${t.closeReason === 'tp' ? 'حد سود' : 'حد ضرر'} بسته شد: ${fmtUsd(t.pnl ?? 0, 2, true)}`, (t.pnl ?? 0) >= 0 ? 'success' : 'error');
      }
      if (next >= end) {
        setPlaying(false);
        toast('به پایان بازه‌ی این جلسه رسیدید', 'info');
      }
    },
    [id],
  );

  // auto-play
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => step(), 1000 / Number(speed));
    return () => clearInterval(t);
  }, [playing, speed, step]);

  // count practice time while this page is visible
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') addPracticeSeconds(15);
    }, 15_000);
    return () => clearInterval(t);
  }, [addPracticeSeconds]);

  useEffect(() => {
    if (id) updateSession(id, { lastOpenedAt: Date.now() });
  }, [id, updateSession]);

  // keyboard: space = play/pause, → = one step
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        step();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  if (!session) {
    return (
      <div className="px-6 py-20 text-center">
        <p className="mb-4 text-muted">این جلسه پیدا نشد.</p>
        <Link to="/dashboard" className="btn-primary">
          بازگشت به داشبورد
        </Link>
      </div>
    );
  }

  const ended = session.cursor >= sessionEndMs(session);
  const info = SYMBOL_MAP[session.activeSymbol];
  const closedTrades = trades.filter((t) => t.status === 'closed');
  const balance = sessionBalance(session, closedTrades);
  const openPnl = trades
    .filter((t) => t.status === 'open')
    .reduce((s, t) => s + rAt(t, priceAt(t.symbol, session.cursor)) * t.risk, 0);

  return (
    <div className="flex flex-col lg:h-[calc(100vh-3.5rem)]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line/70 bg-side px-3 py-2 sm:px-4">
        <Link to="/dashboard" className="icon-btn" aria-label="بازگشت">
          <ArrowRight size={18} />
        </Link>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{session.name}</p>
          <p className="num text-[11px] text-faint">
            {fmtDay(session.startDate)} تا {fmtDay(session.endDate)}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-raised p-1" dir="ltr">
          {session.symbols.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => updateSession(session.id, { activeSymbol: s })}
              className={clsx('rounded-md px-2.5 py-1 text-xs font-bold transition', s === session.activeSymbol ? 'bg-surface text-ink shadow' : 'text-muted hover:text-ink')}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-0.5 rounded-lg bg-raised p-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              type="button"
              onClick={() => updateSession(session.id, { timeframe: tf.id })}
              className={clsx('rounded-md px-2 py-1 text-[11px] font-semibold transition', tf.id === session.timeframe ? 'bg-accent text-white' : 'text-muted hover:text-ink')}
            >
              {tf.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 lg:ms-auto">
          <button
            type="button"
            className={clsx('flex h-9 w-9 items-center justify-center rounded-full text-white transition', ended ? 'bg-faint' : 'bg-accent hover:brightness-110')}
            onClick={() => setPlaying((p) => !p)}
            disabled={ended}
            aria-label={playing ? 'توقف' : 'پخش'}
            title="پخش / توقف (Space)"
          >
            {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="-translate-x-[1px]" />}
          </button>
          <button type="button" className="icon-btn" onClick={() => step()} disabled={ended} aria-label="یک کندل جلو" title="یک کندل جلو (→)">
            <StepForward size={18} />
          </button>
          <button type="button" className="icon-btn" onClick={() => step('1D')} disabled={ended} aria-label="یک روز جلو" title="پرش یک روز">
            <FastForward size={18} />
          </button>
          <div className="w-[72px]">
            <Select compact value={speed} onChange={setSpeed} options={SPEEDS} />
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_330px]">
        {/* Chart + positions */}
        <div className="flex min-h-0 flex-col">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-line/50 px-4 py-2 text-xs">
            <span className="font-bold" dir="ltr">
              {info.ticker}
            </span>
            <span className="text-muted">{info.name}</span>
            <span className="num text-muted">
              زمان بازار: <span className="font-semibold text-ink">{fmtMarketTime(session.cursor)}</span>
              <span className="ms-2 text-faint" dir="ltr">
                {new Date(session.cursor).toISOString().slice(0, 16).replace('T', ' ')} UTC
              </span>
            </span>
          </div>
          <div className="relative h-[380px] min-h-0 lg:h-auto lg:flex-1">
            <CandleChart symbol={session.activeSymbol} timeframe={session.timeframe} cursor={session.cursor} trades={trades} />
            {ended && (
              <div className="absolute inset-x-0 top-3 mx-auto w-fit rounded-lg border border-line bg-raised px-4 py-2 text-xs font-semibold shadow-pop">
                این جلسه به تاریخ پایان رسیده است.
              </div>
            )}
          </div>
          <div className="h-[220px] shrink-0 border-t border-line/70 bg-side/60">
            <Positions session={session} trades={trades} />
          </div>
        </div>

        {/* Order panel */}
        <aside className="min-h-0 overflow-y-auto border-t border-line/70 bg-side p-4 lg:border-r lg:border-t-0">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-raised/60 p-3">
              <p className="text-[11px] text-muted">موجودی</p>
              <p className="num text-sm font-bold">{fmtUsd(balance)}</p>
            </div>
            <div className="rounded-lg bg-raised/60 p-3">
              <p className="text-[11px] text-muted">سود/زیان باز</p>
              <p className={clsx('num text-sm font-bold', openPnl > 0 ? 'text-gain' : openPnl < 0 ? 'text-loss' : '')}>{fmtUsd(openPnl, 2, true)}</p>
            </div>
          </div>
          <div className="mb-5">
            <div className="mb-1.5 flex justify-between text-[11px] text-muted">
              <span>پیشرفت جلسه</span>
              <span className="num">روزهای باقی‌مانده: {fmtNum(sessionRemainingDays(session))}</span>
            </div>
            <Meter value={sessionProgress(session)} className="h-1" />
          </div>
          <h2 className="mb-3 text-sm font-bold">ثبت سفارش</h2>
          <OrderPanel key={session.id} session={session} trades={trades} ended={ended} />
          <p className="mt-5 text-[11px] leading-6 text-faint">
            میانبرها: <kbd className="rounded bg-raised px-1">Space</kbd> پخش/توقف، <kbd className="rounded bg-raised px-1">→</kbd> یک کندل جلو. حد ضرر بر حسب پیپ ({faDigits(info.pip)} قیمت) است.
          </p>
        </aside>
      </div>
    </div>
  );
}
