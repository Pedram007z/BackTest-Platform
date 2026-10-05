import { seededRng } from './market';
import { wallToUtc } from './timezone';
import type { Impact, NewsFilters } from './types';

/**
 * Economic calendar events.
 *
 * With the API server running, events come from ForexFactory (see server/src/news). Without it
 * the app uses `sampleNews()`: a deterministic calendar built from the real release schedules
 * (NFP on the first Friday, FOMC, CPI, central-bank meetings, …) with made-up numbers. The UI
 * labels that data as a sample.
 */

export interface NewsEvent {
  id: string;
  /** UTC ms */
  time: number;
  currency: string;
  title: string;
  impact: Impact;
  actual?: string;
  forecast?: string;
  previous?: string;
  allDay?: boolean;
}

export const NEWS_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'CNY'] as const;

export const CURRENCY_COUNTRY: Record<string, string> = {
  USD: 'آمریکا',
  EUR: 'منطقه یورو',
  GBP: 'بریتانیا',
  JPY: 'ژاپن',
  CHF: 'سوئیس',
  CAD: 'کانادا',
  AUD: 'استرالیا',
  NZD: 'نیوزیلند',
  CNY: 'چین',
};

export const IMPACT_LABEL: Record<Impact, string> = { high: 'پراهمیت', medium: 'متوسط', low: 'کم‌اهمیت', holiday: 'تعطیلی' };

/** Persian names for the headline releases; anything else keeps its ForexFactory title. */
const FA_TITLES: Record<string, string> = {
  'Non-Farm Employment Change': 'تغییرات اشتغال غیرکشاورزی (NFP)',
  'Unemployment Rate': 'نرخ بیکاری',
  'Average Hourly Earnings m/m': 'میانگین دستمزد ساعتی (ماهانه)',
  'ADP Non-Farm Employment Change': 'تغییرات اشتغال ADP',
  'CPI m/m': 'شاخص قیمت مصرف‌کننده (ماهانه)',
  'CPI y/y': 'شاخص قیمت مصرف‌کننده (سالانه)',
  'Core CPI m/m': 'تورم هسته (ماهانه)',
  'PPI m/m': 'شاخص قیمت تولیدکننده (ماهانه)',
  'Retail Sales m/m': 'خرده‌فروشی (ماهانه)',
  'Core Retail Sales m/m': 'خرده‌فروشی هسته (ماهانه)',
  'Unemployment Claims': 'درخواست‌های بیمه بیکاری',
  'ISM Manufacturing PMI': 'شاخص مدیران خرید تولیدی ISM',
  'ISM Services PMI': 'شاخص مدیران خرید خدمات ISM',
  'Federal Funds Rate': 'نرخ بهره فدرال رزرو',
  'FOMC Statement': 'بیانیه FOMC',
  'FOMC Press Conference': 'کنفرانس خبری FOMC',
  'Core PCE Price Index m/m': 'شاخص قیمت PCE هسته (ماهانه)',
  'Advance GDP q/q': 'تولید ناخالص داخلی مقدماتی (فصلی)',
  'CB Consumer Confidence': 'اطمینان مصرف‌کننده',
  'Prelim UoM Consumer Sentiment': 'احساسات مصرف‌کننده میشیگان',
  'JOLTS Job Openings': 'فرصت‌های شغلی JOLTS',
  'Crude Oil Inventories': 'ذخایر نفت خام',
  'Empire State Manufacturing Index': 'شاخص تولیدی امپایر استیت',
  'Main Refinancing Rate': 'نرخ بهره بانک مرکزی اروپا',
  'Monetary Policy Statement': 'بیانیه سیاست پولی',
  'ECB Press Conference': 'کنفرانس خبری بانک مرکزی اروپا',
  'German Flash Manufacturing PMI': 'PMI تولیدی مقدماتی آلمان',
  'French Flash Manufacturing PMI': 'PMI تولیدی مقدماتی فرانسه',
  'CPI Flash Estimate y/y': 'برآورد سریع تورم (سالانه)',
  'German ZEW Economic Sentiment': 'احساسات اقتصادی ZEW آلمان',
  'German Ifo Business Climate': 'فضای کسب‌وکار Ifo آلمان',
  'Official Bank Rate': 'نرخ بهره بانک انگلستان',
  'BOE Monetary Policy Report': 'گزارش سیاست پولی بانک انگلستان',
  'Claimant Count Change': 'تغییرات متقاضیان بیمه بیکاری',
  'GDP m/m': 'تولید ناخالص داخلی (ماهانه)',
  'Flash Manufacturing PMI': 'PMI تولیدی مقدماتی',
  'BOJ Policy Rate': 'نرخ بهره بانک ژاپن',
  'BOJ Press Conference': 'کنفرانس خبری بانک ژاپن',
  'Tokyo Core CPI y/y': 'تورم هسته توکیو (سالانه)',
  'SNB Policy Rate': 'نرخ بهره بانک ملی سوئیس',
  'BOC Rate Statement': 'بیانیه نرخ بهره بانک کانادا',
  'Overnight Rate': 'نرخ بهره بانک کانادا',
  'Employment Change': 'تغییرات اشتغال',
  'Cash Rate': 'نرخ بهره بانک استرالیا',
  'RBA Rate Statement': 'بیانیه نرخ بهره بانک استرالیا',
  'CPI q/q': 'شاخص قیمت مصرف‌کننده (فصلی)',
  'Official Cash Rate': 'نرخ بهره بانک نیوزیلند',
  'Employment Change q/q': 'تغییرات اشتغال (فصلی)',
  'Manufacturing PMI': 'شاخص مدیران خرید تولیدی',
  'Trade Balance': 'تراز تجاری',
  'GDP q/q': 'تولید ناخالص داخلی (فصلی)',
  'Bank Holiday': 'تعطیلی بانک‌ها',
};

