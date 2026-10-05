import clsx from 'clsx';
import { NotebookPen, X } from 'lucide-react';
import { useState } from 'react';
import { fmtMarketTime } from '../../lib/calendar';
import { fmtNum, fmtUsd } from '../../lib/format';
import { SYMBOL_MAP, fmtPx, priceAt } from '../../lib/market';
import { ORDER_LABEL, fmtLots, openPnl, rOfPrice } from '../../lib/trading';
import type { Trade } from '../../lib/types';
import { Toggle } from '../ui/controls';

interface Props {
  trades: Trade[];
  cursor: number;
  showHistory: boolean;
  onShowHistory: (v: boolean) => void;
  onClose: (t: Trade) => void;
  onCancel: (t: Trade) => void;
  onJournal: (t: Trade) => void;
}

/** Open and closed positions of the session (bottom drawer of the chart page). */
export function PositionsPanel({ trades, cursor, showHistory, onShowHistory, onClose, onCancel, onJournal }: Props) {
  const [tab, setTab] = useState<'open' | 'closed'>('open');
  const open = trades.filter((t) => t.status === 'open' || t.status === 'pending').sort((a, b) => b.placedTime - a.placedTime);
  const closed = trades.filter((t) => t.status === 'closed').sort((a, b) => (b.closeTime ?? 0) - (a.closeTime ?? 0));
  const list = tab === 'open' ? open : closed;
  const head = ['نماد', 'جهت', 'تاریخ شروع', 'تاریخ پایان', 'ورود', 'حد ضرر', 'حد سود', 'حداکثر RR', 'حجم', 'میانگین بستن', 'سود/زیان محقق', ''];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-line/70 px-3">
        {(['open', 'closed'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={clsx('relative px-3 py-2.5 text-[13px] font-semibold transition', tab === k ? 'text-ink' : 'text-muted hover:text-ink')}
          >
            {k === 'open' ? 'پوزیشن‌های باز' : 'پوزیشن‌های بسته'}
            <span className="num ms-1.5 rounded-md bg-raised px-1.5 text-[11px]">{fmtNum(k === 'open' ? open.length : closed.length)}</span>
            {tab === k && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent" />}
          </button>
        ))}
        {tab === 'closed' && (
          <label className="ms-auto flex items-center gap-2 py-2 text-xs text-muted">
            <Toggle checked={showHistory} onChange={onShowHistory} label="نمایش معاملات بسته روی چارت" />
            نمایش روی چارت
          </label>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {list.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-muted">
            {tab === 'open' ? 'پوزیشن یا سفارش بازی ندارید. با دکمه‌ی خرید یا فروش شروع کنید.' : 'هنوز معامله‌ای در این جلسه بسته نشده.'}
          </p>
        ) : (
          <table className="w-full min-w-[1080px] text-[12px]">
            <thead className="sticky top-0 bg-side">
              <tr>
                {head.map((h) => (
                  <th key={h} className="th py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((t) => {
                const price = priceAt(t.symbol, cursor);
                const live = t.status === 'open';
                const realized = t.partials.reduce((s, p) => s + p.pnl, 0);
                const floating = live ? openPnl(t, price) : 0;
                const maxR = live ? Math.max(t.maxR ?? 0, rOfPrice(t, price)) : (t.maxR ?? 0);
                return (
                  <tr key={t.id} className="border-t border-line/50 hover:bg-raised/30">
                    <td className="td font-bold" dir="ltr" style={{ textAlign: 'right' }}>
                      {SYMBOL_MAP[t.symbol]?.ticker ?? t.symbol}
                    </td>
                    <td className="td">
                      <span className={clsx('rounded-md px-1.5 py-0.5 text-[11px] font-bold', t.side === 'buy' ? 'bg-gain/15 text-gain' : 'bg-loss/15 text-loss')}>
                        {t.side === 'buy' ? 'خرید' : 'فروش'}
                        {t.status === 'pending' && ` ${ORDER_LABEL[t.orderType]}`}
                      </span>
                    </td>
                    <td className="td num text-muted">{t.status === 'pending' ? 'در انتظار' : fmtMarketTime(t.openTime)}</td>
                    <td className="td num text-muted">{t.closeTime ? fmtMarketTime(t.closeTime) : '—'}</td>
                    <td className="td num" dir="ltr" style={{ textAlign: 'right' }}>
                      {fmtPx(t.symbol, t.entry)}
                    </td>
                    <td className="td num text-loss" dir="ltr" style={{ textAlign: 'right' }}>
                      {fmtPx(t.symbol, t.sl)}
                    </td>
                    <td className="td num text-gain" dir="ltr" style={{ textAlign: 'right' }}>
                      {t.tp > 0 ? fmtPx(t.symbol, t.tp) : '—'}
                    </td>
                    <td className="td num">{t.status === 'pending' ? '—' : maxR.toFixed(2)}</td>
                    <td className="td num">{fmtLots(live || t.status === 'pending' ? t.lots : t.initialLots, t.symbol)}</td>
                    <td className="td num" dir="ltr" style={{ textAlign: 'right' }}>
                      {t.exit !== undefined ? fmtPx(t.symbol, t.exit) : '—'}
                    </td>
                    <td className={clsx('td num font-semibold', realized > 0 ? 'text-gain' : realized < 0 ? 'text-loss' : 'text-muted')}>
                      {t.partials.length ? fmtUsd(realized, 2, true) : '—'}
                      {live && <span className={clsx('ms-2 text-[11px] font-normal', floating >= 0 ? 'text-gain' : 'text-loss')}>(باز: {fmtUsd(floating, 2, true)})</span>}
                    </td>
                    <td className="td">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className={clsx('icon-btn h-7 w-7', t.journal && 'text-accent-ink')}
                          onClick={() => onJournal(t)}
                          aria-label="ژورنال"
                          title={t.journal ? 'ویرایش ژورنال' : 'نوشتن ژورنال'}
                        >
                          <NotebookPen size={14} />
                        </button>
                        {live && (
                          <button type="button" className="btn-soft px-2 py-1 text-[11px]" onClick={() => onClose(t)}>
                            <X size={12} /> بستن
                          </button>
                        )}
                        {t.status === 'pending' && (
                          <button type="button" className="btn-soft px-2 py-1 text-[11px]" onClick={() => onCancel(t)}>
                            <X size={12} /> لغو
                          </button>
                        )}
                      </div>
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
