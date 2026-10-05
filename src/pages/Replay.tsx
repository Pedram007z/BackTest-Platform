import clsx from 'clsx';
import { ArrowRight, BarChart3, CalendarDays, Camera, ChevronDown, ChevronUp, Cpu, LayoutGrid, Maximize2, Minimize2, Minus, NotebookPen, Plus, Send, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { loadTradingView } from '../chart/tvLoader';
import type { ChartEngine, DraftOrder, EngineCallbacks } from '../chart/types';
import { JournalModal, emptyJournal, type JournalContext } from '../components/journal/JournalModal';
import { ChartPane, type EngineKind } from '../components/replay/ChartPane';
import { CloseModal } from '../components/replay/CloseModal';
import { GoToMenu } from '../components/replay/GoToMenu';
import { NewsPanel } from '../components/replay/NewsPanel';
import { PlaybackBar, SPEEDS } from '../components/replay/PlaybackBar';
import { PositionsPanel } from '../components/replay/PositionsPanel';
import { Modal } from '../components/ui/Modal';
import { Meter } from '../components/ui/controls';
import { Popover } from '../components/ui/Popover';
import { useNews } from '../hooks/useNews';
import { fmtDay, fmtDayLong, fmtMarketTime, msToKey } from '../lib/calendar';
import { faDigits, fmtNum, fmtUsd, toLatinDigits } from '../lib/format';
import { SYMBOL_MAP, atr, getDataVersion, onDataVersion, priceAt, roundToTick, stepCursor, type Timeframe } from '../lib/market';
import { currenciesFor, filterNews } from '../lib/news';
import { saveShot } from '../lib/shots';
import { sessionBalance, sessionEndMs, sessionFloating, sessionProgress, sessionRemainingDays } from '../lib/stats';
import { local } from '../lib/storage';
import { fmtTehran } from '../lib/timezone';
import { dirOf, fmtLots, lotsForRisk, orderTitle, previewOrder, tickOf } from '../lib/trading';
import type { ChartPane as Pane, JournalEntry, LayoutId, Side, Trade } from '../lib/types';
import { toast, useStore, useUi } from '../store/useStore';

interface Draft {
  symbol: string;
  side: Side;
  entry: number;
  sl: number;
  tp: number;
}

const LAYOUTS: { id: LayoutId; label: string; count: number; grid: string; cells: string[] }[] = [
  { id: '1', label: 'یک چارت', count: 1, grid: 'grid-cols-1 grid-rows-1', cells: ['col-span-2 row-span-2'] },
  { id: '2v', label: 'دو چارت کنار هم', count: 2, grid: 'md:grid-cols-2 md:grid-rows-1', cells: ['row-span-2', 'row-span-2'] },
  { id: '2h', label: 'دو چارت زیر هم', count: 2, grid: 'grid-rows-2', cells: ['col-span-2', 'col-span-2'] },
  { id: '3', label: 'سه چارت', count: 3, grid: 'md:grid-cols-2 md:grid-rows-2', cells: ['md:row-span-2', '', ''] },
  { id: '4', label: 'چهار چارت', count: 4, grid: 'md:grid-cols-2 md:grid-rows-2', cells: ['', '', '', ''] },
];

function LayoutIcon({ id }: { id: LayoutId }) {
  const box = 'rounded-[2px] bg-current';
  return (
    <span
      className="grid h-4 w-5 gap-[2px] opacity-80"
      style={{ gridTemplateColumns: id === '2v' || id === '3' || id === '4' ? '1fr 1fr' : '1fr', gridTemplateRows: id === '2h' || id === '3' || id === '4' ? '1fr 1fr' : '1fr' }}
    >
      {id === '1' && <span className={box} />}
      {(id === '2v' || id === '2h') && (
        <>
          <span className={box} />
          <span className={box} />
        </>
      )}
      {id === '3' && (
        <>
          <span className={box} style={{ gridRow: 'span 2' }} />
          <span className={box} />
          <span className={box} />
        </>
      )}
      {id === '4' && [0, 1, 2, 3].map((i) => <span key={i} className={box} />)}
    </span>
  );
}

/** Price field that keeps what the user types while focused and follows the chart otherwise. */
function PriceInput({ id, label, value, digits, onChange, tone }: { id: string; label: string; value: number; digits: number; onChange: (v: number) => void; tone?: string }) {
  const [text, setText] = useState(value.toFixed(digits));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(value.toFixed(digits));
  }, [value, digits]);
  return (
    <label className="flex items-center gap-1.5 rounded-xl border border-line bg-raised/70 px-2 py-1 focus-within:border-accent/70" htmlFor={id}>
      <span className={clsx('text-[11px] font-bold', tone)}>{label}</span>
      <input
        id={id}
        className="num w-[84px] bg-transparent text-[13px] font-semibold outline-none"
        dir="ltr"
        inputMode="decimal"
        value={text}
        onFocus={() => (focused.current = true)}
        onBlur={() => {
          focused.current = false;
          setText(value.toFixed(digits));
        }}
        onChange={(e) => {
          const t = toLatinDigits(e.target.value).replace(/[^\d.]/g, '');
          setText(t);
          const n = Number(t);
          if (t && Number.isFinite(n) && n > 0) onChange(n);
        }}
      />
    </label>
  );
}