export const newsTitleFa = (title: string) => FA_TITLES[title] ?? title;

// ---------- schedule helpers (all in the release's local time zone) ----------
type Kind = 'k' | 'pct' | 'idx' | 'M' | 'rate' | 'B' | 'none';

interface Rule {
  ccy: string;
  tz: string;
  title: string;
  impact: Impact;
  time: string;
  kind: Kind;
  /** typical level and spread of the number */
  mean?: number;
  sd?: number;
  /** months 1..12 the release happens in (default every month) */
  months?: number[];
  day: (y: number, m: number) => number[] | number | null;
}

const dim = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const wd = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).getUTCDay();

/** n-th weekday of the month (n = -1 → last). weekday: 0 = Sunday. */
function nth(y: number, m: number, weekday: number, n: number): number {
  if (n > 0) {
    const first = (weekday - wd(y, m, 1) + 7) % 7 + 1;
    return first + (n - 1) * 7;
  }
  const last = dim(y, m);
  return last - ((wd(y, m, last) - weekday + 7) % 7);
}
const every = (weekday: number) => (y: number, m: number) => {
  const out: number[] = [];
  for (let d = nth(y, m, weekday, 1); d <= dim(y, m); d += 7) out.push(d);
  return out;
};
/** first business day on or after `d` */
function bizOnOrAfter(y: number, m: number, d: number): number {
  let x = Math.min(d, dim(y, m));
  while (wd(y, m, x) === 0 || wd(y, m, x) === 6) x++;
  return Math.min(x, dim(y, m));
}
const nthBiz = (y: number, m: number, n: number) => {
  let d = 0;
  for (let i = 0; i < n; i++) d = bizOnOrAfter(y, m, d + 1);
  return d;
};

const MON = 1, TUE = 2, WED = 3, THU = 4, FRI = 5;
const NY = 'America/New_York';
const FFM = 'Europe/Berlin';
const LDN = 'Europe/London';

