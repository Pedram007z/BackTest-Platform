import clsx from 'clsx';
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, NotebookPen, Pencil, Play, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useGo } from '../../lib/nav';
import { GREGORIAN_MONTHS, WEEKDAY_NAMES, fmtDay, fmtDayLong, weekdayOf } from '../../lib/calendar';
import { faDigits, fmtNum, fmtPct, fmtUsd } from '../../lib/format';
import { SYMBOL_MAP } from '../../lib/market';
import {
  dailyPerformance,
  equitySeries,
  monthlyPerformance,
  sessionBalance,
  sessionProgress,
  sessionRemainingDays,
  summarize,
} from '../../lib/stats';
import type { Session, Trade } from '../../lib/types';
import { toast, useStore } from '../../store/useStore';
import { EquityArea, PnlBars } from '../charts/Charts';
import { ConfirmDialog } from '../ui/Modal';
import { KebabMenu, Meter, Select } from '../ui/controls';
import { SessionModal } from './SessionModal';

function SessionSummary({ session, trades }: { session: Session; trades: Trade[] }) {
  const go = useGo();
  const s = summarize(trades);
  const equity = equitySeries(trades, session.balance);
  const monthly = monthlyPerformance(trades, 3).map((m) => {
    const [y, mo] = m.month.split('-').map(Number);
    return { label: GREGORIAN_MONTHS[mo - 1], title: `${GREGORIAN_MONTHS[mo - 1]} ${faDigits(y)}`, pnl: m.pnl };
  });
  const daily = dailyPerformance(trades, 6).map((d) => ({
    label: WEEKDAY_NAMES[weekdayOf(d.day)],
    title: fmtDayLong(d.day, 'jalali', true),
    pnl: d.pnl,
  }));
  const balance = sessionBalance(session, trades);

  return (
    <div className="anim-fade px-4 pb-5 sm:px-5">
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <button type="button" className="btn-soft py-1.5" onClick={() => go(`/sessions?id=${session.id}`)}>
          مشاهده خلاصه <ArrowLeft size={14} />
        </button>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
          <div className="flex gap-1.5">
            <dt className="text-muted">موجودی:</dt>
            <dd className="num font-bold">{fmtUsd(balance)}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted">سود خالص:</dt>
            <dd className={clsx('num font-bold', s.netPnl >= 0 ? 'text-gain' : 'text-loss')}>{fmtUsd(s.netPnl, 2, true)}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted">معاملات:</dt>
            <dd className="num font-bold">{fmtNum(s.total)}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted">وین‌ریت:</dt>
            <dd className="num font-bold">{fmtPct(s.winRate)}</dd>
          </div>
        </dl>
      </div>

      {s.total === 0 ? (
        <div className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
          هنوز معامله‌ای در این جلسه بسته نشده. با دکمه پخش وارد چارت شوید و اولین معامله را ثبت کنید.
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-line/70 bg-bg/40 p-4">
            <h4 className="mb-2 text-sm font-bold">منحنی اکوئیتی</h4>
            <EquityArea data={equity} baseline={session.balance} height={180} />
          </div>
          <div className="rounded-xl border border-line/70 bg-bg/40 p-4">
            <h4 className="mb-2 text-sm font-bold">
              عملکرد ماهانه <span className="text-xs font-normal text-faint">(۳ ماه اخیر، دلار)</span>
            </h4>
            <PnlBars data={monthly} layout="vertical" height={180} />
          </div>
          <div className="rounded-xl border border-line/70 bg-bg/40 p-4">
            <h4 className="mb-2 text-sm font-bold">
              عملکرد روزانه <span className="text-xs font-normal text-faint">(۶ روز اخیر)</span>
            </h4>
            <PnlBars data={daily} layout="horizontal" height={180} />
          </div>
        </div>
      )}
    </div>
  );
}