const ENGINE_KEY = 'backtest:chart-engine';
const RISK_KEY = 'backtest:risk-pct';

export default function Replay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = useStore((s) => s.sessions.find((x) => x.id === id));
  const allTrades = useStore((s) => s.trades);
  const theme = useStore((s) => s.theme);
  const checklists = useStore((s) => s.checklists);
  const newsFilters = useStore((s) => s.newsFilters);
  const setNewsFilters = useStore((s) => s.setNewsFilters);
  const setLayout = useStore((s) => s.setLayout);
  const updateSession = useStore((s) => s.updateSession);
  const addPracticeSeconds = useStore((s) => s.addPracticeSeconds);
  const expanded = useUi((s) => s.chartExpanded);
  const setExpanded = useUi((s) => s.setChartExpanded);

  // ---------- chart engine ----------
  const [tv, setTv] = useState<unknown>(null);
  const [enginePref, setEnginePref] = useState<'auto' | 'lightweight'>(() => (local.getItem(ENGINE_KEY) === 'lightweight' ? 'lightweight' : 'auto'));
  useEffect(() => {
    let alive = true;
    void loadTradingView().then((lib) => {
      if (!alive) return;
      setTv(lib);
    });
    return () => {
      alive = false;
    };
  }, []);
  const engineKind: EngineKind = enginePref === 'auto' && tv ? 'tradingview' : 'lightweight';
  const engines = useRef(new Map<number, ChartEngine>());
  const register = useCallback((i: number, e: ChartEngine | null) => {
    if (e) engines.current.set(i, e);
    else engines.current.delete(i);
  }, []);
  const [dataVersion, setDataVersion] = useState(getDataVersion());
  useEffect(() => onDataVersion(() => setDataVersion(getDataVersion())), []);

  // ---------- layout ----------
  const layout = session?.layout ?? '1';
  const panes: Pane[] = useMemo(() => (session?.panes?.length ? session.panes : session ? [{ symbol: session.activeSymbol, timeframe: session.timeframe }] : []), [session]);
  const [activePane, setActivePane] = useState(0);
  const active = panes[Math.min(activePane, panes.length - 1)];
  const layoutDef = LAYOUTS.find((l) => l.id === layout) ?? LAYOUTS[0];

  const changeLayout = (next: LayoutId) => {
    if (!session) return;
    const def = LAYOUTS.find((l) => l.id === next)!;
    const extraTfs: Timeframe[] = ['1h', '4h', '15m', '1D', '5m'];
    const out = panes.slice(0, def.count);
    for (let i = out.length; i < def.count; i++) {
      const sym = session.symbols[i] ?? panes[0].symbol;
      const tf = session.symbols[i] ? panes[0].timeframe : (extraTfs.find((t) => !out.some((p) => p.symbol === sym && p.timeframe === t)) ?? '1h');
      out.push({ symbol: sym, timeframe: tf });
    }
    setLayout(session.id, next, out);
    setActivePane((a) => Math.min(a, def.count - 1));
  };
  const changePane = (i: number, pane: Pane) => {
    if (!session) return;
    const next = panes.map((p, j) => (j === i ? pane : p));
    setLayout(session.id, layout, next);
    if (i === 0) updateSession(session.id, { activeSymbol: pane.symbol, timeframe: pane.timeframe });
  };

  // ---------- replay ----------
  const [playing, setPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(2);
  const [stepTf, setStepTf] = useState<Timeframe>(() => panes[0]?.timeframe ?? '15m');
  const trades = useMemo(() => allTrades.filter((t) => t.sessionId === id), [allTrades, id]);

  const notify = useCallback((events: { kind: string; trade: Trade }[]) => {
    for (const { kind, trade: t } of events) {
      const name = SYMBOL_MAP[t.symbol]?.ticker ?? t.symbol;
      if (kind === 'filled') toast(`سفارش ${orderTitle(t.side, t.orderType)} ${name} فعال شد`, 'info');
      if (kind === 'tp') toast(`حد سود ${name} خورد: ${fmtUsd(t.pnl ?? 0, 2, true)}`, 'success');
      if (kind === 'sl') toast(`حد ضرر ${name} خورد: ${fmtUsd(t.pnl ?? 0, 2, true)}`, 'error');
    }
  }, []);

  const jumpTo = useCallback(
    (target: number) => {
      const st = useStore.getState();
      const s = st.sessions.find((x) => x.id === id);
      if (!s) return;
      const end = sessionEndMs(s);
      const next = Math.min(end, target);
      if (next <= s.cursor) return;
      notify(st.advance(s.id, next));
      if (next >= end) {
        setPlaying(false);
        toast('به پایان بازه‌ی این جلسه رسیدید', 'info');
      }
    },
    [id, notify],
  );

  const step = useCallback(() => {
    const s = useStore.getState().sessions.find((x) => x.id === id);
    if (!s) return;
    if (s.cursor >= sessionEndMs(s)) {
      setPlaying(false);
      return;
    }
    jumpTo(stepCursor(s.cursor, stepTf, s.symbols));
  }, [id, stepTf, jumpTo]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(step, 1000 / SPEEDS[speedIndex]);
    return () => clearInterval(t);
  }, [playing, speedIndex, step]);

  // practice time while this page is visible
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') addPracticeSeconds(15);
    }, 15_000);
    return () => clearInterval(t);
  }, [addPracticeSeconds]);

  useEffect(() => {
    if (id) updateSession(id, { lastOpenedAt: Date.now() });
  }, [id, updateSession]);

  useEffect(() => () => setExpanded(false), [setExpanded]);

  // ---------- orders ----------
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftJournal, setDraftJournal] = useState<JournalEntry | null>(null);
  const [riskPct, setRiskPctState] = useState(() => Math.min(10, Math.max(0.1, Number(local.getItem(RISK_KEY)) || 1)));
  const setRiskPct = (v: number) => {
    const r = Math.round(Math.min(10, Math.max(0.1, v)) * 10) / 10;
    setRiskPctState(r);
    local.setItem(RISK_KEY, String(r));
  };
  const [journalFor, setJournalFor] = useState<'draft' | string | null>(null);
  const [closeId, setCloseId] = useState<string | null>(null);
  const [shot, setShot] = useState<string | null>(null);
  const [newsOpen, setNewsOpen] = useState(false);
  const [positionsOpen, setPositionsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  const news = useNews(session?.cursor ?? 0);

  if (!session || !active) {
    return (
      <div className="px-6 py-20 text-center">
        <p className="mb-4 text-muted">این جلسه پیدا نشد.</p>
        <Link to="/sessions" className="btn-primary">
          بازگشت به جلسات
        </Link>
      </div>
    );
  }

  const cursor = session.cursor;
  const endMs = sessionEndMs(session);
  const ended = cursor >= endMs;
  const balance = sessionBalance(session, trades);
  const realized = balance - session.balance;
  const floating = sessionFloating(session, trades);
  const activeSym = SYMBOL_MAP[active.symbol];

  const draftPrice = draft ? priceAt(draft.symbol, cursor) : 0;
  const preview = draft ? previewOrder(draft, draftPrice, balance, riskPct, cursor) : null;
  const draftForChart: (DraftOrder & { symbol: string }) | null =
    draft && preview ? { ...draft, type: preview.type, rr: preview.rr, riskUsd: preview.riskUsd, rewardUsd: preview.rewardUsd, lots: preview.lots } : null;

  const defaultStop = (symbol: string, tf: Timeframe) => Math.max(atr(symbol, tf, cursor) * 1.5, tickOf(symbol) * 10);
  const idleLots = lotsForRisk(
    active.symbol,
    (balance * riskPct) / 100,
    priceAt(active.symbol, cursor),
    priceAt(active.symbol, cursor) - defaultStop(active.symbol, active.timeframe),
    cursor,
  );

  const startDraft = (side: Side) => {
    if (ended) return;
    if (draft && draft.side !== side && draft.symbol === active.symbol) {
      // flip the drawn position to the other side, keeping the distances
      setDraft({ ...draft, side, sl: 2 * draft.entry - draft.sl, tp: 2 * draft.entry - draft.tp });
      return;
    }
    const price = priceAt(active.symbol, cursor);
    const d = defaultStop(active.symbol, active.timeframe);
    const dir = dirOf(side);
    setDraft({
      symbol: active.symbol,
      side,
      entry: roundToTick(active.symbol, price),
      sl: roundToTick(active.symbol, price - dir * d),
      tp: roundToTick(active.symbol, price + dir * d * 2),
    });
    setDraftJournal(null);
  };

  const sessionChecklist = checklists.find((c) => c.id === (draftJournal?.checklistId ?? (draftJournal ? undefined : session.checklistId)));
  const missingRequired = sessionChecklist?.items.filter((i) => i.required && !(draftJournal?.checked ?? []).includes(i.id)) ?? [];

  const place = () => {
    if (!draft || !preview) return;
    if (preview.problem) {
      toast(preview.problem, 'error');
      return;
    }
    if (missingRequired.length) {
      toast(`${fmtNum(missingRequired.length)} آیتم الزامی چک‌لیست «${sessionChecklist!.name}» تیک نخورده. ژورنال را باز کنید.`, 'error');
      setJournalFor('draft');
      return;
    }
    const t = useStore.getState().placeOrder({
      sessionId: session.id,
      symbol: draft.symbol,
      side: draft.side,
      orderType: preview.type,
      entry: draft.entry,
      sl: draft.sl,
      tp: draft.tp,
      riskPct,
      strategyId: session.strategyId,
      journal: draftJournal ?? undefined,
    });
    if (t) {
      toast(`${orderTitle(t.side, t.orderType)} ${activeSym?.ticker ?? t.symbol} · ${fmtLots(t.lots, t.symbol)} لات ثبت شد`);
      setDraft(null);
      setDraftJournal(null);
    }
  };

  const callbacksFor = (i: number): EngineCallbacks => ({
    onDraftChange: (p) => setDraft((d) => (d ? { ...d, ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, roundToTick(d.symbol, v as number)])) } : d)),
    onLineMove: (tradeId, field, price) => {
      useStore.getState().modifyTrade(tradeId, { [field]: price });
      toast(field === 'sl' ? 'حد ضرر جابه‌جا شد' : field === 'tp' ? 'حد سود جابه‌جا شد' : 'قیمت سفارش تغییر کرد', 'info');
    },
    onLineClose: (tradeId) => {
      const t = useStore.getState().trades.find((x) => x.id === tradeId);
      if (!t) return;
      if (t.status === 'pending') {
        useStore.getState().cancelOrder(t.id);
        toast('سفارش لغو شد', 'info');
      } else setCloseId(t.id);
    },
    onSymbolChange: (symbol) => session.symbols.includes(symbol) && changePane(i, { ...panes[i], symbol }),
    onTimeframeChange: (timeframe) => changePane(i, { ...panes[i], timeframe }),
    onActivate: () => setActivePane(i),
  });

  const capture = async () => engines.current.get(activePane)?.screenshot() ?? null;

  const journalTrade = journalFor && journalFor !== 'draft' ? trades.find((t) => t.id === journalFor) : undefined;
  const journalCtx: JournalContext | null =
    journalFor === 'draft' && draft && preview
      ? {
          symbol: draft.symbol,
          side: draft.side,
          type: preview.type,
          entry: draft.entry,
          sl: draft.sl,
          tp: draft.tp,
          rr: preview.rr,
          lots: preview.lots,
          time: cursor,
          sessionName: session.name,
        }
      : journalTrade
        ? {
            symbol: journalTrade.symbol,
            side: journalTrade.side,
            type: journalTrade.orderType,
            entry: journalTrade.entry,
            sl: journalTrade.sl,
            tp: journalTrade.tp,
            rr: Math.abs(journalTrade.tp - journalTrade.entry) / Math.max(1e-12, Math.abs(journalTrade.entry - journalTrade.sl)),
            lots: journalTrade.initialLots,
            time: journalTrade.openTime,
            sessionName: session.name,
            pnl: journalTrade.status === 'closed' ? journalTrade.pnl : undefined,
            r: journalTrade.r,
          }
        : null;

  const autoCurrencies = currenciesFor(session.symbols.map((s) => SYMBOL_MAP[s]?.currencies ?? []));
  const effectiveFilters = { ...newsFilters, currencies: newsFilters.currencies.length ? newsFilters.currencies : autoCurrencies };
  const chartNews = filterNews(news.events, effectiveFilters, cursor);

  const onKey = (e: React.KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (!ended) setPlaying((p) => !p);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      step();
    } else if (e.key === 'Escape') {
      if (draft) setDraft(null);
      else if (expanded) setExpanded(false);
    }
  };

  const remaining = sessionRemainingDays(session);

  return (
    <div
      tabIndex={-1}
      onKeyDown={onKey}
      className={clsx('flex flex-col bg-bg outline-none', expanded ? 'fixed inset-0 z-50 h-[100dvh]' : 'h-[calc(100dvh-3.5rem)]')}
      style={expanded ? { paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' } : undefined}
    >
      {/* toolbar */}
      {!expanded && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-line/70 bg-side px-2 py-2 sm:px-3">
          <button type="button" className="icon-btn" onClick={() => navigate(`/sessions?id=${session.id}`)} aria-label="بازگشت به جلسه" title="بازگشت">
            <ArrowRight size={18} />
          </button>
          <div className="min-w-0 max-w-[14rem]">
            <p className="truncate text-sm font-bold">{session.name}</p>
            <div className="flex items-center gap-2">
              <Meter value={sessionProgress(session)} className="h-1 w-16" tone="accent" />
              <span className="num text-[11px] text-faint">{fmtNum(remaining)} روز باقی‌مانده</span>
            </div>
          </div>
          <Link to={`/journal?session=${session.id}`} className="btn-ghost py-1.5">
            <NotebookPen size={15} /> ژورنال
          </Link>
          <Link to={`/analytics?session=${session.id}`} className="btn-ghost hidden py-1.5 sm:inline-flex">
            <BarChart3 size={15} /> آنالیز
          </Link>
          <button
            type="button"
            className="icon-btn"
            title="اسکرین‌شات چارت"
            aria-label="اسکرین‌شات چارت"
            onClick={async () => {
              const s = await capture();
              if (s) setShot(s);
              else toast('گرفتن اسکرین‌شات انجام نشد', 'error');
            }}
          >
            <Camera size={17} />
          </button>

          <div className="ms-auto flex flex-wrap items-center gap-1.5">
            <span
              className="num hidden rounded-xl bg-raised px-2.5 py-1.5 text-[12px] text-muted md:inline"
              title={`${new Date(cursor).toISOString().slice(0, 16).replace('T', ' ')} UTC`}
            >
              {fmtDayLong(msToKey(cursor + 3.5 * 3_600_000), 'jalali', true)} · <b className="text-ink">{fmtTehran(cursor)}</b> تهران
            </span>
            <GoToMenu
              cursor={cursor}
              endMs={endMs}
              symbols={session.symbols}
              disabled={ended}
              onJump={(t, label) => {
                setPlaying(false);
                jumpTo(t);
                toast(`رفتید به: ${label}`, 'info');
              }}
            />
            <button
              type="button"
              onClick={() => setNewsOpen((v) => !v)}
              aria-pressed={newsOpen}
              className={clsx('btn-soft py-1.5', newsOpen && 'border-accent/60 text-accent-ink')}
            >
              <CalendarDays size={15} /> تقویم اقتصادی
            </button>
            <Popover
              align="end"
              panelClass="w-56 p-1.5"
              button={({ open, toggle }) => (
                <button type="button" onClick={toggle} aria-expanded={open} className="btn-soft py-1.5" title="تعداد چارت‌ها">
                  <LayoutGrid size={15} /> <span className="hidden sm:inline">چیدمان</span>
                </button>
              )}
            >
              {(close) => (
                <div className="flex flex-col gap-0.5">
                  {LAYOUTS.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        changeLayout(l.id);
                        close();
                      }}
                      className={clsx('flex items-center gap-3 rounded-xl px-3 py-2 text-start text-[13px] hover:bg-raised', l.id === layout && 'bg-raised text-accent-ink')}
                    >
                      <LayoutIcon id={l.id} />
                      {l.label}
                    </button>
                  ))}
                  <div className="my-1 h-px bg-line" />
                  <button
                    type="button"
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-start text-[12px] text-muted hover:bg-raised"
                    onClick={() => {
                      const next = enginePref === 'auto' ? 'lightweight' : 'auto';
                      setEnginePref(next);
                      local.setItem(ENGINE_KEY, next);
                      close();
                    }}
                  >
                    <Cpu size={15} />
                    {enginePref === 'auto' ? 'استفاده از موتور چارت داخلی' : tv ? 'استفاده از TradingView' : 'TradingView نصب نیست'}
                  </button>
                </div>
              )}
            </Popover>
            <button type="button" onClick={() => setExpanded(true)} className="btn-soft py-1.5" title="فقط چارت">
              <Maximize2 size={15} /> <span className="hidden sm:inline">بزرگ‌نمایی</span>
            </button>
          </div>
        </div>
      )}

      {/* charts + news */}
      <div className="flex min-h-0 flex-1">
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            className={clsx(
              'grid min-h-0 flex-1 grid-cols-1 gap-px bg-line/40',
              layoutDef.grid,
              layoutDef.count > 1 && 'auto-rows-[minmax(240px,1fr)] overflow-y-auto md:overflow-hidden',
            )}
          >
            {panes.slice(0, layoutDef.count).map((p, i) => (
              <div key={i} className={clsx('min-h-0', layoutDef.cells[i])}>
                <ChartPane
                  index={i}
                  pane={p}
                  engineKind={engineKind}
                  tv={tv}
                  cursor={cursor}
                  theme={theme}
                  sessionSymbols={session.symbols}
                  showHistory={showHistory}
                  dataVersion={dataVersion}
                  draft={draftForChart}
                  trades={trades}
                  news={chartNews}
                  active={i === activePane}
                  multi={layoutDef.count > 1}
                  callbacks={callbacksFor(i)}
                  onPaneChange={(np) => changePane(i, np)}
                  register={register}
                />
              </div>
            ))}
          </div>
          {ended && (
            <div className="absolute inset-x-0 top-12 z-10 mx-auto w-fit rounded-xl border border-line bg-raised px-4 py-2 text-xs font-semibold shadow-pop">
              این جلسه به تاریخ پایان رسیده است.
            </div>
          )}
          <PlaybackBar
            playing={playing}
            onTogglePlay={() => setPlaying((p) => !p)}
            onStep={step}
            speedIndex={speedIndex}
            onSpeedIndex={setSpeedIndex}
            stepTf={stepTf}
            onStepTf={setStepTf}
            disabled={ended}
          />
        </div>
        {newsOpen && (
          <div className="fixed inset-x-0 bottom-0 top-1/3 z-40 lg:static lg:z-auto">
            <NewsPanel
              events={news.events}
              source={news.source}
              loading={news.loading}
              cursor={cursor}
              filters={newsFilters}
              autoCurrencies={autoCurrencies}
              onFilters={setNewsFilters}
              onClose={() => setNewsOpen(false)}
            />
          </div>
        )}
      </div>

      {/* order ticket: appears after Buy / Sell */}
      {draft && preview && (
        <div className="anim-fade flex flex-wrap items-center gap-2 border-t border-line/70 bg-surface px-3 py-2">
          <span
            className={clsx('rounded-lg px-2 py-1 text-[12px] font-bold', draft.side === 'buy' ? 'bg-gain/15 text-gain' : 'bg-loss/15 text-loss')}
            title="نوع سفارش از جای قیمت ورود نسبت به قیمت فعلی تشخیص داده می‌شود"
          >
            {orderTitle(draft.side, preview.type)}
          </span>
          <PriceInput id="draft-entry" label="ورود" value={draft.entry} digits={SYMBOL_MAP[draft.symbol]?.digits ?? 2} onChange={(entry) => setDraft({ ...draft, entry })} />
          {preview.type !== 'market' && (
            <button
              type="button"
              className="chip hover:text-ink"
              onClick={() => setDraft({ ...draft, entry: roundToTick(draft.symbol, draftPrice) })}
              title="قیمت ورود = قیمت فعلی بازار"
            >
              قیمت بازار
            </button>
          )}
          <PriceInput id="draft-sl" label="SL" tone="text-loss" value={draft.sl} digits={SYMBOL_MAP[draft.symbol]?.digits ?? 2} onChange={(sl) => setDraft({ ...draft, sl })} />
          <PriceInput id="draft-tp" label="TP" tone="text-gain" value={draft.tp} digits={SYMBOL_MAP[draft.symbol]?.digits ?? 2} onChange={(tp) => setDraft({ ...draft, tp })} />
          <span className="num text-[12px] text-muted">
            R:R <b className="text-ink">{preview.rr.toFixed(2)}</b> · ریسک <b className="text-loss">{fmtUsd(preview.riskUsd)}</b> ·{' '}
            <b className="text-ink">{fmtLots(preview.lots, draft.symbol)}</b> لات
          </span>
          <button type="button" className="btn-soft py-1.5" onClick={() => setJournalFor('draft')}>
            <NotebookPen size={15} /> ذخیره ژورنال {draftJournal && <span className="h-1.5 w-1.5 rounded-full bg-gain" />}
          </button>
          <button type="button" className="btn-primary py-1.5" onClick={place} disabled={!!preview.problem}>
            <Send size={15} className="-scale-x-100" /> ثبت معامله
          </button>
          <button type="button" className="icon-btn h-8 w-8" onClick={() => setDraft(null)} aria-label="لغو" title="لغو (Esc)">
            <X size={16} />
          </button>
          {(preview.problem || missingRequired.length > 0) && (
            <p className="w-full text-end text-[11px] text-amber">{preview.problem || `${fmtNum(missingRequired.length)} آیتم الزامی چک‌لیست هنوز تیک نخورده (در ژورنال).`}</p>
          )}
        </div>
      )}

      {/* order bar */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line/70 bg-side px-3 py-2">
        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
          <div className="flex items-center gap-1.5">
            <dt className="text-muted">موجودی:</dt>
            <dd className="num font-bold">{fmtUsd(balance)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="text-muted">سود/زیان محقق:</dt>
            <dd className={clsx('num font-bold', realized > 0 ? 'text-gain' : realized < 0 ? 'text-loss' : '')}>{fmtUsd(realized, 2, true)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="text-muted">سود/زیان باز:</dt>
            <dd className={clsx('num font-bold', floating > 0 ? 'text-gain' : floating < 0 ? 'text-loss' : '')}>{fmtUsd(floating, 2, true)}</dd>
          </div>
          <button
            type="button"
            onClick={() => setPositionsOpen((v) => !v)}
            aria-expanded={positionsOpen}
            className={clsx('icon-btn h-8 w-auto gap-1 px-2 text-[12px]', positionsOpen && 'bg-raised text-ink')}
            title="پوزیشن‌های باز و بسته"
          >
            {positionsOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            <span className="num">پوزیشن‌ها ({fmtNum(trades.filter((t) => t.status === 'open' || t.status === 'pending').length)})</span>
          </button>
        </dl>

        <div className="ms-auto flex flex-wrap items-center gap-2">
          <button type="button" className={clsx('btn-buy px-5 py-1.5', draft?.side === 'buy' && 'ring-2 ring-gain/40')} onClick={() => startDraft('buy')} disabled={ended}>
            خرید
          </button>
          <button type="button" className={clsx('btn-sell px-5 py-1.5', draft?.side === 'sell' && 'ring-2 ring-loss/40')} onClick={() => startDraft('sell')} disabled={ended}>
            فروش
          </button>
          <div className="flex items-center gap-1 rounded-xl border border-line bg-raised/70 px-1 py-0.5" title="درصد ریسک هر معامله از موجودی">
            <button type="button" className="icon-btn h-7 w-7" onClick={() => setRiskPct(riskPct - 0.25)} aria-label="کم کردن ریسک">
              <Minus size={14} />
            </button>
            <label htmlFor="risk-pct" className="text-[11px] text-muted">
              ریسک
            </label>
            <input
              id="risk-pct"
              className="num w-10 bg-transparent text-center text-[13px] font-bold outline-none"
              dir="ltr"
              inputMode="decimal"
              value={riskPct}
              onChange={(e) => {
                const n = Number(toLatinDigits(e.target.value).replace(/[^\d.]/g, ''));
                if (Number.isFinite(n) && n > 0) setRiskPct(n);
              }}
            />
            <span className="text-[12px] text-muted">٪</span>
            <button type="button" className="icon-btn h-7 w-7" onClick={() => setRiskPct(riskPct + 0.25)} aria-label="زیاد کردن ریسک">
              <Plus size={14} />
            </button>
          </div>
          {expanded && (
            <button type="button" onClick={() => setExpanded(false)} className="btn-soft py-1.5" title="خروج از حالت بزرگ (Esc)">
              <Minimize2 size={15} /> خروج از بزرگ‌نمایی
            </button>
          )}
          {!draft && (
            <span className="num text-[12px] text-muted" title="حجم بر اساس ریسک و حد ضرر پیش‌فرض (۱٫۵ برابر ATR) محاسبه می‌شود">
              حجم ≈ <b className="text-ink">{fmtLots(idleLots, active.symbol)}</b> لات
            </span>
          )}
        </div>
      </div>

      {positionsOpen && (
        <div className="anim-up h-[min(42vh,320px)] shrink-0 border-t border-line/70 bg-side">
          <PositionsPanel
            trades={trades}
            cursor={cursor}
            showHistory={showHistory}
            onShowHistory={setShowHistory}
            onClose={(t) => setCloseId(t.id)}
            onCancel={(t) => {
              useStore.getState().cancelOrder(t.id);
              toast('سفارش لغو شد', 'info');
            }}
            onJournal={(t) => setJournalFor(t.id)}
          />
        </div>
      )}

      <CloseModal
        trade={trades.find((t) => t.id === closeId && t.status === 'open') ?? null}
        cursor={cursor}
        onClose={() => setCloseId(null)}
        onConfirm={(lots) => {
          const t = useStore.getState().closePosition(closeId!, lots);
          setCloseId(null);
          if (t)
            toast(t.status === 'closed' ? `پوزیشن بسته شد: ${fmtUsd(t.pnl ?? 0, 2, true)}` : `${faDigits(lots.toFixed(2))} لات بسته شد`, (t.pnl ?? 0) >= 0 ? 'success' : 'error');
        }}
      />

      <JournalModal
        open={!!journalCtx}
        ctx={journalCtx}
        onClose={() => setJournalFor(null)}
        initial={journalFor === 'draft' ? (draftJournal ?? undefined) : journalTrade?.journal}
        defaultChecklistId={session.checklistId}
        onCapture={capture}
        onSave={(entry) => {
          if (journalFor === 'draft') {
            setDraftJournal(entry);
            toast('ژورنال آماده شد؛ با ثبت معامله ذخیره می‌شود');
          } else if (journalTrade) {
            useStore.getState().saveJournal(journalTrade.id, entry);
            toast('ژورنال ذخیره شد');
          }
          setJournalFor(null);
        }}
        onDelete={
          journalTrade?.journal
            ? () => {
                useStore.getState().deleteJournal(journalTrade.id);
                setJournalFor(null);
                toast('ژورنال حذف شد', 'info');
              }
            : undefined
        }
      />

      {shot && (
        <Modal
          open
          onClose={() => setShot(null)}
          size="xl"
          title="اسکرین‌شات چارت"
          footer={
            <>
              <a href={shot} download={`${active.symbol}-${fmtDay(msToKey(cursor)).replace(/\//g, '-')}.jpg`} className="btn-soft">
                دانلود تصویر
              </a>
              {draft && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={async () => {
                    const shotId = await saveShot(shot);
                    setDraftJournal((j) => ({ ...(j ?? emptyJournal(session.checklistId)), screenshots: [...(j?.screenshots ?? []), shotId] }));
                    setShot(null);
                    toast('به ژورنال این معامله اضافه شد');
                  }}
                >
                  افزودن به ژورنال معامله
                </button>
              )}
            </>
          }
        >
          <img src={shot} alt={`چارت ${active.symbol} در ${fmtMarketTime(cursor)}`} className="w-full rounded-xl" />
        </Modal>
      )}
    </div>
  );
}
