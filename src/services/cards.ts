import type { Payment } from './types';

/**
 * Card-to-card payments, shared by the API server and the in-browser demo backend: card numbers,
 * their banks, and the three-digit code that makes each payment's amount its own.
 */

/** First six digits of Iranian bank cards (Shetab) → bank. */
const BANKS: Record<string, string> = {
  '603799': 'بانک ملی ایران',
  '589210': 'بانک سپه',
  '627381': 'بانک سپه',
  '639370': 'بانک سپه',
  '639599': 'بانک سپه',
  '636949': 'بانک سپه',
  '505801': 'بانک سپه',
  '603769': 'بانک صادرات',
  '610433': 'بانک ملت',
  '991975': 'بانک ملت',
  '585983': 'بانک تجارت',
  '627353': 'بانک تجارت',
  '603770': 'بانک کشاورزی',
  '639217': 'بانک کشاورزی',
  '628023': 'بانک مسکن',
  '627760': 'پست بانک',
  '627648': 'بانک توسعه صادرات',
  '207177': 'بانک توسعه صادرات',
  '627961': 'بانک صنعت و معدن',
  '502908': 'بانک توسعه تعاون',
  '589463': 'بانک رفاه کارگران',
  '627412': 'بانک اقتصاد نوین',
  '622106': 'بانک پارسیان',
  '639194': 'بانک پارسیان',
  '627884': 'بانک پارسیان',
  '502229': 'بانک پاسارگاد',
  '639347': 'بانک پاسارگاد',
  '627488': 'بانک کارآفرین',
  '502910': 'بانک کارآفرین',
  '621986': 'بانک سامان',
  '639346': 'بانک سینا',
  '639607': 'بانک سرمایه',
  '502806': 'بانک شهر',
  '504706': 'بانک شهر',
  '502938': 'بانک دی',
  '636214': 'بانک آینده',
  '505785': 'بانک ایران زمین',
  '505416': 'بانک گردشگری',
  '505809': 'بانک خاورمیانه',
  '585947': 'بانک خاورمیانه',
  '581874': 'بانک ایران و ونزوئلا',
  '606373': 'بانک قرض‌الحسنه مهر ایران',
  '504172': 'بانک قرض‌الحسنه رسالت',
  '507677': 'مؤسسه اعتباری نور',
  '628157': 'مؤسسه اعتباری توسعه',
  '606256': 'مؤسسه اعتباری ملل',
  '636795': 'بانک مرکزی',
};

/** The bank that issued a card, or '' when its first six digits are not known. */
export const bankOfCard = (number: string) => BANKS[cardDigits(number).slice(0, 6)] ?? '';

/** Latin digits only (Persian and Arabic digits are converted; spaces and dashes dropped). */
export function cardDigits(raw: string): string {
  return raw
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/\D/g, '');
}

/** 16 digits with a valid check digit (Luhn), as every Shetab card has. */
export function isCardNumber(n: string): boolean {
  if (!/^\d{16}$/.test(n)) return false;
  let sum = 0;
  for (let i = 0; i < 16; i++) {
    let d = Number(n[i]);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/** 6037-9975-1234-5678 (four groups, Latin digits: show it left to right). */
export const fmtCardNumber = (n: string) => cardDigits(n).replace(/(\d{4})(?=\d)/g, '$1-');

/**
 * The amount to transfer, in rial: the price rounded up to whole thousands of rial, plus the code
 * as its last three digits (so the payer pays at most 1,998 rial more than the price).
 */
export const cardAmountRial = (toman: number, code: number) => Math.ceil((toman * 10) / 1000) * 1000 + code;

/** An expired transfer keeps its code this long: the money may still arrive. */
export const CARD_CODE_HOLD_MS = 24 * 3_600_000;

/** Whether this payment still owns its three-digit code (no new payment may get the same one). */
export function holdsCode(p: Payment, now = Date.now()): boolean {
  if (!p.transfer) return false;
  if (p.status === 'pending' || p.status === 'review') return true;
  return p.status === 'failed' && p.transfer.closed === 'expired' && now < p.transfer.expiresAt + CARD_CODE_HOLD_MS;
}

/** Whether the payer can still report the transfer as sent (also for a while after it expired). */
export function canReportTransfer(p: Payment, now = Date.now()): boolean {
  if (!p.transfer) return false;
  return p.status === 'pending' || (p.status === 'failed' && p.transfer.closed === 'expired' && now < p.transfer.expiresAt + CARD_CODE_HOLD_MS);
}

/** A random free code from 1–999, or null when all are taken. */
export function pickCardCode(taken: Set<number>, random = Math.random): number | null {
  const free: number[] = [];
  for (let c = 1; c <= 999; c++) if (!taken.has(c)) free.push(c);
  return free.length ? free[Math.floor(random() * free.length)] : null;
}

/** The checks for "I have paid": the last 4 digits of the payer's card and the bank's tracking number (both optional). */
export function transferReportError(payerCard: string, payerRef: string): { field: string; message: string } | null {
  if (payerCard && !/^\d{4}$/.test(payerCard)) return { field: 'payerCard', message: '۴ رقم آخر کارت خودتان را وارد کنید.' };
  if (payerRef && !/^[0-9A-Za-z-]{4,30}$/.test(payerRef)) return { field: 'payerRef', message: 'شماره‌ی پیگیری معتبر نیست.' };
  return null;
}
