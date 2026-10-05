import clsx from 'clsx';
import { BarChart3, ChevronLeft, ChevronRight, ListTree, NotebookPen, Pencil, Play, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { EquityArea, PnlBars } from '../components/charts/Charts';
import { SessionList } from '../components/sessions/SessionList';
import { SessionModal } from '../components/sessions/SessionModal';
import { ConfirmDialog } from '../components/ui/Modal';
import { EmptyState, InfoTip, Meter, Select } from '../components/ui/controls';
import { GREGORIAN_MONTHS, WEEKDAY_NAMES, fmtDay, fmtDayLong, fmtMarketTime, weekdayOf } from '../lib/calendar';
import { faDigits, fmtNum, fmtPct, fmtUsd } from '../lib/format';
import { SYMBOL_MAP } from '../lib/market';
import {
  closedOnly,
  dailyPerformance,
  equitySeries,
  monthlyPerformance,
  periodPnl,
  sessionBalance,
  sessionProgress,
  sessionRemainingDays,
  summarize,
  tradeReturns,
} from '../lib/stats';
import type { Session } from '../lib/types';
import { toast, useStore } from '../store/useStore';

const PAGE = 5;

function Tile({ label, value, tone, info }: { label: string; value: string; tone?: 'gain' | 'loss'; info: string }) {
  return (
    <div className="card px-4 py-3.5">
      <p className="flex items-center gap-1.5 text-xs text-muted">
        {label}
        <InfoTip text={info} />
      </p>
      <p className={clsx('num mt-1 truncate text-lg font-bold', tone === 'gain' && 'text-gain', tone === 'loss' && 'text-loss')}>{value}</p>
    </div>
  );
}

function ChartBox({ title, info, children }: { title: string; info: string; children: ReactNode }) {
  return (
    <section className="card p-4">
      <h3 className="mb-2 flex items-center gap-2 text-[13px] font-bold">
        {title}
        <InfoTip text={info} />
      </h3>
      {children}
    </section>
  );
}

function NotesBox({ session }: { session: Session }) {
  const updateSession = useStore((s) => s.updateSession);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(session.notes ?? '');
  useEffect(() => {
    setText(session.notes ?? '');
    setEditing(false);
  }, [session.id, session.notes]);
  return (
    <section className="card flex flex-col p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">یادداشت‌ها</h2>
        {!editing && (
          <button type="button" className="icon-btn h-8 w-8" onClick={() => setEditing(true)} aria-label="ویرایش یادداشت‌ها">
            <Pencil size={15} />
          </button>
        )}
      </div>
      {editing ? (
        <>
          <label className="sr-only" htmlFor="session-notes">
            یادداشت‌های جلسه
          </label>
          <textarea
            id="session-notes"
            autoFocus
            className="field min-h-[120px] flex-1 leading-7"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="هدف این جلسه، قوانین ورود، چیزهایی که باید رعایت کنید…"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              className="btn-ghost py-1.5"
              onClick={() => {
                setText(session.notes ?? '');
                setEditing(false);
              }}
            >
              انصراف
            </button>
            <button
              type="button"
              className="btn-primary py-1.5"
              onClick={() => {
                updateSession(session.id, { notes: text.trim() });
                setEditing(false);
                toast('یادداشت جلسه ذخیره شد');
              }}
            >
              ذخیره
            </button>
          </div>
        </>
      ) : session.notes ? (
        <p className="whitespace-pre-line text-sm leading-7 text-ink/90">{session.notes}</p>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-line px-4 py-6 text-sm text-muted hover:text-ink"
        >
          برای این جلسه یادداشت بنویسید
        </button>
      )}
    </section>
  );
}

function SessionDetail({ session, all, onSwitch }: { session: Session; all: Session[]; onSwitch: (id: string) => void }) {
  const navigate = useNavigate();
  const allTrades = useStore((s) => s.trades);
  const strategy = useStore((s) => s.strategies.find((x) => x.id === session.strategyId));
  const deleteSession = useStore((s) => s.deleteSession);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [session.id]);

  const trades = useMemo(() => allTrades.filter((t) => t.sessionId === session.id), [allTrades, session.id]);
  const returns = useMemo(() => tradeReturns(trades, [session]), [trades, session]);
  const s = summarize(trades);
  const balance = sessionBalance(session, trades);
  const period = periodPnl(trades, session.cursor);
  const remaining = sessionRemainingDays(session);
  const equity = equitySeries(trades, session.balance).map((p) => ({ ...p, label: p.time ? fmtMarketTime(p.time) : 'شروع' }));
  const monthly = monthlyPerformance(trades, 3).map((m) => {
    const [y, mo] = m.month.split('-').map(Number);
    return { label: GREGORIAN_MONTHS[mo - 1], title: `${GREGORIAN_MONTHS[mo - 1]} ${faDigits(y)}`, pnl: m.pnl };
  });
  const daily = dailyPerformance(trades, 6).map((d) => ({ label: WEEKDAY_NAMES[weekdayOf(d.day)], title: fmtDayLong(d.day, 'jalali', true), pnl: d.pnl }));
  const recent = closedOnly(trades).sort((a, b) => (b.closeTime ?? 0) - (a.closeTime ?? 0));
  const pages = Math.max(1, Math.ceil(recent.length / PAGE));
  const visible = recent.slice((page - 1) * PAGE, page * PAGE);
  const idx = all.findIndex((x) => x.id === session.id);

  return (
    <>
      {/* switcher + actions */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" className="icon-btn border border-line" disabled={idx <= 0} onClick={() => onSwitch(all[idx - 1].id)} aria-label="جلسه‌ی قبلی">
          <ChevronRight size={18} />
        </button>
        <div className="w-[min(100%,20rem)]">
          <Select
            id="session-switch"
            value={session.id}
            onChange={onSwitch}
            options={all.map((x) => ({ value: x.id, label: x.name, hint: x.symbols.map((sym) => SYMBOL_MAP[sym]?.ticker ?? sym).join('، ') }))}
          />
        </div>
        <button type="button" className="icon-btn border border-line" disabled={idx >= all.length - 1} onClick={() => onSwitch(all[idx + 1].id)} aria-label="جلسه‌ی بعدی">
          <ChevronLeft size={18} />
        </button>
        <div className="ms-auto flex flex-wrap gap-2">
          <Link to={`/analytics?session=${session.id}`} className="btn-soft py-1.5">
            <BarChart3 size={15} /> آنالیز جلسه
          </Link>
          <button type="button" className="btn-soft py-1.5" onClick={() => setEditing(true)}>
            <Pencil size={15} /> تنظیمات جلسه
          </button>
          <button type="button" className="btn py-1.5 text-loss hover:bg-loss/10" onClick={() => setConfirm(true)}>
            <Trash2 size={15} /> حذف جلسه
          </button>
        </div>
      </div>

      {/* info + notes */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card relative overflow-hidden p-5 lg:col-span-2">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-10 -top-16 h-48 w-72 rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgb(var(--accent) / 0.18), transparent)' }}
          />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-bold">{session.name}</h2>
              <p className="mt-1 text-xs text-muted">
                {strategy ? strategy.name : 'بدون استراتژی'} ·{' '}
                <span dir="ltr" className="font-semibold">
                  {session.symbols.map((x) => SYMBOL_MAP[x]?.ticker ?? x).join(', ')}
                </span>
              </p>
              <div className="num mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span>
                  {fmtDay(session.startDate)} تا {fmtDay(session.endDate)}
                </span>
                <span className={clsx('rounded-full px-2 py-0.5 font-bold', remaining > 0 ? 'bg-amber/15 text-amber' : 'bg-raised text-muted')}>
                  {remaining > 0 ? `${fmtNum(remaining)} روز باقی‌مانده` : 'تمام شده'}
                </span>
              </div>
            </div>
            <div className="text-end">
              <p className="text-xs text-muted">موجودی فعلی</p>
              <p className="num font-display text-3xl font-bold">{fmtUsd(balance)}</p>
              <p className="num text-xs text-faint">موجودی اولیه {fmtUsd(session.balance, 0)}</p>
            </div>
          </div>
          <div className="relative mt-5 flex flex-wrap items-end gap-4">
            <div className="min-w-[12rem] flex-1">
              <div className="num mb-1.5 flex justify-between text-[11px] text-muted">
                <span>پیشرفت بازپخش</span>
                <span>{fmtPct(sessionProgress(session) * 100, 0)}</span>
              </div>
              <Meter value={sessionProgress(session)} tone="accent" />
              <p className="num mt-1.5 text-[11px] text-faint">زمان بازار: {fmtMarketTime(session.cursor)} UTC</p>
            </div>
            <button type="button" className="btn-primary rounded-full px-5" onClick={() => navigate(`/replay/${session.id}`)}>
              رفتن به چارت <Play size={14} fill="currentColor" className="-scale-x-100" />
            </button>
          </div>
        </section>
        <NotesBox session={session} />
      </div>

      {/* charts */}
      {s.total === 0 ? (
        <div className="card mt-4">
          <EmptyState icon={<BarChart3 size={22} />} title="هنوز معامله‌ای بسته نشده" text="با «رفتن به چارت» بازپخش را ادامه دهید و اولین معامله را ثبت کنید." />
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <ChartBox title="منحنی اکوئیتی" info="موجودی بعد از هر معامله‌ی بسته‌شده.">
              <EquityArea data={equity} baseline={session.balance} height={190} />
            </ChartBox>
            <ChartBox title="عملکرد ماهانه" info="سود و زیان سه ماه اخیر (دلار، ماه بسته شدن معامله).">
              <PnlBars data={monthly} layout="vertical" height={190} />
            </ChartBox>
            <ChartBox title="عملکرد روزانه" info="سود و زیان شش روز معاملاتی اخیر.">
              <PnlBars data={daily} layout="horizontal" height={190} />
            </ChartBox>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Tile label="سود/زیان کل" value={fmtUsd(s.netPnl, 2, true)} tone={s.netPnl >= 0 ? 'gain' : 'loss'} info="جمع سود و زیان معاملات بسته‌شده." />
            <Tile label="وین‌ریت" value={fmtPct(s.winRate)} info="درصد معاملات برنده." />
            <Tile label="ریسک به ریوارد" value={s.payoff ? fmtNum(s.payoff, 2) : '—'} info="میانگین سود معاملات برنده تقسیم بر میانگین زیان معاملات بازنده." />
            <Tile label="سود/زیان ماه" value={fmtUsd(period.month, 2, true)} tone={period.month >= 0 ? 'gain' : 'loss'} info="در ماه جاری بازپخش (زمان بازار)." />
            <Tile label="سود/زیان هفته" value={fmtUsd(period.week, 2, true)} tone={period.week >= 0 ? 'gain' : 'loss'} info="از دوشنبه‌ی هفته‌ی جاری بازپخش تا الان." />
            <Tile label="سود/زیان روز" value={fmtUsd(period.day, 2, true)} tone={period.day >= 0 ? 'gain' : 'loss'} info="در روز جاری بازپخش." />
          </div>
        </>
      )}

      {/* recent trades */}
      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="font-display text-base font-bold">معاملات اخیر</h2>
        <Link to={`/journal?session=${session.id}`} className="btn-soft py-1.5">
          <NotebookPen size={15} /> ژورنال
        </Link>
      </div>
      <div className="card overflow-hidden">
        {visible.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">معامله‌ی بسته‌شده‌ای نیست.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-[13px]">
              <thead className="bg-raised/40">
                <tr>
                  <th className="th">نام جلسه</th>
                  <th className="th">تاریخ معامله</th>
                  <th className="th">جفت‌ارز</th>
                  <th className="th">بازده (ROI)</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((t) => {
                  const roi = returns.get(t.id) ?? 0;
                  return (
                    <tr key={t.id} className="border-t border-line/50">
                      <td className="td">{session.name}</td>
                      <td className="td num text-muted">{fmtMarketTime(t.closeTime ?? t.openTime)}</td>
                      <td className="td font-bold" dir="ltr" style={{ textAlign: 'right' }}>
                        {SYMBOL_MAP[t.symbol]?.ticker ?? t.symbol}
                      </td>
                      <td className={clsx('td num font-bold', roi >= 0 ? 'text-gain' : 'text-loss')}>
                        {roi >= 0 ? '+' : ''}
                        {fmtPct(roi, 2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {recent.length > PAGE && (
        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted">
          <button type="button" className="icon-btn h-8 w-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="صفحه قبل">
            <ChevronRight size={16} />
          </button>
          <span className="num">
            صفحه {fmtNum(page)} از {fmtNum(pages)}
          </span>
          <button type="button" className="icon-btn h-8 w-8" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label="صفحه بعد">
            <ChevronLeft size={16} />
          </button>
        </div>
      )}

      <SessionModal open={editing} onClose={() => setEditing(false)} session={session} />
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="حذف جلسه"
        message={`جلسه «${session.name}» و ${fmtNum(trades.length)} معامله‌ی آن حذف می‌شود. این کار قابل بازگشت نیست.`}
        confirmLabel="حذف جلسه"
        onConfirm={() => {
          deleteSession(session.id);
          toast('جلسه حذف شد', 'info');
        }}
      />
    </>
  );
}

type Status = 'all' | 'active' | 'done';
type Sort = 'recent' | 'created' | 'name';

function SessionsList({ sessions }: { sessions: Session[] }) {
  const strategies = useStore((s) => s.strategies);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<Status>('all');
  const [strategy, setStrategy] = useState('all');
  const [sort, setSort] = useState<Sort>('recent');

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return sessions
      .filter((s) => !query || s.name.toLowerCase().includes(query) || s.symbols.some((x) => x.toLowerCase().includes(query)))
      .filter((s) => status === 'all' || (status === 'done' ? sessionRemainingDays(s) === 0 : sessionRemainingDays(s) > 0))
      .filter((s) => strategy === 'all' || s.strategyId === strategy)
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name, 'fa');
        if (sort === 'created') return b.createdAt - a.createdAt;
        return (b.lastOpenedAt ?? b.createdAt) - (a.lastOpenedAt ?? a.createdAt);
      });
  }, [sessions, q, status, strategy, sort]);

  return (
    <>
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint" />
          <input id="session-search" className="field pr-9" placeholder="جستجو در نام جلسه یا نماد…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="sm:w-40">
          <Select
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'همه‌ی جلسات' },
              { value: 'active', label: 'در حال انجام' },
              { value: 'done', label: 'تمام‌شده' },
            ]}
          />
        </div>
        <div className="sm:w-48">
          <Select value={strategy} onChange={setStrategy} options={[{ value: 'all', label: 'همه‌ی استراتژی‌ها' }, ...strategies.map((s) => ({ value: s.id, label: s.name }))]} />
        </div>
        <div className="sm:w-44">
          <Select
            value={sort}
            onChange={setSort}
            options={[
              { value: 'recent', label: 'آخرین بازدید' },
              { value: 'created', label: 'جدیدترین' },
              { value: 'name', label: 'بر اساس نام' },
            ]}
          />
        </div>
      </div>
      <SessionList sessions={list} initialPageSize={10} emptyText={sessions.length ? 'جلسه‌ای با این فیلترها پیدا نشد.' : 'هنوز جلسه‌ای نساخته‌اید.'} />
    </>
  );
}

