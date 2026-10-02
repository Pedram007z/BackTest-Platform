import clsx from 'clsx';
import { ChartColumn } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EquityArea, ValueBars } from '../components/charts/Charts';
import { EmptyState, Select } from '../components/ui/controls';
import { WEEKDAY_NAMES } from '../lib/calendar';
import { fmtNum, fmtPct, fmtR, fmtUsd } from '../lib/format';
import { closedOnly, equitySeries, summarize } from '../lib/stats';
import { useStore } from '../store/useStore';

export default function Analytics() {
  const trades = useStore((s) => s.trades);
  const sessions = useStore((s) => s.sessions);
  const strategies = useStore((s) => s.strategies);
  const [session, setSession] = useState('all');
  const [strategy, setStrategy] = useState('all');

  const list = useMemo(
    () => trades.filter((t) => (session === 'all' || t.sessionId === session) && (strategy === 'all' || t.strategyId === strategy)),
    [trades, session, strategy],
  );
  const closed = closedOnly(list);
  const s = summarize(list);
  const equity = equitySeries(list, 0);

  const bySymbol = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of closed) m.set(t.symbol, (m.get(t.symbol) ?? 0) + (t.pnl ?? 0));
    return [...m.entries()].map(([label, value]) => ({ label, value }));
  }, [closed]);

  // Market weekday (Mon–Fri) win rate
  const byWeekday = useMemo(
    () =>
      [1, 2, 3, 4, 5].map((wd) => {
        const day = closed.filter((t) => new Date(t.openTime).getUTCDay() === wd);
        const wins = day.filter((t) => (t.pnl ?? 0) > 0).length;
        return { label: WEEKDAY_NAMES[wd], value: day.length ? (wins / day.length) * 100 : 0, hint: `${fmtNum(day.length)} معامله` };
      }),
    [closed],
  );

  const sides = (['buy', 'sell'] as const).map((side) => {
    const x = summarize(closed.filter((t) => t.side === side));
    return { side, ...x };
  });

  const tiles = [
    { l: 'سود خالص', v: fmtUsd(s.netPnl, 2, true), tone: s.netPnl >= 0 ? 'gain' : 'loss' },
    { l: 'وین‌ریت', v: fmtPct(s.winRate) },
    { l: 'فاکتور سود', v: Number.isFinite(s.profitFactor) ? fmtNum(s.profitFactor, 2) : '∞' },
    { l: 'امید ریاضی (R)', v: fmtR(s.avgR), tone: s.avgR >= 0 ? 'gain' : 'loss' },
    { l: 'بیشترین افت سرمایه', v: fmtUsd(-s.maxDrawdown), tone: 'loss' },
    { l: 'میانگین سود / زیان', v: `${fmtUsd(s.avgWin, 0)} / ${fmtUsd(-s.avgLoss, 0)}` },
  ];

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">آنالیز</h1>
          <p className="mt-1 text-sm text-muted">عملکرد معاملات بسته‌شده، بر اساس جلسه یا استراتژی.</p>
        </div>
        <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
          <div className="sm:w-52">
            <Select value={session} onChange={setSession} options={[{ value: 'all', label: 'همه‌ی جلسات' }, ...sessions.map((x) => ({ value: x.id, label: x.name }))]} />
          </div>
          <div className="sm:w-52">
            <Select value={strategy} onChange={setStrategy} options={[{ value: 'all', label: 'همه‌ی استراتژی‌ها' }, ...strategies.map((x) => ({ value: x.id, label: x.name }))]} />
          </div>
        </div>
      </div>

      {closed.length === 0 ? (
        <div className="card">
          <EmptyState icon={<ChartColumn size={24} />} title="داده‌ای برای تحلیل نیست" text="با این فیلترها معامله‌ی بسته‌شده‌ای وجود ندارد." />
        </div>
      ) : (
        <>
          <dl className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {tiles.map((t) => (
              <div key={t.l} className="card px-4 py-3">
                <dt className="text-xs text-muted">{t.l}</dt>
                <dd className={clsx('num mt-0.5 truncate text-base font-bold', t.tone === 'gain' && 'text-gain', t.tone === 'loss' && 'text-loss')}>{t.v}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card p-5 lg:col-span-2">
              <h2 className="mb-1 text-sm font-bold">منحنی سود تجمعی (دلار)</h2>
              <p className="num mb-3 text-xs text-faint">{fmtNum(closed.length)} معامله‌ی بسته‌شده به ترتیب زمان بازار</p>
              <EquityArea data={equity} baseline={0} height={260} />
            </section>
            <section className="card p-5">
              <h2 className="mb-3 text-sm font-bold">سود / زیان به تفکیک نماد</h2>
              <ValueBars data={bySymbol} signed format={(v) => fmtUsd(v, 2, true)} />
            </section>
            <section className="card p-5">
              <h2 className="mb-3 text-sm font-bold">وین‌ریت به تفکیک روز هفته (بازار)</h2>
              <ValueBars data={byWeekday} pct format={(v) => fmtPct(v)} />
            </section>
            <section className="card p-5 lg:col-span-2">
              <h2 className="mb-4 text-sm font-bold">خرید در برابر فروش</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {sides.map((x) => (
                  <div key={x.side} className="rounded-xl bg-raised/50 p-4">
                    <p className={clsx('mb-3 text-sm font-bold', x.side === 'buy' ? 'text-gain' : 'text-loss')}>{x.side === 'buy' ? 'معاملات خرید' : 'معاملات فروش'}</p>
                    <dl className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <dt className="text-muted">تعداد</dt>
                        <dd className="num mt-0.5 text-sm font-bold">{fmtNum(x.total)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">وین‌ریت</dt>
                        <dd className="num mt-0.5 text-sm font-bold">{fmtPct(x.winRate, 1)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">مجموع R</dt>
                        <dd className="num mt-0.5 text-sm font-bold">{fmtR(x.netR)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">سود</dt>
                        <dd className={clsx('num mt-0.5 truncate text-sm font-bold', x.netPnl >= 0 ? 'text-gain' : 'text-loss')}>{fmtUsd(x.netPnl, 0, true)}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
