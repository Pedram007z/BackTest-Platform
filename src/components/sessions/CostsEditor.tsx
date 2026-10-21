import { CopyCheck } from 'lucide-react';
import { faDigits, toLatinDigits } from '../../lib/format';
import { SYMBOL_MAP, fmtPx } from '../../lib/market';
import type { SymbolCosts } from '../../lib/types';

/** The text in each field (kept as typed until the session is saved). */
export type CostsDraft = Record<string, { spread: string; commission: string }>;

export const MAX_SPREAD_PIPS = 1000;
export const MAX_COMMISSION = 1000;

const num = (v: string) => Number(toLatinDigits(v).replace(',', '.'));

export function draftFromCosts(costs: Record<string, SymbolCosts> | undefined, symbols: string[]): CostsDraft {
  const out: CostsDraft = {};
  for (const s of symbols) out[s] = { spread: String(costs?.[s]?.spreadPips ?? 0), commission: String(costs?.[s]?.commissionPerLot ?? 0) };
  return out;
}

/** The saved form: only symbols with a spread or commission (none at all: undefined). */
export function costsFromDraft(draft: CostsDraft, symbols: string[]): Record<string, SymbolCosts> | undefined {
  const out: Record<string, SymbolCosts> = {};
  for (const s of symbols) {
    const spreadPips = Math.max(0, num(draft[s]?.spread ?? '0') || 0);
    const commissionPerLot = Math.max(0, num(draft[s]?.commission ?? '0') || 0);
    if (spreadPips > 0 || commissionPerLot > 0) out[s] = { spreadPips, commissionPerLot };
  }
  return Object.keys(out).length ? out : undefined;
}

/** A message for the first bad value, or ''. */
export function costsError(draft: CostsDraft, symbols: string[]): string {
  for (const s of symbols) {
    const sp = num(draft[s]?.spread ?? '0');
    const cm = num(draft[s]?.commission ?? '0');
    if (!Number.isFinite(sp) || sp < 0 || sp > MAX_SPREAD_PIPS) return `اسپرد ${SYMBOL_MAP[s]?.ticker ?? s} باید بین ۰ و ${faDigits(String(MAX_SPREAD_PIPS))} پیپ باشد.`;
    if (!Number.isFinite(cm) || cm < 0 || cm > MAX_COMMISSION) return `کمیسیون ${SYMBOL_MAP[s]?.ticker ?? s} باید بین ۰ و ${faDigits(String(MAX_COMMISSION))} دلار باشد.`;
  }
  return '';
}

interface Props {
  symbols: string[];
  value: CostsDraft;
  onChange: (next: CostsDraft) => void;
  /** An existing session with trades: new values apply to new orders only. */
  editingWithTrades?: boolean;
}

/** Spread (pips) and commission (USD per lot, round turn) for each symbol of a session. */
export function CostsEditor({ symbols, value, onChange, editingWithTrades }: Props) {
  if (!symbols.length) return null;
  const row = (s: string) => value[s] ?? { spread: '0', commission: '0' };
  const set = (s: string, patch: Partial<CostsDraft[string]>) => onChange({ ...value, [s]: { ...row(s), ...patch } });
  const clean = (v: string) =>
    toLatinDigits(v)
      .replace(/[^\d.,]/g, '')
      .replace(',', '.');
  const copyFirst = () => {
    const first = row(symbols[0]);
    onChange(Object.fromEntries(symbols.map((s) => [s, { ...first }])));
  };

  return (
    <div className="rounded-2xl border border-line bg-raised/40 p-3">
      <div className="mb-2 flex items-center gap-2">
        <p className="text-[13px] font-bold">اسپرد و کمیسیون</p>
        {symbols.length > 1 && (
          <button type="button" className="btn-ghost ms-auto px-2 py-1 text-[12px]" onClick={copyFirst} title="مقدارهای نماد اول برای همه‌ی نمادها">
            <CopyCheck size={14} /> یکسان برای همه
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-[12px]">
          <thead>
            <tr className="text-faint">
              <th className="pb-1.5 text-start font-medium">نماد</th>
              <th className="pb-1.5 text-start font-medium">اسپرد (پیپ)</th>
              <th className="pb-1.5 text-start font-medium">کمیسیون (دلار برای هر لات)</th>
            </tr>
          </thead>
          <tbody>
            {symbols.map((s) => {
              const sym = SYMBOL_MAP[s];
              const r = row(s);
              const sp = num(r.spread);
              return (
                <tr key={s} className="border-t border-line/50">
                  <td className="py-1.5 pe-2 font-semibold" dir="ltr" style={{ textAlign: 'right' }}>
                    {sym?.ticker ?? s}
                  </td>
                  <td className="py-1.5 pe-2">
                    <input
                      className="field num h-9 w-24 py-1"
                      inputMode="decimal"
                      dir="ltr"
                      aria-label={`اسپرد ${sym?.ticker ?? s} به پیپ`}
                      value={r.spread}
                      onChange={(e) => set(s, { spread: clean(e.target.value) })}
                    />
                    {sym && sp > 0 && (
                      <span className="num ms-2 text-[11px] text-faint" dir="ltr">
                        = {fmtPx(s, sp * sym.pip)}
                      </span>
                    )}
                  </td>
                  <td className="py-1.5">
                    <input
                      className="field num h-9 w-24 py-1"
                      inputMode="decimal"
                      dir="ltr"
                      aria-label={`کمیسیون ${sym?.ticker ?? s} به دلار برای هر لات`}
                      value={r.commission}
                      onChange={(e) => set(s, { commission: clean(e.target.value) })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-faint">
        قیمت چارت Bid است و خط Ask به اندازه‌ی اسپرد بالاتر کشیده می‌شود. خرید روی Ask باز و روی Bid بسته می‌شود؛ فروش برعکس. کمیسیون رفت‌وبرگشت برای هر ۱ لات است و هنگام بستن هر
        بخش از پوزیشن از سود و زیان کم می‌شود.
        {editingWithTrades && ' تغییر این مقدارها فقط روی سفارش‌های جدید اثر دارد.'}
      </p>
    </div>
  );
}
