import clsx from 'clsx';
import { Percent, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { faDigits, fmtUsd, toLatinDigits } from '../../lib/format';
import { SYMBOL_MAP, fmtPx, priceAt } from '../../lib/market';
import { fmtLots, openPnl, roundLots as roundLotStep } from '../../lib/trading';
import type { Trade } from '../../lib/types';
import { Modal } from '../ui/Modal';

/** "Take partials": close part or all of an open position at the replay price. */
export function CloseModal({ trade, cursor, onClose, onConfirm }: { trade: Trade | null; cursor: number; onClose: () => void; onConfirm: (lots: number) => void }) {
  const [base, setBase] = useState<'left' | 'original'>('left');
  const [pct, setPct] = useState('50');
  const [lotsText, setLotsText] = useState('');

  const step = trade ? (SYMBOL_MAP[trade.symbol]?.lotStep ?? 0.01) : 0.01;
  const ref = trade ? (base === 'left' ? trade.lots : trade.initialLots) : 0;
  const roundLots = (v: number) => Math.max(step, Math.min(trade?.lots ?? 0, roundLotStep(v, step)));

  useEffect(() => {
    if (!trade) return;
    setBase('left');
    setPct('50');
    setLotsText(fmtLots(roundLots(trade.lots * 0.5), trade.symbol));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trade?.id]);

  if (!trade) return null;
  const price = priceAt(trade.symbol, cursor);
  const lots = roundLots(Number(lotsText) || 0);
  const pnlPerLot = trade.lots > 0 ? openPnl(trade, price) / trade.lots : 0;
  const setFromPct = (p: number, b = base) => {
    setPct(String(p));
    setLotsText(fmtLots(roundLots(((b === 'left' ? trade.lots : trade.initialLots) * p) / 100), trade.symbol));
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="بستن پوزیشن"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            انصراف
          </button>
          <button type="button" className="btn-primary" onClick={() => onConfirm(lots)} disabled={!(lots > 0)}>
            <Save size={15} /> {lots >= trade.lots - step / 2 ? 'بستن کامل' : 'بستن بخشی'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="seg w-full">
          {(['left', 'original'] as const).map((b) => (
            <button
              key={b}
              type="button"
              className={clsx('seg-item flex-1 py-1.5', base === b && 'seg-item-on')}
              onClick={() => {
                setBase(b);
                setFromPct(Number(pct) || 0, b);
              }}
            >
              {b === 'left' ? 'از حجم باقی‌مانده' : 'از حجم اولیه'}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[25, 50, 75, 100].map((p) => (
            <button key={p} type="button" onClick={() => setFromPct(p)} className={clsx('btn-soft py-2', Number(pct) === p && 'border-accent bg-accent/15 text-accent-ink')}>
              {faDigits(p)}٪
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="close-pct">
              درصد بستن
            </label>
            <div className="relative">
              <Percent size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input
                id="close-pct"
                className="field num pl-8"
                dir="ltr"
                inputMode="decimal"
                value={pct}
                onChange={(e) => {
                  const v = toLatinDigits(e.target.value).replace(/[^\d.]/g, '');
                  setPct(v);
                  setLotsText(fmtLots(roundLots((ref * Math.min(100, Number(v) || 0)) / 100), trade.symbol));
                }}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="close-lots">
              حجم بستن (لات)
            </label>
            <input
              id="close-lots"
              className="field num"
              dir="ltr"
              inputMode="decimal"
              value={lotsText}
              onChange={(e) => {
                const v = toLatinDigits(e.target.value).replace(/[^\d.]/g, '');
                setLotsText(v);
                setPct(String(Math.round(((Number(v) || 0) / (ref || 1)) * 100)));
              }}
            />
          </div>
        </div>
        <dl className="panel grid grid-cols-[1fr_auto] gap-y-1.5 px-4 py-3 text-[13px]">
          <dt className="text-muted">حجم فعلی پوزیشن</dt>
          <dd className="num text-end font-semibold text-gain">{fmtLots(trade.lots, trade.symbol)} لات</dd>
          <dt className="text-muted">قیمت فعلی</dt>
          <dd className="num text-end font-semibold" dir="ltr">
            {fmtPx(trade.symbol, price)}
          </dd>
          <dt className="text-muted">سود / زیان این بخش</dt>
          <dd className={clsx('num text-end font-semibold', pnlPerLot * lots >= 0 ? 'text-gain' : 'text-loss')}>{fmtUsd(pnlPerLot * lots, 2, true)}</dd>
        </dl>
      </div>
    </Modal>
  );
}
