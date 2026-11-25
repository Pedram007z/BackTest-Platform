import clsx from 'clsx';
import { ArrowDownUp, Download } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Area, AreaChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartTheme } from '../../hooks/useChartTheme';
import { GREGORIAN_MONTHS, fmtDay } from '../../lib/calendar';
import { faDigits, fmtCompact, fmtNum, fmtPct, fmtUsd } from '../../lib/format';
import { dayKeyIn, fmtClock } from '../../lib/timezone';
import type { ClosedTrade } from '../../pine/broker';
import type { LogLine } from '../../pine/core';
import type { Perf, Report } from '../../pine/report';
import type { RunOk } from '../../pine/run';
import { useStore } from '../../store/useStore';

/** The tester's result panels, as TradingView's Strategy Tester: overview, performance summary, list of trades, monthly returns, logs. */

type Tab = 'overview' | 'perf' | 'trades' | 'monthly' | 'logs';

const signCls = (v: number) => (v > 0 ? 'text-gain' : v < 0 ? 'text-loss' : '');

function useFmtTime() {
  const tz = useStore((s) => s.chartTz);
  return (ms: number) => `${fmtDay(dayKeyIn(ms, tz))} ${fmtClock(ms, tz)}`;
}

function Tile({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: number }) {
  return (
    <div className="rounded-xl border border-line/70 bg-raised/30 px-3.5 py-3">
      <p className="text-[11px] text-muted">{label}</p>
      <p className={clsx('num mt-1 font-display text-lg font-bold', tone !== undefined && signCls(tone))}>{value}</p>
      {sub && <p className={clsx('num text-[11px]', tone !== undefined ? signCls(tone) : 'text-faint')}>{sub}</p>}
    </div>
  );
}