/** Central-bank meeting months with which weekday-of-month they fall on. */
const meeting = (map: Record<number, [number, number]>) => (y: number, m: number) => (map[m] ? nth(y, m, map[m][0], map[m][1]) : null);
const FOMC = meeting({ 1: [WED, -1], 3: [WED, 3], 5: [WED, 1], 6: [WED, 2], 7: [WED, -1], 9: [WED, 3], 11: [WED, 1], 12: [WED, 2] });
const ECB = meeting({ 1: [THU, 4], 3: [THU, 2], 4: [THU, 3], 6: [THU, 1], 7: [THU, 3], 9: [THU, 2], 10: [THU, 4], 12: [THU, 2] });
const BOE = meeting({ 2: [THU, 1], 3: [THU, 3], 5: [THU, 2], 6: [THU, 3], 8: [THU, 1], 9: [THU, 3], 11: [THU, 1], 12: [THU, 3] });
const BOJ = meeting({ 1: [WED, 3], 3: [TUE, 3], 4: [FRI, -1], 6: [FRI, 3], 7: [WED, -1], 9: [FRI, 3], 10: [THU, -1], 12: [WED, 3] });
const BOC = meeting({ 1: [WED, 4], 3: [WED, 1], 4: [WED, 2], 6: [WED, 1], 7: [WED, 2], 9: [WED, 1], 10: [WED, 4], 12: [WED, 2] });
const RBNZ = meeting({ 2: [WED, 4], 4: [WED, 2], 5: [WED, 4], 7: [WED, 2], 8: [WED, 3], 10: [WED, 2], 11: [WED, 4] });
const nfpDay = (y: number, m: number) => nth(y, m, FRI, 1);

