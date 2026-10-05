import clsx from 'clsx';
import { Camera, ChevronLeft, ChevronRight, FolderOpen, NotebookPen, Star, StickyNote, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { JournalModal, type JournalContext } from '../components/journal/JournalModal';
import { DatePicker } from '../components/ui/DatePicker';
import { EmptyState, MultiSelect, Select } from '../components/ui/controls';
import { fmtMarketTime, msToKey } from '../lib/calendar';
import { faDigits, fmtNum, fmtPct, fmtR, fmtUsd } from '../lib/format';
import { DATA_START, SYMBOL_MAP, dataEnd, fmtPx, groupLabel } from '../lib/market';
import { summarize, tradeReturns } from '../lib/stats';
import { riskDistance } from '../lib/trading';
import type { Trade } from '../lib/types';
import { toast, useStore } from '../store/useStore';

const PAGE = 15;

export default function Journal() {
  const [params, setParams] = useSearchParams();
  const trades = useStore((s) => s.trades);
  const sessions = useStore((s) => s.sessions);
  const saveJournal = useStore((s) => s.saveJournal);
  const deleteJournal = useStore((s) => s.deleteJournal);
  const [openId, setOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const session = params.get('session') ?? 'all';
  const side = params.get('side') ?? 'all';
  const symbols = params.get('symbols')?.split(',').filter(Boolean) ?? [];
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const only = params.get('only') ?? 'all';

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
    setPage(1);
  };

  const returns = useMemo(() => tradeReturns(trades, sessions), [trades, sessions]);
  const filtered = useMemo(
    () =>
      trades
        .filter((t) => t.status === 'open' || t.status === 'closed')
        .filter((t) => session === 'all' || t.sessionId === session)
        .filter((t) => side === 'all' || t.side === side)
        .filter((t) => symbols.length === 0 || symbols.includes(t.symbol))
        .filter((t) => {
          const d = msToKey(t.openTime);
          return (!from || d >= from) && (!to || d <= to);
        })
        .filter((t) => only === 'all' || !!t.journal)
        .sort((a, b) => b.openTime - a.openTime),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trades, session, side, symbols.join(','), from, to, only],
  );
  const s = summarize(filtered);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const visible = filtered.slice((page - 1) * PAGE, page * PAGE);
  const sessionName = (id: string) => sessions.find((x) => x.id === id)?.name ?? '—';
  const usedSymbols = [...new Set(trades.map((t) => t.symbol))].sort();
  const anyFilter = session !== 'all' || side !== 'all' || symbols.length > 0 || from || to || only !== 'all';

  const opened = trades.find((t) => t.id === openId) ?? null;
  const ctxFor = (t: Trade): JournalContext => ({
    symbol: t.symbol,
    side: t.side,
    type: t.orderType,
    entry: t.entry,
    sl: t.sl,
    tp: t.tp,
    rr: t.tp > 0 ? Math.abs(t.tp - t.entry) / Math.max(1e-12, riskDistance(t)) : 0,
    lots: t.initialLots,
    time: t.openTime,
    sessionName: sessionName(t.sessionId),
    pnl: t.status === 'closed' ? t.pnl : undefined,
    r: t.r,
  });

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold">ژورنال معاملات</h1>
      <p className="mb-5 mt-1 text-sm text-muted">همه‌ی پوزیشن‌های بک‌تست؛ با «باز کردن» ژورنال هر معامله را ببینید، ویرایش یا حذف کنید.</p>

      <div className="card mb-4 grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <MultiSelect
          id="journal-symbols"
          values={symbols}
          onChange={(v) => setFilter('symbols', v.join(','))}
          placeholder="همه‌ی جفت‌ارزها"
          options={usedSymbols.map((id) => ({ value: id, label: id, hint: SYMBOL_MAP[id]?.name, group: SYMBOL_MAP[id] ? groupLabel(SYMBOL_MAP[id]) : '' }))}
        />
        <Select
          value={side}
          onChange={(v) => setFilter('side', v)}
          options={[
            { value: 'all', label: 'خرید و فروش' },
            { value: 'buy', label: 'فقط خرید' },
            { value: 'sell', label: 'فقط فروش' },
          ]}
        />
        <Select
          value={session}
          onChange={(v) => setFilter('session', v)}
          options={[{ value: 'all', label: 'همه‌ی جلسات بک‌تست' }, ...sessions.map((x) => ({ value: x.id, label: x.name }))]}
        />
        <Select
          value={only}
          onChange={(v) => setFilter('only', v)}
          options={[
            { value: 'all', label: 'همه‌ی معاملات' },
            { value: 'journal', label: 'فقط معاملات ژورنال‌شده' },
          ]}
        />
        <DatePicker id="journal-from" value={from} onChange={(v) => setFilter('from', v)} min={DATA_START} max={to || dataEnd()} rangeWith={to} placeholder="از تاریخ بک‌تست" />
        <DatePicker id="journal-to" value={to} onChange={(v) => setFilter('to', v)} min={from || DATA_START} max={dataEnd()} rangeWith={from} placeholder="تا تاریخ بک‌تست" />
        <button
          type="button"
          className="btn-ghost justify-center lg:col-span-2"
          disabled={!anyFilter}
          onClick={() => {
            setParams(new URLSearchParams(), { replace: true });
            setPage(1);
          }}
        >
          <Trash2 size={15} /> پاک کردن فیلترها
        </button>
      </div>

      <dl className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: 'معاملات', v: fmtNum(filtered.length) },
          { l: 'وین‌ریت', v: s.total ? fmtPct(s.winRate) : '—' },
          { l: 'سود خالص', v: fmtUsd(s.netPnl, 2, true), tone: s.netPnl >= 0 ? 'text-gain' : 'text-loss' },
          { l: 'ژورنال‌شده', v: fmtNum(filtered.filter((t) => t.journal).length) },
        ].map((x) => (
          <div key={x.l} className="card px-4 py-3">
            <dt className="text-xs text-muted">{x.l}</dt>
            <dd className={clsx('num mt-0.5 text-lg font-bold', x.tone)}>{x.v}</dd>
          </div>
        ))}
      </dl>

      <div className="card overflow-hidden">
        {visible.length === 0 ? (
          <EmptyState icon={<NotebookPen size={24} />} title="معامله‌ای پیدا نشد" text="فیلترها را تغییر دهید یا از صفحه‌ی چارت یک معامله ثبت کنید." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-[13px]">
              <thead className="bg-raised/40">
                <tr>
                  {['نام جلسه', 'تاریخ معامله', 'جفت‌ارز', 'جهت', 'بازده (ROI)', 'ورود', 'حد ضرر', 'حد سود', 'حداکثر RR', 'ژورنال', ''].map((h) => (
                    <th key={h} className="th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((t) => {
                  const roi = returns.get(t.id);
                  const j = t.journal;
                  return (
                    <tr key={t.id} className="border-t border-line/50 hover:bg-raised/30">
                      <td className="td max-w-[180px] truncate">{sessionName(t.sessionId)}</td>
                      <td className="td num text-muted">{fmtMarketTime(t.openTime)}</td>
                      <td className="td font-bold" dir="ltr" style={{ textAlign: 'right' }}>
                        {SYMBOL_MAP[t.symbol]?.ticker ?? t.symbol}
                      </td>
                      <td className="td">
                        <span className={clsx('rounded-md px-1.5 py-0.5 text-[11px] font-bold', t.side === 'buy' ? 'bg-gain/15 text-gain' : 'bg-loss/15 text-loss')}>
                          {t.side === 'buy' ? 'خرید' : 'فروش'}
                        </span>
                      </td>
                      <td className={clsx('td num font-bold', t.status === 'open' ? 'text-muted' : (roi ?? 0) >= 0 ? 'text-gain' : 'text-loss')}>
                        {t.status === 'open' ? 'باز' : `${(roi ?? 0) >= 0 ? '+' : ''}${fmtPct(roi ?? 0, 2)}`}
                        {t.status === 'closed' && <span className="ms-1.5 text-[11px] font-medium opacity-75">({fmtR(t.r ?? 0)})</span>}
                      </td>
                      <td className="td num" dir="ltr" style={{ textAlign: 'right' }}>
                        {fmtPx(t.symbol, t.entry)}
                      </td>
                      <td className="td num text-loss" dir="ltr" style={{ textAlign: 'right' }}>
                        {fmtPx(t.symbol, t.sl)}
                      </td>
                      <td className="td num text-gain" dir="ltr" style={{ textAlign: 'right' }}>
                        {t.tp > 0 ? fmtPx(t.symbol, t.tp) : '—'}
                      </td>
                      <td className="td num">{fmtNum(Math.max(t.maxR ?? 0, 0), 2)}</td>
                      <td className="td">
                        {j ? (
                          <span className="flex items-center gap-2 text-faint">
                            {j.rating > 0 && (
                              <span className="flex items-center gap-0.5 text-amber" title={`${faDigits(j.rating)} ستاره`}>
                                <Star size={13} className="fill-amber" />
                                <span className="num text-[11px]">{faDigits(j.rating)}</span>
                              </span>
                            )}
                            {j.notes && <StickyNote size={14} aria-label="یادداشت دارد" />}
                            {j.screenshots.length > 0 && (
                              <span className="flex items-center gap-0.5" title="اسکرین‌شات">
                                <Camera size={14} />
                                <span className="num text-[11px]">{faDigits(j.screenshots.length)}</span>
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[11px] text-faint">—</span>
                        )}
                      </td>
                      <td className="td text-end">
                        <button type="button" className={clsx('btn-soft px-2.5 py-1 text-[12px]', j && 'border-accent/50 text-accent-ink')} onClick={() => setOpenId(t.id)}>
                          <FolderOpen size={14} /> باز کردن
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
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

      <JournalModal
        open={!!opened}
        ctx={opened ? ctxFor(opened) : null}
        initial={opened?.journal}
        defaultChecklistId={opened ? sessions.find((x) => x.id === opened.sessionId)?.checklistId : undefined}
        onClose={() => setOpenId(null)}
        onSave={(entry) => {
          if (opened) saveJournal(opened.id, entry);
          setOpenId(null);
          toast('ژورنال ذخیره شد');
        }}
        onDelete={
          opened?.journal
            ? () => {
                deleteJournal(opened.id);
                setOpenId(null);
                toast('ژورنال حذف شد', 'info');
              }
            : undefined
        }
      />
    </div>
  );
}
