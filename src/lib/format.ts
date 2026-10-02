const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** Replace Latin digits in a string with Persian digits. */
export function faDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

const nfCache = new Map<string, Intl.NumberFormat>();
function nf(min: number, max: number) {
  const key = `${min}-${max}`;
  let f = nfCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat('fa-IR', { minimumFractionDigits: min, maximumFractionDigits: max });
    nfCache.set(key, f);
  }
  return f;
}

/** Persian-digit number with grouping. */
export function fmtNum(n: number, maxFrac = 0, minFrac = 0): string {
  if (!Number.isFinite(n)) return '—';
  return nf(minFrac, Math.max(minFrac, maxFrac)).format(n);
}

export function fmtPct(n: number, frac = 2): string {
  if (!Number.isFinite(n)) return '—';
  return `${fmtNum(n, frac, frac === 0 ? 0 : Math.min(frac, 2))}٪`;
}

// Signed amounts are wrapped in a left-to-right isolate so "−$120" keeps its order inside RTL text.
const ltr = (s: string) => `\u2066${s}\u2069`;

/** USD amount. Sign goes before the dollar sign: −$۱۲۰٫۵۰ */
export function fmtUsd(n: number, frac = 2, signed = false): string {
  if (!Number.isFinite(n)) return '—';
  const sign = n < 0 ? '−' : signed && n > 0 ? '+' : '';
  return ltr(`${sign}$${fmtNum(Math.abs(n), frac, frac)}`);
}

/** Short USD amount for tight spaces: +$۲۴٫۵K */
export function fmtUsdShort(n: number, signed = false): string {
  if (Math.abs(n) < 10_000) return fmtUsd(n, 0, signed);
  const sign = n < 0 ? '−' : signed && n > 0 ? '+' : '';
  return ltr(`${sign}$${fmtCompact(Math.abs(n))}`);
}

/** Compact number for chart ticks, e.g. 250000 → ۲۵۰K */
export function fmtCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (abs >= 1_000_000) return `${sign}${fmtNum(abs / 1_000_000, 1)}M`;
  if (abs >= 1_000) return `${sign}${fmtNum(abs / 1_000, 1)}K`;
  return `${sign}${fmtNum(abs, 0)}`;
}

export function fmtR(r: number): string {
  if (!Number.isFinite(r)) return '—';
  const sign = r < 0 ? '−' : r > 0 ? '+' : '';
  return ltr(`${sign}${fmtNum(Math.abs(r), 2)}R`);
}

/** Minutes → "۲ ساعت ۲۰ دقیقه" */
export function fmtMinutes(totalMinutes: number): string {
  const m = Math.round(totalMinutes);
  if (m <= 0) return '۰ دقیقه';
  const h = Math.floor(m / 60);
  const rest = m % 60;
  const parts: string[] = [];
  if (h) parts.push(`${fmtNum(h)} ساعت`);
  if (rest) parts.push(`${fmtNum(rest)} دقیقه`);
  return parts.join(' و ');
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Long market duration → "۳ ماه ۹ روز ۱۸ ساعت" (month = 30 days, year = 365 days). */
export function fmtLongDuration(ms: number): string {
  if (ms < HOUR) return `${fmtNum(Math.floor(ms / MIN))} دقیقه`;
  let rest = ms;
  const y = Math.floor(rest / (365 * DAY));
  rest -= y * 365 * DAY;
  const mo = Math.floor(rest / (30 * DAY));
  rest -= mo * 30 * DAY;
  const d = Math.floor(rest / DAY);
  rest -= d * DAY;
  const h = Math.floor(rest / HOUR);
  const parts: string[] = [];
  if (y) parts.push(`${fmtNum(y)} سال`);
  if (mo) parts.push(`${fmtNum(mo)} ماه`);
  if (d) parts.push(`${fmtNum(d)} روز`);
  if (h && !y) parts.push(`${fmtNum(h)} ساعت`);
  return parts.join(' ');
}

export function fmtPrice(price: number, digits: number): string {
  return price.toFixed(digits);
}

/** Normalise Persian / Arabic-Indic digits typed by the user to Latin digits. */
export function toLatinDigits(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[٫]/g, '.')
    .replace(/[٬،]/g, ',');
}