const RULES: Rule[] = [
  // USD
  { ccy: 'USD', tz: NY, title: 'Non-Farm Employment Change', impact: 'high', time: '08:30', kind: 'k', mean: 190, sd: 80, day: nfpDay },
  { ccy: 'USD', tz: NY, title: 'Unemployment Rate', impact: 'high', time: '08:30', kind: 'pct', mean: 3.8, sd: 0.15, day: nfpDay },
  { ccy: 'USD', tz: NY, title: 'Average Hourly Earnings m/m', impact: 'high', time: '08:30', kind: 'pct', mean: 0.3, sd: 0.1, day: nfpDay },
  { ccy: 'USD', tz: NY, title: 'ADP Non-Farm Employment Change', impact: 'high', time: '08:15', kind: 'k', mean: 160, sd: 60, day: (y, m) => nfpDay(y, m) - 2 },
  { ccy: 'USD', tz: NY, title: 'CPI m/m', impact: 'high', time: '08:30', kind: 'pct', mean: 0.3, sd: 0.15, day: (y, m) => nth(y, m, WED, 2) },
  { ccy: 'USD', tz: NY, title: 'Core CPI m/m', impact: 'high', time: '08:30', kind: 'pct', mean: 0.3, sd: 0.1, day: (y, m) => nth(y, m, WED, 2) },
  { ccy: 'USD', tz: NY, title: 'CPI y/y', impact: 'high', time: '08:30', kind: 'pct', mean: 3.2, sd: 0.4, day: (y, m) => nth(y, m, WED, 2) },
  { ccy: 'USD', tz: NY, title: 'PPI m/m', impact: 'medium', time: '08:30', kind: 'pct', mean: 0.2, sd: 0.25, day: (y, m) => nth(y, m, THU, 2) },
  { ccy: 'USD', tz: NY, title: 'Retail Sales m/m', impact: 'high', time: '08:30', kind: 'pct', mean: 0.4, sd: 0.5, day: (y, m) => bizOnOrAfter(y, m, 15) },
  { ccy: 'USD', tz: NY, title: 'Core Retail Sales m/m', impact: 'high', time: '08:30', kind: 'pct', mean: 0.3, sd: 0.4, day: (y, m) => bizOnOrAfter(y, m, 15) },
  { ccy: 'USD', tz: NY, title: 'Empire State Manufacturing Index', impact: 'medium', time: '08:30', kind: 'idx', mean: -2, sd: 9, day: (y, m) => bizOnOrAfter(y, m, 15) },
  { ccy: 'USD', tz: NY, title: 'Unemployment Claims', impact: 'medium', time: '08:30', kind: 'k', mean: 225, sd: 14, day: every(THU) },
  { ccy: 'USD', tz: NY, title: 'ISM Manufacturing PMI', impact: 'high', time: '10:00', kind: 'idx', mean: 49.5, sd: 1.8, day: (y, m) => nthBiz(y, m, 1) },
  { ccy: 'USD', tz: NY, title: 'ISM Services PMI', impact: 'high', time: '10:00', kind: 'idx', mean: 53, sd: 1.8, day: (y, m) => nthBiz(y, m, 3) },
  { ccy: 'USD', tz: NY, title: 'JOLTS Job Openings', impact: 'high', time: '10:00', kind: 'M', mean: 8.9, sd: 0.5, day: (y, m) => nth(y, m, TUE, 1) },
  { ccy: 'USD', tz: NY, title: 'CB Consumer Confidence', impact: 'high', time: '10:00', kind: 'idx', mean: 104, sd: 5, day: (y, m) => nth(y, m, TUE, -1) },
  { ccy: 'USD', tz: NY, title: 'Prelim UoM Consumer Sentiment', impact: 'medium', time: '10:00', kind: 'idx', mean: 66, sd: 4, day: (y, m) => nth(y, m, FRI, 2) },
  { ccy: 'USD', tz: NY, title: 'Core PCE Price Index m/m', impact: 'high', time: '08:30', kind: 'pct', mean: 0.25, sd: 0.1, day: (y, m) => nth(y, m, FRI, -1) },
  { ccy: 'USD', tz: NY, title: 'Advance GDP q/q', impact: 'high', time: '08:30', kind: 'pct', mean: 2.1, sd: 1.2, months: [1, 4, 7, 10], day: (y, m) => nth(y, m, THU, -1) },
  { ccy: 'USD', tz: NY, title: 'Crude Oil Inventories', impact: 'low', time: '10:30', kind: 'M', mean: -0.5, sd: 3, day: every(WED) },
  { ccy: 'USD', tz: NY, title: 'Federal Funds Rate', impact: 'high', time: '14:00', kind: 'rate', mean: 5.25, day: FOMC },
  { ccy: 'USD', tz: NY, title: 'FOMC Statement', impact: 'high', time: '14:00', kind: 'none', day: FOMC },
  { ccy: 'USD', tz: NY, title: 'FOMC Press Conference', impact: 'high', time: '14:30', kind: 'none', day: FOMC },
  // EUR
  { ccy: 'EUR', tz: FFM, title: 'Main Refinancing Rate', impact: 'high', time: '14:15', kind: 'rate', mean: 4.25, day: ECB },
  { ccy: 'EUR', tz: FFM, title: 'Monetary Policy Statement', impact: 'high', time: '14:15', kind: 'none', day: ECB },
  { ccy: 'EUR', tz: FFM, title: 'ECB Press Conference', impact: 'high', time: '14:45', kind: 'none', day: ECB },
  { ccy: 'EUR', tz: FFM, title: 'German Flash Manufacturing PMI', impact: 'high', time: '09:30', kind: 'idx', mean: 44, sd: 2.5, day: (y, m) => bizOnOrAfter(y, m, 22) },
  { ccy: 'EUR', tz: FFM, title: 'French Flash Manufacturing PMI', impact: 'medium', time: '09:15', kind: 'idx', mean: 45, sd: 2.5, day: (y, m) => bizOnOrAfter(y, m, 22) },
  { ccy: 'EUR', tz: FFM, title: 'CPI Flash Estimate y/y', impact: 'high', time: '11:00', kind: 'pct', mean: 2.9, sd: 0.5, day: (y, m) => nthBiz(y, m, 1) },
  { ccy: 'EUR', tz: FFM, title: 'German ZEW Economic Sentiment', impact: 'medium', time: '11:00', kind: 'idx', mean: 8, sd: 12, day: (y, m) => nth(y, m, TUE, 3) },
  { ccy: 'EUR', tz: FFM, title: 'German Ifo Business Climate', impact: 'medium', time: '10:00', kind: 'idx', mean: 87, sd: 2, day: (y, m) => nth(y, m, MON, 4) },
  // GBP
  { ccy: 'GBP', tz: LDN, title: 'Official Bank Rate', impact: 'high', time: '12:00', kind: 'rate', mean: 5.25, day: BOE },
  { ccy: 'GBP', tz: LDN, title: 'BOE Monetary Policy Report', impact: 'high', time: '12:00', kind: 'none', months: [2, 5, 8, 11], day: BOE },
  { ccy: 'GBP', tz: LDN, title: 'CPI y/y', impact: 'high', time: '07:00', kind: 'pct', mean: 4.5, sd: 0.6, day: (y, m) => nth(y, m, WED, 3) },
  { ccy: 'GBP', tz: LDN, title: 'Claimant Count Change', impact: 'medium', time: '07:00', kind: 'k', mean: 10, sd: 12, day: (y, m) => nth(y, m, TUE, 3) },
  { ccy: 'GBP', tz: LDN, title: 'GDP m/m', impact: 'medium', time: '07:00', kind: 'pct', mean: 0.1, sd: 0.25, day: (y, m) => bizOnOrAfter(y, m, 11) },
  { ccy: 'GBP', tz: LDN, title: 'Retail Sales m/m', impact: 'medium', time: '07:00', kind: 'pct', mean: 0.2, sd: 0.7, day: (y, m) => nth(y, m, FRI, 3) },
  { ccy: 'GBP', tz: LDN, title: 'Flash Manufacturing PMI', impact: 'medium', time: '09:30', kind: 'idx', mean: 46.5, sd: 2, day: (y, m) => bizOnOrAfter(y, m, 22) },
  // JPY
  { ccy: 'JPY', tz: 'Asia/Tokyo', title: 'BOJ Policy Rate', impact: 'high', time: '12:00', kind: 'rate', mean: -0.1, day: BOJ },
  { ccy: 'JPY', tz: 'Asia/Tokyo', title: 'BOJ Press Conference', impact: 'high', time: '15:30', kind: 'none', day: BOJ },
  { ccy: 'JPY', tz: 'Asia/Tokyo', title: 'Tokyo Core CPI y/y', impact: 'medium', time: '08:30', kind: 'pct', mean: 2.6, sd: 0.4, day: (y, m) => nth(y, m, FRI, -1) },
  // CHF
  { ccy: 'CHF', tz: 'Europe/Zurich', title: 'SNB Policy Rate', impact: 'high', time: '09:30', kind: 'rate', mean: 1.75, months: [3, 6, 9, 12], day: (y, m) => nth(y, m, THU, 3) },
  { ccy: 'CHF', tz: 'Europe/Zurich', title: 'CPI m/m', impact: 'medium', time: '08:30', kind: 'pct', mean: 0.1, sd: 0.2, day: (y, m) => nthBiz(y, m, 3) },
  // CAD
  { ccy: 'CAD', tz: 'America/Toronto', title: 'Overnight Rate', impact: 'high', time: '10:00', kind: 'rate', mean: 5, day: BOC },
  { ccy: 'CAD', tz: 'America/Toronto', title: 'BOC Rate Statement', impact: 'high', time: '10:00', kind: 'none', day: BOC },
  { ccy: 'CAD', tz: 'America/Toronto', title: 'Employment Change', impact: 'high', time: '08:30', kind: 'k', mean: 22, sd: 28, day: nfpDay },
  { ccy: 'CAD', tz: 'America/Toronto', title: 'Unemployment Rate', impact: 'high', time: '08:30', kind: 'pct', mean: 5.6, sd: 0.2, day: nfpDay },
  { ccy: 'CAD', tz: 'America/Toronto', title: 'CPI m/m', impact: 'high', time: '08:30', kind: 'pct', mean: 0.3, sd: 0.3, day: (y, m) => nth(y, m, TUE, 3) },
  { ccy: 'CAD', tz: 'America/Toronto', title: 'Retail Sales m/m', impact: 'medium', time: '08:30', kind: 'pct', mean: 0.3, sd: 0.6, day: (y, m) => nth(y, m, FRI, 4) },
  // AUD
  { ccy: 'AUD', tz: 'Australia/Sydney', title: 'Cash Rate', impact: 'high', time: '14:30', kind: 'rate', mean: 4.1, months: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], day: (y, m) => nth(y, m, TUE, 1) },
  { ccy: 'AUD', tz: 'Australia/Sydney', title: 'RBA Rate Statement', impact: 'high', time: '14:30', kind: 'none', months: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], day: (y, m) => nth(y, m, TUE, 1) },
  { ccy: 'AUD', tz: 'Australia/Sydney', title: 'Employment Change', impact: 'high', time: '11:30', kind: 'k', mean: 25, sd: 25, day: (y, m) => nth(y, m, THU, 3) },
  { ccy: 'AUD', tz: 'Australia/Sydney', title: 'CPI q/q', impact: 'high', time: '11:30', kind: 'pct', mean: 1.0, sd: 0.3, months: [1, 4, 7, 10], day: (y, m) => nth(y, m, WED, -1) },
  // NZD
  { ccy: 'NZD', tz: 'Pacific/Auckland', title: 'Official Cash Rate', impact: 'high', time: '14:00', kind: 'rate', mean: 5.5, day: RBNZ },
  { ccy: 'NZD', tz: 'Pacific/Auckland', title: 'CPI q/q', impact: 'high', time: '10:45', kind: 'pct', mean: 1.1, sd: 0.4, months: [1, 4, 7, 10], day: (y, m) => nth(y, m, WED, 3) },
  { ccy: 'NZD', tz: 'Pacific/Auckland', title: 'Employment Change q/q', impact: 'high', time: '10:45', kind: 'pct', mean: 0.4, sd: 0.4, months: [2, 5, 8, 11], day: (y, m) => nth(y, m, WED, 1) },
  // CNY
  { ccy: 'CNY', tz: 'Asia/Shanghai', title: 'CPI y/y', impact: 'medium', time: '09:30', kind: 'pct', mean: 0.8, sd: 0.8, day: (y, m) => nth(y, m, WED, 2) },
  { ccy: 'CNY', tz: 'Asia/Shanghai', title: 'Manufacturing PMI', impact: 'medium', time: '09:30', kind: 'idx', mean: 49.8, sd: 0.8, day: (y, m) => dim(y, m) },
  { ccy: 'CNY', tz: 'Asia/Shanghai', title: 'Trade Balance', impact: 'low', time: '11:00', kind: 'B', mean: 70, sd: 15, day: (y, m) => nth(y, m, MON, 2) },
  { ccy: 'CNY', tz: 'Asia/Shanghai', title: 'GDP q/q', impact: 'medium', time: '10:00', kind: 'pct', mean: 1.2, sd: 0.4, months: [1, 4, 7, 10], day: (y, m) => nth(y, m, MON, 3) },
];

