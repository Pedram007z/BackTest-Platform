import clsx from 'clsx';
import { ChevronLeft, ChevronRight, NotebookPen, StickyNote } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Modal } from '../components/ui/Modal';
import { EmptyState, Select } from '../components/ui/controls';
import { fmtMarketTime } from '../lib/calendar';
import { fmtNum, fmtPct, fmtR, fmtUsd } from '../lib/format';
import { SYMBOL_MAP } from '../lib/market';
import { summarize } from '../lib/stats';
import type { Trade } from '../lib/types';
import { toast, useStore } from '../store/useStore';

const PAGE = 15;

function NoteModal({ trade, onClose }: { trade: Trade | null; onClose: () => void }) {
  const saveJournal = useStore((s) => s.saveJournal);
  const [note, setNote] = useState('');
  useEffect(() => setNote(trade?.journal?.notes ?? ''), [trade]);
  return (
    <Modal
      open={!!trade}
      onClose={onClose}
      size="sm"
      title={trade ? `یادداشت معامله ${trade.symbol}` : ''}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            انصراف
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              if (trade) saveJournal(trade.id, { screenshots: [], checked: [], confidence: 50, rating: 0, tags: [], ...trade.journal, notes: note.trim(), updatedAt: Date.now() });
              toast('یادداشت ذخیره شد');
              onClose();
            }}
          >
            ذخیره یادداشت
          </button>
        </>
      }
    >
      <label className="label" htmlFor="trade-note">
        چه چیزی از این معامله یاد گرفتید؟
      </label>
      <textarea id="trade-note" className="field min-h-[140px] leading-7" value={note} onChange={(e) => setNote(e.target.value)} placeholder="دلیل ورود، احساسات، اشتباهات…" />
    </Modal>
  );
}

export default function Journal() {
  const [params, setParams] = useSearchParams();
  const trades = useStore((s) => s.trades);
  const sessions = useStore((s) => s.sessions);
  const strategies = useStore((s) => s.strategies);
  const [noteFor, setNoteFor] = useState<Trade | null>(null);
  const [page, setPage] = useState(1);

  const session = params.get('session') ?? 'all';
  const strategy = params.get('strategy') ?? 'all';
  const symbol = params.get('symbol') ?? 'all';
  const result = params.get('result') ?? 'all';

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value === 'all') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
    setPage(1);
  };

  const filtered = useMemo(
    () =>
      trades
        .filter((t) => session === 'all' || t.sessionId === session)
        .filter((t) => strategy === 'all' || t.strategyId === strategy)
        .filter((t) => symbol === 'all' || t.symbol === symbol)
        .filter((t) =>
          result === 'all' ? true : result === 'open' ? t.status === 'open' : result === 'win' ? t.status === 'closed' && (t.pnl ?? 0) > 0 : t.status === 'closed' && (t.pnl ?? 0) <= 0,
        )
        .sort((a, b) => b.executedAt - a.executedAt),
    [trades, session, strategy, symbol, result],
  );
  const s = summarize(filtered);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const visible = filtered.slice((page - 1) * PAGE, page * PAGE);
  const sessionName = (id: string) => sessions.find((x) => x.id === id)?.name ?? '—';
  const strategyName = (id?: string) => strategies.find((x) => x.id === id)?.name ?? '—';
  const symbolsUsed = [...new Set(trades.map((t) => t.symbol))].sort();

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold">ژورنال معاملات</h1>
      <p className="mb-6 mt-1 text-sm text-muted">همه‌ی معاملات بک‌تست، با امکان فیلتر و یادداشت‌گذاری.</p>

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={session} onChange={(v) => setFilter('session', v)} options={[{ value: 'all', label: 'همه‌ی جلسات' }, ...sessions.map((x) => ({ value: x.id, label: x.name }))]} />
        <Select value={strategy} onChange={(v) => setFilter('strategy', v)} options={[{ value: 'all', label: 'همه‌ی استراتژی‌ها' }, ...strategies.map((x) => ({ value: x.id, label: x.name }))]} />
        <Select value={symbol} onChange={(v) => setFilter('symbol', v)} options={[{ value: 'all', label: 'همه‌ی نمادها' }, ...symbolsUsed.map((x) => ({ value: x, label: x }))]} />
        <Select
          value={result}
          onChange={(v) => setFilter('result', v)}
          options={[
            { value: 'all', label: 'همه‌ی نتایج' },
            { value: 'win', label: 'برنده' },
            { value: 'loss', label: 'بازنده' },
            { value: 'open', label: 'باز' },
          ]}
        />
      </div>

      <dl className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: 'معاملات', v: fmtNum(filtered.length) },
          { l: 'وین‌ریت', v: s.total ? fmtPct(s.winRate) : '—' },
          { l: 'سود خالص', v: fmtUsd(s.netPnl, 2, true), tone: s.netPnl >= 0 ? 'text-gain' : 'text-loss' },
          { l: 'مجموع R', v: fmtR(s.netR), tone: s.netR >= 0 ? 'text-gain' : 'text-loss' },
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
            <table className="w-full min-w-[860px] text-[13px]">
              <thead className="bg-raised/50 text-xs text-muted">
                <tr>
                  {['نماد', 'جهت', 'جلسه', 'استراتژی', 'زمان ورود (بازار)', 'ورود / خروج', 'R', 'سود / زیان', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-start font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((t) => {
                  const d = SYMBOL_MAP[t.symbol]?.digits ?? 2;
                  return (
                    <tr key={t.id} className="border-t border-line/50 hover:bg-raised/30">
                      <td className="px-4 py-3 font-bold" dir="ltr" style={{ textAlign: 'right' }}>
                        {t.symbol}
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('rounded px-1.5 py-0.5 text-[11px] font-bold', t.side === 'buy' ? 'bg-gain/15 text-gain' : 'bg-loss/15 text-loss')}>
                          {t.side === 'buy' ? 'خرید' : 'فروش'}
                        </span>
                      </td>
                      <td className="max-w-[160px] truncate px-4 py-3">{sessionName(t.sessionId)}</td>
                      <td className="max-w-[160px] truncate px-4 py-3 text-muted">{strategyName(t.strategyId)}</td>
                      <td className="num px-4 py-3 text-muted">{fmtMarketTime(t.openTime)}</td>
                      <td className="num px-4 py-3 text-xs" dir="ltr" style={{ textAlign: 'right' }}>
                        {t.entry.toFixed(d)} → {t.exit !== undefined ? t.exit.toFixed(d) : '…'}
                      </td>
                      <td className={clsx('num px-4 py-3 font-semibold', t.status === 'open' ? 'text-muted' : (t.r ?? 0) >= 0 ? 'text-gain' : 'text-loss')}>
                        {t.status === 'open' ? 'باز' : fmtR(t.r ?? 0)}
                      </td>
                      <td className={clsx('num px-4 py-3 font-semibold', (t.pnl ?? 0) >= 0 ? 'text-gain' : 'text-loss')}>{t.status === 'open' ? '—' : fmtUsd(t.pnl ?? 0, 2, true)}</td>
                      <td className="px-4 py-3 text-end">
                        <button
                          type="button"
                          className={clsx('icon-btn h-8 w-8', t.journal?.notes && 'text-amber')}
                          onClick={() => setNoteFor(t)}
                          aria-label="یادداشت"
                          title={t.journal?.notes || 'افزودن یادداشت'}
                        >
                          <StickyNote size={16} />
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
      <NoteModal trade={noteFor} onClose={() => setNoteFor(null)} />
    </div>
  );
}