function EquityChart({ report }: { report: Report }) {
  const p = useChartTheme();
  const data = report.curve.map((c) => ({ t: c.t, equity: c.equity, bh: c.bh, dd: c.dd }));
  const date = (t: number) => {
    const d = new Date(t);
    return `${faDigits(d.getUTCDate())} ${GREGORIAN_MONTHS[d.getUTCMonth()]} ${faDigits(String(d.getUTCFullYear()).slice(2))}`;
  };
  const tip = ({ active, payload }: { active?: boolean; payload?: { payload: (typeof data)[number] }[] }) => {
    const row = active && payload?.[0]?.payload;
    if (!row) return null;
    return (
      <div className="rounded-lg border border-line bg-raised px-3 py-2 text-[12px] shadow-pop">
        <p className="mb-1 text-muted">{date(row.t)}</p>
        <p className="flex items-center gap-2">
          <span className="h-0.5 w-3 rounded" style={{ background: p.line }} /> سرمایه‌ی استراتژی: <b className="num">{fmtUsd(row.equity)}</b>
        </p>
        <p className="flex items-center gap-2">
          <span className="h-0.5 w-3 rounded" style={{ background: p.axis }} /> خرید و نگهداری: <b className="num">{fmtUsd(row.bh)}</b>
        </p>
        <p className="flex items-center gap-2">
          <span className="h-0.5 w-3 rounded" style={{ background: p.loss }} /> افت از سقف: <b className="num">{fmtUsd(row.dd)}</b>
        </p>
      </div>
    );
  };
  const axis = { fill: p.axis, fontSize: 11 };
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-4 text-[12px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ background: p.line }} /> سرمایه‌ی استراتژی
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded border-t border-dashed" style={{ borderColor: p.axis }} /> خرید و نگهداری
        </span>
      </div>
      <div className="chart-ltr h-56" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }} syncId="tester-equity">
            <CartesianGrid vertical={false} stroke={p.grid} strokeDasharray="4 4" />
            <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} tick={axis} tickLine={false} axisLine={{ stroke: p.grid }} tickFormatter={date} minTickGap={48} />
            <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={fmtCompact} width={56} domain={['auto', 'auto']} />
            <Tooltip content={tip as never} cursor={{ stroke: p.axis, strokeDasharray: '3 3' }} />
            <Area
              isAnimationActive={false}
              type="linear"
              dataKey="equity"
              stroke={p.line}
              strokeWidth={2}
              fill={p.line}
              fillOpacity={0.1}
              dot={false}
              activeDot={{ r: 4, stroke: p.surface, strokeWidth: 2 }}
            />
            <Line isAnimationActive={false} type="linear" dataKey="bh" stroke={p.axis} strokeWidth={1.5} strokeDasharray="4 3" dot={false} activeDot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mb-1 mt-3 text-[12px] text-muted">افت سرمایه از بالاترین سقف</p>
      <div className="chart-ltr h-24" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} syncId="tester-equity">
            <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} hide />
            <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={fmtCompact} width={56} />
            <Tooltip content={tip as never} cursor={{ stroke: p.axis, strokeDasharray: '3 3' }} />
            <Area
              isAnimationActive={false}
              type="linear"
              dataKey="dd"
              stroke={p.loss}
              strokeWidth={1.5}
              fill={p.loss}
              fillOpacity={0.18}
              dot={false}
              activeDot={{ r: 3, stroke: p.surface, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Overview({ r }: { r: Report }) {
  const a = r.all;
  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        <Tile label="سود خالص" value={fmtUsd(a.netProfit, 2, true)} sub={fmtPct(a.netProfitPct)} tone={a.netProfit} />
        <Tile label="کل معاملات بسته" value={fmtNum(a.totalTrades)} sub={r.openTrades ? `${fmtNum(r.openTrades)} معامله‌ی باز` : undefined} />
        <Tile label="درصد معاملات سودده" value={fmtPct(a.winRate)} sub={`${fmtNum(a.wins)} برد / ${fmtNum(a.losses)} باخت`} />
        <Tile label="فاکتور سود" value={Number.isFinite(a.profitFactor) ? fmtNum(a.profitFactor, 3) : a.profitFactor === Infinity ? '∞' : '—'} />
        <Tile label="حداکثر افت سرمایه" value={fmtUsd(-r.maxDrawdown)} sub={fmtPct(-r.maxDrawdownPct)} tone={-1} />
        <Tile label="میانگین هر معامله" value={fmtUsd(a.avgTrade, 2, true)} sub={fmtPct(a.avgTradePct)} tone={a.avgTrade} />
      </div>
      <div className="mt-5">{r.curve.length > 1 ? <EquityChart report={r} /> : <p className="py-8 text-center text-sm text-muted">داده‌ای برای منحنی سرمایه نیست.</p>}</div>
    </div>
  );
}

type Row = [label: string, f: (p: Perf) => ReactNode, allOnly?: ReactNode];

function PerformanceTable({ r }: { r: Report }) {
  const usd = (v: number, pct?: number) => (
    <span className={signCls(v)}>
      {fmtUsd(v, 2)}
      {pct !== undefined && Number.isFinite(pct) && <span className="ms-1.5 text-[11px] opacity-80">{fmtPct(pct)}</span>}
    </span>
  );
  const plain = (v: number, frac = 0) => fmtNum(v, frac);
  const rows: Row[] = [
    ['سود خالص', (p) => usd(p.netProfit, p.netProfitPct)],
    ['سود ناخالص', (p) => usd(p.grossProfit, p.grossProfitPct)],
    ['زیان ناخالص', (p) => usd(-p.grossLoss, -p.grossLossPct)],
    ['حداکثر رشد سرمایه', () => null, usd(r.maxRunup, r.maxRunupPct)],
    ['حداکثر افت سرمایه', () => null, usd(-r.maxDrawdown, -r.maxDrawdownPct)],
    ['بازده خرید و نگهداری', () => null, usd(r.buyHold, r.buyHoldPct)],
    ['نسبت شارپ', () => null, plain(r.sharpe, 3)],
    ['نسبت سورتینو', () => null, plain(r.sortino, 3)],
    ['فاکتور سود', (p) => (p.profitFactor === Infinity ? '∞' : plain(p.profitFactor, 3))],
    ['بیشترین حجم هم‌زمان', (p) => plain(p.maxContracts, 2)],
    ['سود و زیان باز', () => null, usd(r.openPnl)],
    ['کمیسیون پرداخت‌شده', (p) => fmtUsd(p.commission)],
    ['کل معاملات بسته', (p) => plain(p.totalTrades)],
    ['معاملات باز', () => null, plain(r.openTrades)],
    ['معاملات سودده', (p) => plain(p.wins)],
    ['معاملات زیان‌ده', (p) => plain(p.losses)],
    ['درصد معاملات سودده', (p) => fmtPct(p.winRate)],
    ['میانگین هر معامله', (p) => usd(p.avgTrade, p.avgTradePct)],
    ['میانگین معامله‌ی سودده', (p) => usd(p.avgWin, p.avgWinPct)],
    ['میانگین معامله‌ی زیان‌ده', (p) => usd(-p.avgLoss, -p.avgLossPct)],
    ['نسبت میانگین سود به زیان', (p) => plain(p.ratioWinLoss, 3)],
    ['بزرگ‌ترین سود', (p) => usd(p.largestWin, p.largestWinPct)],
    ['بزرگ‌ترین زیان', (p) => usd(-p.largestLoss, -p.largestLossPct)],
    ['میانگین تعداد کندل هر معامله', (p) => plain(p.avgBars, 1)],
    ['میانگین کندل معاملات سودده', (p) => plain(p.avgBarsWin, 1)],
    ['میانگین کندل معاملات زیان‌ده', (p) => plain(p.avgBarsLoss, 1)],
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-[13px]">
        <thead className="bg-raised/40">
          <tr>
            <th className="th">شاخص</th>
            <th className="th">همه</th>
            <th className="th">خرید (Long)</th>
            <th className="th">فروش (Short)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, f, allOnly]) => (
            <tr key={label} className="border-t border-line/50">
              <td className="td text-muted">{label}</td>
              {allOnly !== undefined ? (
                <td className="td num" colSpan={3}>
                  {allOnly}
                </td>
              ) : (
                [r.all, r.long, r.short].map((p, i) => (
                  <td key={i} className="td num">
                    {f(p)}
                  </td>
                ))
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TradesTable({ result, contractSize, digits }: { result: RunOk; contractSize: number; digits: number }) {
  const s = result.strategy!;
  const fmtTime = useFmtTime();
  const [newest, setNewest] = useState(true);
  const [page, setPage] = useState(0);
  const size = 50;
  const rows = useMemo(() => {
    const closed = s.closed.map((t, i) => ({ n: i + 1, t, open: false as const }));
    const open = s.open.map((t, i) => ({ n: s.closed.length + i + 1, t, open: true as const }));
    const all = [...closed, ...open];
    return newest ? all.reverse() : all;
  }, [s, newest]);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const shown = rows.slice(page * size, page * size + size);

  const csv = () => {
    const head = [
      '#',
      'side',
      'entry_id',
      'entry_time',
      'entry_price',
      'exit_id',
      'exit_time',
      'exit_price',
      'qty',
      'profit_usd',
      'profit_pct',
      'cum_profit',
      'runup',
      'drawdown',
      'commission',
    ];
    const lines = s.closed.map((t, i) =>
      [
        i + 1,
        t.side > 0 ? 'long' : 'short',
        t.entryId,
        new Date(t.entryTime).toISOString(),
        t.entryPrice,
        t.exitId,
        new Date(t.exitTime).toISOString(),
        t.exitPrice,
        t.qty,
        t.profit.toFixed(2),
        t.profitPct.toFixed(3),
        t.cumProfit.toFixed(2),
        t.runup.toFixed(2),
        t.drawdown.toFixed(2),
        t.commission.toFixed(2),
      ]
        .map((v) => (typeof v === 'string' && /[",]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v))
        .join(','),
    );
    const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${result.decl.title.replace(/[^\w؀-ۿ-]+/g, '_')}-trades.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  if (!rows.length) return <p className="py-10 text-center text-sm text-muted">استراتژی در این بازه هیچ معامله‌ای انجام نداد.</p>;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" className="btn-ghost h-8 px-2.5 text-[12px]" onClick={() => setNewest((v) => !v)}>
          <ArrowDownUp size={14} /> {newest ? 'جدیدترین اول' : 'قدیمی‌ترین اول'}
        </button>
        <button type="button" className="btn-ghost h-8 px-2.5 text-[12px]" onClick={csv} disabled={!s.closed.length}>
          <Download size={14} /> خروجی CSV
        </button>
        <span className="num ms-auto text-[12px] text-faint">{fmtNum(rows.length)} معامله</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-[12px]">
          <thead className="bg-raised/40">
            <tr>
              {['#', 'نوع', 'ورود', 'خروج', 'حجم', 'سود', 'سود تجمعی', 'بیشترین سود / زیان در مسیر'].map((h) => (
                <th key={h} className="th">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map(({ n, t, open }) => {
              const c = t as ClosedTrade;
              const profit = open ? (t as { profit: number }).profit : c.profit;
              return (
                <tr key={n} className="border-t border-line/50 align-top">
                  <td className="td num text-faint">{fmtNum(n)}</td>
                  <td className="td">
                    <span className={clsx('rounded-md px-1.5 py-0.5 text-[11px] font-bold', t.side > 0 ? 'bg-gain/15 text-gain' : 'bg-loss/15 text-loss')}>
                      {t.side > 0 ? 'خرید' : 'فروش'}
                    </span>
                    {open && <span className="ms-1 rounded-md bg-amber/15 px-1.5 py-0.5 text-[11px] font-bold text-amber">باز</span>}
                  </td>
                  <td className="td">
                    <p className="num" dir="ltr">
                      {(open ? (t as { price: number }).price : c.entryPrice).toFixed(digits)}
                    </p>
                    <p className="num text-faint">{fmtTime(open ? (t as { time: number }).time : c.entryTime)}</p>
                    <p className="truncate text-faint" dir="auto" title={(t as ClosedTrade).entryComment || t.entryId}>
                      {(open ? (t as { comment: string }).comment : c.entryComment) || t.entryId}
                    </p>
                  </td>
                  <td className="td">
                    {open ? (
                      <span className="text-faint">—</span>
                    ) : (
                      <>
                        <p className="num" dir="ltr">
                          {c.exitPrice.toFixed(digits)}
                        </p>
                        <p className="num text-faint">{fmtTime(c.exitTime)}</p>
                        <p className="truncate text-faint" dir="auto">
                          {c.exitComment || c.exitId}
                        </p>
                      </>
                    )}
                  </td>
                  <td className="td num">
                    {fmtNum(t.qty, 4)}
                    {contractSize > 1 && <p className="text-[11px] text-faint">{fmtNum(t.qty / contractSize, 2)} لات</p>}
                  </td>
                  <td className={clsx('td num font-semibold', signCls(profit))}>
                    {fmtUsd(profit, 2, true)}
                    {!open && <p className="text-[11px] font-normal opacity-80">{fmtPct(c.profitPct)}</p>}
                  </td>
                  <td className={clsx('td num', !open && signCls(c.cumProfit))}>{open ? '—' : fmtUsd(c.cumProfit)}</td>
                  <td className="td num">
                    {open ? (
                      '—'
                    ) : (
                      <>
                        <span className="text-gain">{fmtUsd(c.runup)}</span>
                        <span className="mx-1 text-faint">/</span>
                        <span className="text-loss">{fmtUsd(-c.drawdown)}</span>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2 text-[12px]">
          <button type="button" className="btn-ghost h-8 px-3" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            قبلی
          </button>
          <span className="num text-muted">
            {fmtNum(page + 1)} از {fmtNum(pages)}
          </span>
          <button type="button" className="btn-ghost h-8 px-3" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
            بعدی
          </button>
        </div>
      )}
    </div>
  );
}

function Monthly({ r }: { r: Report }) {
  if (!r.monthly.length) return <p className="py-10 text-center text-sm text-muted">هنوز معامله‌ی بسته‌ای نیست.</p>;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {r.monthly.map((m) => {
        const [y, mo] = m.month.split('-').map(Number);
        return (
          <div
            key={m.month}
            className={clsx('rounded-xl border px-3 py-2.5', m.profit > 0 ? 'border-gain/40 bg-gain/10' : m.profit < 0 ? 'border-loss/40 bg-loss/10' : 'border-line')}
          >
            <p className="text-[11px] text-muted">
              {GREGORIAN_MONTHS[mo - 1]} {faDigits(y)}
            </p>
            <p className={clsx('num font-bold', signCls(m.profit))}>{fmtUsd(m.profit, 0, true)}</p>
            <p className="num text-[11px] text-muted">{fmtPct(m.returnPct)}</p>
          </div>
        );
      })}
    </div>
  );
}

function Logs({ logs }: { logs: LogLine[] }) {
  const fmtTime = useFmtTime();
  if (!logs.length) return <p className="py-10 text-center text-sm text-muted">اسکریپت پیامی ننوشته است. با log.info("…") پیام بنویسید تا اینجا نمایش داده شود.</p>;
  return (
    <ul className="max-h-[420px] overflow-y-auto font-mono text-[12px]" dir="ltr">
      {logs.map((l, i) => (
        <li key={i} className="flex gap-3 border-t border-line/40 px-1 py-1.5 first:border-0">
          <span className="shrink-0 text-faint">{fmtTime(l.time)}</span>
          <span className={clsx('shrink-0 font-bold', l.level === 'error' ? 'text-loss' : l.level === 'warning' ? 'text-amber' : 'text-sky')}>{l.level}</span>
          <span className="min-w-0 whitespace-pre-wrap break-words" dir="auto">
            {l.message}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Results({ result, locked, contractSize, digits }: { result: RunOk; locked: ReactNode | null; contractSize: number; digits: number }) {
  const isStrategy = !!result.strategy;
  const [tab, setTab] = useState<Tab>(isStrategy ? 'overview' : 'logs');
  const tabs: { id: Tab; label: string; hidden?: boolean }[] = [
    { id: 'overview', label: 'خلاصه', hidden: !isStrategy },
    { id: 'perf', label: 'گزارش عملکرد', hidden: !isStrategy },
    { id: 'trades', label: 'فهرست معاملات', hidden: !isStrategy },
    { id: 'monthly', label: 'بازده ماهانه', hidden: !isStrategy },
    { id: 'logs', label: `لاگ‌ها${result.logs.length ? ` (${faDigits(result.logs.length)})` : ''}` },
  ];
  const current = tabs.find((t) => t.id === tab && !t.hidden) ? tab : 'logs';
  const r = result.strategy?.report;
  return (
    <section className="card p-4 sm:p-5" aria-label="نتیجه‌ی تست">
      <div className="mb-4 flex flex-wrap gap-1 border-b border-line/60 pb-3" role="tablist">
        {tabs
          .filter((t) => !t.hidden)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={current === t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                'rounded-lg px-3 py-1.5 text-[13px] font-semibold transition',
                current === t.id ? 'bg-accent/15 text-accent-ink' : 'text-muted hover:bg-raised hover:text-ink',
              )}
            >
              {t.label}
            </button>
          ))}
      </div>
      {current !== 'logs' && locked ? (
        locked
      ) : current === 'overview' && r ? (
        <Overview r={r} />
      ) : current === 'perf' && r ? (
        <PerformanceTable r={r} />
      ) : current === 'trades' ? (
        <TradesTable result={result} contractSize={contractSize} digits={digits} />
      ) : current === 'monthly' && r ? (
        <Monthly r={r} />
      ) : (
        <Logs logs={result.logs} />
      )}
    </section>
  );
}