function fmtValue(kind: Kind, v: number): string {
  switch (kind) {
    case 'k':
      return `${Math.round(v)}K`;
    case 'pct':
    case 'rate':
      return `${v.toFixed(kind === 'rate' ? 2 : 1)}%`;
    case 'idx':
      return v.toFixed(1);
    case 'M':
      return `${v.toFixed(1)}M`;
    case 'B':
      return `${v.toFixed(1)}B`;
    default:
      return '';
  }
}

/** Seeded value of a release for one period (year*12 + month). */
function valueFor(rule: Rule, period: number, slot = 0): number {
  const rng = seededRng(`news:${rule.ccy}:${rule.title}:${period}:${slot}`);
  if (rule.kind === 'rate') {
    // policy rates move in quarter-point steps and mostly stay put
    let level = rule.mean ?? 0;
    const r2 = seededRng(`rate:${rule.ccy}:${rule.title}`);
    for (let p = 2015 * 12; p <= period; p++) {
      const x = r2();
      if (x < 0.06) level += 0.25;
      else if (x < 0.1) level -= 0.25;
      level += ((rule.mean ?? 0) - level) * 0.01;
    }
    return Math.round(level * 4) / 4;
  }
  const u = rng() + rng() + rng() - 1.5; // ~ N(0, 0.5)
  return (rule.mean ?? 0) + u * 2 * (rule.sd ?? 1);
}