function SessionRow({ session, trades }: { session: Session; trades: Trade[] }) {
  const go = useGo();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const deleteSession = useStore((s) => s.deleteSession);
  const strategy = useStore((s) => s.strategies.find((x) => x.id === session.strategyId));
  const remaining = sessionRemainingDays(session);
  const progress = sessionProgress(session);

  return (
    <div className="border-b border-line/60 last:border-b-0">
      <div className="flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5">
        <button
          type="button"
          onClick={() => go(`/replay/${session.id}`)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-[0_0_0_4px_rgb(var(--accent)/0.15)] transition hover:scale-105"
          aria-label={`ادامه بک‌تست ${session.name}`}
          title="ادامه بک‌تست روی چارت"
        >
          <Play size={15} fill="currentColor" className="-translate-x-[1px]" />
        </button>

        <button type="button" className="min-w-0 flex-1 text-start" onClick={() => setOpen((o) => !o)}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-bold">{session.name}</p>
            {strategy && <span className="rounded-md bg-raised px-2 py-0.5 text-[11px] font-medium text-muted">{strategy.name}</span>}
          </div>
          <p className="truncate text-xs text-faint" dir="ltr" style={{ textAlign: 'right' }}>
            {session.symbols.map((s) => SYMBOL_MAP[s]?.ticker ?? s).join(', ')}
          </p>
          <p className="num text-[11px] text-faint">
            {fmtDay(session.startDate)} تا {fmtDay(session.endDate)}
          </p>
        </button>

        <div className="hidden w-36 shrink-0 sm:block">
          <Meter value={progress} className="mb-1.5 h-1" />
          <p className="num text-[11px] text-muted">
            روزهای باقی‌مانده: <span className="font-bold text-ink">{fmtNum(remaining)}</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            className="icon-btn h-8 w-8"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? 'بستن خلاصه' : 'نمایش خلاصه'}
          >
            <ChevronDown size={18} className={clsx('transition', open && 'rotate-180')} />
          </button>
          <KebabMenu
            items={[
              { label: 'ویرایش جلسه', icon: <Pencil size={15} />, onClick: () => setEditing(true) },
              { label: 'ژورنال معاملات', icon: <NotebookPen size={15} />, onClick: () => go(`/journal?session=${session.id}`) },
              { label: 'حذف جلسه', icon: <Trash2 size={15} />, onClick: () => setConfirm(true), danger: true },
            ]}
          />
        </div>
      </div>
      <div className="-mt-1 px-4 pb-3 sm:hidden">
        <div className="flex items-center gap-3">
          <Meter value={progress} className="h-1 flex-1" />
          <p className="num shrink-0 text-[11px] text-muted">باقی‌مانده: {fmtNum(remaining)} روز</p>
        </div>
      </div>

      {open && <SessionSummary session={session} trades={trades} />}

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
    </div>
  );
}

export function SessionList({ sessions, emptyText, initialPageSize = 5 }: { sessions: Session[]; emptyText?: string; initialPageSize?: number }) {
  const trades = useStore((s) => s.trades);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(sessions.length / pageSize));

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const byId = useMemo(() => {
    const m = new Map<string, Trade[]>();
    for (const t of trades) {
      if (!m.has(t.sessionId)) m.set(t.sessionId, []);
      m.get(t.sessionId)!.push(t);
    }
    return m;
  }, [trades]);

  const visible = sessions.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <div className="card overflow-visible">
        {visible.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">{emptyText ?? 'جلسه‌ای وجود ندارد.'}</p>
        ) : (
          visible.map((s) => <SessionRow key={s.id} session={s} trades={byId.get(s.id) ?? []} />)
        )}
      </div>

      {sessions.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span>تعداد در صفحه</span>
            <div className="w-20">
              <Select
                compact
                value={String(pageSize)}
                options={[5, 10, 20].map((n) => ({ value: String(n), label: fmtNum(n) }))}
                onChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
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
        </div>
      )}
    </div>
  );
}