export default function Sessions() {
  const sessions = useStore((s) => s.sessions);
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const sorted = useMemo(() => [...sessions].sort((a, b) => (b.lastOpenedAt ?? b.createdAt) - (a.lastOpenedAt ?? a.createdAt)), [sessions]);
  const view = params.get('view') === 'list' ? 'list' : 'detail';
  const selected = sorted.find((s) => s.id === params.get('id')) ?? sorted[0];
  const active = sessions.filter((s) => sessionRemainingDays(s) > 0).length;

  const go = (next: Record<string, string>) => setParams(next, { replace: true });

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">جلسات بک‌تست</h1>
          <p className="num mt-1 text-sm text-muted">
            {fmtNum(sessions.length)} جلسه، {fmtNum(active)} در حال انجام
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="seg">
            <button type="button" className={clsx('seg-item', view === 'detail' && 'seg-item-on')} onClick={() => go(selected ? { id: selected.id } : {})}>
              جزئیات جلسه
            </button>
            <button type="button" className={clsx('seg-item flex items-center gap-1', view === 'list' && 'seg-item-on')} onClick={() => go({ view: 'list' })}>
              <ListTree size={14} /> همه‌ی جلسات
            </button>
          </div>
          <button type="button" className="btn-primary rounded-full px-4" onClick={() => setCreating(true)}>
            <Plus size={16} /> جلسه جدید
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <SessionsList sessions={sessions} />
      ) : selected ? (
        <SessionDetail session={selected} all={sorted} onSwitch={(id) => go({ id })} />
      ) : (
        <div className="card">
          <EmptyState
            icon={<Play size={22} />}
            title="هنوز جلسه‌ای ندارید"
            text="یک جلسه‌ی بک‌تست بسازید: نماد، بازه‌ی تاریخ و موجودی را انتخاب کنید."
            action={
              <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
                <Plus size={16} /> ساخت اولین جلسه
              </button>
            }
          />
        </div>
      )}
      <SessionModal open={creating} onClose={() => setCreating(false)} onCreated={(s) => go({ id: s.id })} />
    </div>
  );
}