const monthCache = new Map<number, NewsEvent[]>();

function eventsForMonth(y: number, m: number): NewsEvent[] {
  const key = y * 12 + (m - 1);
  const hit = monthCache.get(key);
  if (hit) return hit;
  const out: NewsEvent[] = [];
  for (const rule of RULES) {
    if (rule.months && !rule.months.includes(m)) continue;
    const raw = rule.day(y, m);
    if (raw === null) continue;
    const days = Array.isArray(raw) ? raw : [raw];
    days.forEach((d, slot) => {
      if (d < 1 || d > dim(y, m)) return;
      const [hh, mm] = rule.time.split(':').map(Number);
      const time = wallToUtc(y, m, d, hh, mm, rule.tz);
      const period = key * 5 + slot;
      const actual = rule.kind === 'none' ? undefined : valueFor(rule, period, 0);
      const previous = rule.kind === 'none' ? undefined : valueFor(rule, period - (Array.isArray(raw) ? 1 : 5), 0);
      const fRng = seededRng(`f:${rule.title}:${period}`);
      const forecast =
        rule.kind === 'none' || actual === undefined || previous === undefined
          ? undefined
          : rule.kind === 'rate'
            ? fRng() < 0.85
              ? actual
              : previous
            : previous + (actual - previous) * (0.3 + fRng() * 0.5) + (fRng() - 0.5) * (rule.sd ?? 1) * 0.3;
      out.push({
        id: `${rule.ccy}-${rule.title}-${y}${m}${d}`.replace(/\s+/g, ''),
        time,
        currency: rule.ccy,
        title: rule.title,
        impact: rule.impact,
        actual: actual === undefined ? undefined : fmtValue(rule.kind, actual),
        forecast: forecast === undefined ? undefined : fmtValue(rule.kind, forecast),
        previous: previous === undefined ? undefined : fmtValue(rule.kind, previous),
      });
    });
  }
  // bank holidays
  const holidays: [string, number, number][] = [
    ['USD', 1, 1],
    ['EUR', 1, 1],
    ['GBP', 1, 1],
    ['JPY', 1, 1],
    ['USD', 7, 4],
    ['USD', 12, 25],
    ['EUR', 12, 25],
    ['GBP', 12, 25],
    ['CAD', 7, 1],
    ['AUD', 1, 26],
  ];
  for (const [ccy, hm, hd] of holidays) {
    if (hm !== m) continue;
    out.push({ id: `${ccy}-hol-${y}${m}${hd}`, time: Date.UTC(y, m - 1, hd), currency: ccy, title: 'Bank Holiday', impact: 'holiday', allDay: true });
  }
  if (m === 11) {
    const d = nth(y, 11, THU, 4);
    out.push({ id: `USD-thanks-${y}`, time: Date.UTC(y, 10, d), currency: 'USD', title: 'Bank Holiday', impact: 'holiday', allDay: true });
  }
  out.sort((a, b) => a.time - b.time);
  monthCache.set(key, out);
  return out;
}

/** Sample calendar events between two instants (inclusive start, exclusive end). */
export function sampleNews(fromMs: number, toMs: number): NewsEvent[] {
  const out: NewsEvent[] = [];
  const a = new Date(fromMs);
  let y = a.getUTCFullYear();
  let m = a.getUTCMonth() + 1;
  for (let guard = 0; guard < 400; guard++) {
    if (Date.UTC(y, m - 1, 1) >= toMs + 86_400_000) break;
    for (const e of eventsForMonth(y, m)) if (e.time >= fromMs && e.time < toMs) out.push(e);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

export function filterNews(events: NewsEvent[], f: NewsFilters, cursor: number): NewsEvent[] {
  return events.filter(
    (e) =>
      (f.currencies.length === 0 || f.currencies.includes(e.currency)) &&
      f.impacts.includes(e.impact) &&
      (e.time <= cursor ? f.showPast : f.showFuture),
  );
}

/** Currencies whose news matters for a set of symbols (USD for EURUSD and so on). */
export function currenciesFor(symbolCurrencies: string[][]): string[] {
  const set = new Set<string>();
  for (const list of symbolCurrencies) for (const c of list) if ((NEWS_CURRENCIES as readonly string[]).includes(c)) set.add(c);
  return [...set];
}
