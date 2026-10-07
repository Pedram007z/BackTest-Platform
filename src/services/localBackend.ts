import { addDays, diffDays, fmtDayLong, localDayKey, msToKey } from '../lib/calendar';
import { SYMBOLS, dataStartOf, seededRng } from '../lib/market';
import { sampleNews } from '../lib/news';
import { local, readJson, writeJson } from '../lib/storage';
import { getToken } from './api';
import { BackendError, type Backend } from './backend';
import { bankOfCard, canReportTransfer, cardAmountRial, cardDigits, fmtCardNumber, holdsCode, isCardNumber, pickCardCode, transferReportError } from './cards';
import {
  GATEWAY_NAMES,
  PAYMENT_METHOD_NAMES,
  SMS_PROVIDER_NAMES,
  normalizePhone,
  type AccountUser,
  type AdminStats,
  type AuditEntry,
  type CardToCardSettings,
  type DiscountCode,
  type GatewayConfig,
  type GatewayId,
  type NewsSyncStatus,
  type Payment,
  type PaymentCard,
  type Plan,
  type SiteSettings,
  type SmsLog,
  type SmsProviderId,
  type SmsSettings,
  type Ticket,
} from './types';

/**
 * In-browser backend for the hosted demo. Data lives in localStorage; SMS messages are
 * recorded in the SMS log (the code is also returned so the page can show it) and payments
 * go through the in-app sandbox gateway page.
 */

const KEY = 'backtest-local-api:v1';
const DAY = 86_400_000;

interface Db {
  users: AccountUser[];
  plans: Plan[];
  payments: Payment[];
  discounts: DiscountCode[];
  gateways: GatewayConfig[];
  cards: PaymentCard[];
  cardToCard: CardToCardSettings;
  sms: SmsSettings;
  smsLogs: SmsLog[];
  tickets: Ticket[];
  settings: SiteSettings;
  audit: AuditEntry[];
  otps: Record<string, { code: string; expiresAt: number; tries: number; sentAt: number }>;
  newsSyncedAt?: number;
}

export const DEMO_USER_ID = 'demo';
export const DEMO_PHONE = '09121234567';

const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// ---------- sample data ----------
const FIRST = ['علی', 'محمد', 'رضا', 'حسین', 'مهدی', 'امیر', 'سارا', 'مریم', 'زهرا', 'نگار', 'پویا', 'کیان', 'آرمان', 'نیلوفر', 'الهام', 'بهار', 'سینا', 'پارسا', 'یاسمن', 'فرهاد', 'شیما', 'حامد', 'مینا', 'کاوه'];
const LAST = ['محمدی', 'حسینی', 'رضایی', 'احمدی', 'کریمی', 'موسوی', 'جعفری', 'صادقی', 'رحیمی', 'نوری', 'تهرانی', 'شریفی', 'قاسمی', 'یزدانی', 'اکبری', 'فراهانی', 'کاظمی', 'نیک‌نام', 'زارعی', 'عباسی'];
const PREFIX = ['0912', '0935', '0919', '0939', '0901', '0937', '0921', '0990', '0910', '0933'];

export const DEFAULT_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'رایگان',
    description: 'برای شروع و آشنایی با بک‌تست',
    priceToman: 0,
    durationDays: 3650,
    features: ['۱ جلسه‌ی فعال', '۵ نماد فارکس', 'تایم‌فریم ۱۵ دقیقه به بالا', 'ژورنال و چک‌لیست'],
    active: true,
    sort: 0,
  },
  {
    id: 'pro-1m',
    name: 'حرفه‌ای ماهانه',
    description: 'همه‌ی امکانات، پرداخت ماه به ماه',
    priceToman: 690_000,
    durationDays: 30,
    features: ['جلسه‌ی نامحدود', 'بیش از ۷۰ نماد فارکس، شاخص و کریپتو', 'چارت TradingView و ۴ چارت هم‌زمان', 'تقویم اقتصادی ForexFactory', 'آنالیز کامل و مونت‌کارلو'],
    active: true,
    sort: 1,
  },
  {
    id: 'pro-3m',
    name: 'حرفه‌ای سه‌ماهه',
    description: '۱۴٪ ارزان‌تر از ماهانه',
    priceToman: 1_790_000,
    durationDays: 90,
    features: ['همه‌ی امکانات حرفه‌ای', 'پشتیبانی تیکتی در اولویت'],
    active: true,
    badge: 'محبوب',
    sort: 2,
  },
  {
    id: 'pro-12m',
    name: 'حرفه‌ای سالانه',
    description: 'به‌صرفه‌ترین انتخاب برای تمرین جدی',
    priceToman: 5_900_000,
    durationDays: 365,
    features: ['همه‌ی امکانات حرفه‌ای', '۲ ماه رایگان نسبت به ماهانه', 'جلسه‌ی آموزشی آنلاین'],
    active: true,
    badge: '۲ ماه رایگان',
    sort: 3,
  },
];

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'بک‌تست‌لب',
  registrationOpen: true,
  maintenance: false,
  trialDays: 7,
  trialPlanId: 'pro-1m',
  supportPhone: '021-91001234',
  otpLength: 5,
  otpTtlSec: 120,
  marketData: { forex: 'dukascopy', index: 'dukascopy', metal: 'dukascopy', energy: 'dukascopy', crypto: 'binance' },
  enabledSymbols: [],
  newsAutoSync: true,
  marketAutoDownload: true,
};

function seed(): Db {
  const rng = seededRng('admin-seed-v1');
  const pick = <T,>(a: T[]) => a[Math.floor(rng() * a.length)];
  const now = Date.now();
  const today = localDayKey();
  const users: AccountUser[] = [
    {
      id: DEMO_USER_ID,
      phone: DEMO_PHONE,
      name: 'آرش کریمی',
      role: 'admin',
      status: 'active',
      planId: 'pro-1m',
      planStartedAt: addDays(today, -17),
      planEndsAt: addDays(today, 13),
      createdAt: now - 160 * DAY,
      lastLoginAt: now - 3_600_000,
      demo: true,
    },
  ];
  for (let i = 0; i < 64; i++) {
    const created = now - Math.floor(rng() ** 1.6 * 120) * DAY - Math.floor(rng() * DAY);
    const paid = rng() < 0.55;
    const planId = paid ? pick(['pro-1m', 'pro-1m', 'pro-3m', 'pro-12m']) : 'free';
    const plan = DEFAULT_PLANS.find((p) => p.id === planId)!;
    const start = addDays(msToKey(created), Math.floor(rng() * 20));
    const end = planId === 'free' ? addDays(start, 3650) : addDays(start, plan.durationDays + (rng() < 0.3 ? -60 : 0));
    let phone = '';
    do phone = pick(PREFIX) + String(Math.floor(rng() * 1e7)).padStart(7, '0');
    while (users.some((u) => u.phone === phone));
    users.push({
      id: `u_seed_${i}`,
      phone,
      name: `${pick(FIRST)} ${pick(LAST)}`,
      role: i === 0 ? 'admin' : 'user',
      status: rng() < 0.05 ? 'banned' : 'active',
      planId,
      planStartedAt: start,
      planEndsAt: end,
      createdAt: created,
      lastLoginAt: created + Math.floor(rng() * (now - created)),
    });
  }
  users[1].name = 'مدیر سیستم';

  const gateways: GatewayId[] = ['zarinpal', 'zarinpal', 'zarinpal', 'zibal', 'zibal', 'idpay', 'nextpay'];
  const payments: Payment[] = [];
  for (const u of users) {
    if (u.planId === 'free' && rng() < 0.85) continue;
    const n = 1 + Math.floor(rng() * 3);
    for (let k = 0; k < n; k++) {
      const plan = u.planId === 'free' ? DEFAULT_PLANS[1] : DEFAULT_PLANS.find((p) => p.id === u.planId)!;
      const created = Math.min(now - 3_600_000, u.createdAt + Math.floor(rng() * Math.max(DAY, now - u.createdAt)));
      const r = rng();
      const status = r < 0.82 ? 'paid' : r < 0.94 ? 'failed' : r < 0.98 ? 'pending' : 'refunded';
      const discount = rng() < 0.18 ? pick(['NOROOZ1405', 'WELCOME15']) : undefined;
      const pct = discount === 'NOROOZ1405' ? 30 : discount ? 15 : 0;
      payments.push({
        id: `pay_seed_${payments.length}`,
        userId: u.id,
        userName: u.name,
        phone: u.phone,
        planId: plan.id,
        planName: plan.name,
        amountToman: Math.round((plan.priceToman * (100 - pct)) / 100),
        discountCode: discount,
        gateway: pick(gateways),
        status,
        authority: `A${Math.floor(rng() * 1e12).toString().padStart(12, '0')}`,
        refId: status === 'paid' || status === 'refunded' ? String(Math.floor(rng() * 1e9)) : undefined,
        cardPan: status === 'paid' ? `6037-99**-****-${String(Math.floor(rng() * 1e4)).padStart(4, '0')}` : undefined,
        createdAt: created,
        paidAt: status === 'paid' || status === 'refunded' ? created + 90_000 : undefined,
      });
    }
  }
  // card to card: two transfers waiting for the admin, one confirmed
  const cards: PaymentCard[] = [
    { id: 'card_demo1', number: '6037997512345670', holder: 'آرش کریمی', bank: bankOfCard('6037997512345670'), active: true, createdAt: now - 40 * DAY, lastUsedAt: now - 2 * 3_600_000 },
    { id: 'card_demo2', number: '6104331287452107', holder: 'آرش کریمی', bank: bankOfCard('6104331287452107'), active: true, createdAt: now - 12 * DAY, lastUsedAt: now - 3_600_000 },
  ];
  [
    [users[5], 'pro-1m', 'review', 347, 25],
    [users[11], 'pro-3m', 'review', 128, 70],
    [users[20], 'pro-1m', 'paid', 615, 26 * 60],
  ].forEach(([u, planId, status, code, minutesAgo], i) => {
    const user = u as AccountUser;
    const plan = DEFAULT_PLANS.find((p) => p.id === planId)!;
    const c = cards[i % 2];
    const created = now - (minutesAgo as number) * 60_000;
    payments.unshift({
      id: `pay_seed_card_${i}`,
      userId: user.id,
      userName: user.name,
      phone: user.phone,
      planId: plan.id,
      planName: plan.name,
      amountToman: plan.priceToman,
      gateway: 'card',
      status: status as Payment['status'],
      refId: status === 'paid' ? '730112' : undefined,
      createdAt: created,
      paidAt: status === 'paid' ? created + 40 * 60_000 : undefined,
      transfer: {
        cardId: c.id,
        cardNumber: c.number,
        holder: c.holder,
        bank: c.bank,
        code: code as number,
        amountRial: cardAmountRial(plan.priceToman, code as number),
        expiresAt: created + 30 * 60_000,
        payerCard: ['4421', '9038', '1176'][i],
        payerRef: i === 1 ? undefined : String(400_000 + i * 70_311),
        sentAt: created + 6 * 60_000,
        reviewedBy: status === 'paid' ? 'مدیر سیستم' : undefined,
        reviewedAt: status === 'paid' ? created + 40 * 60_000 : undefined,
      },
    });
  });
  payments.sort((a, b) => b.createdAt - a.createdAt);

  const smsLogs: SmsLog[] = [];
  for (let i = 0; i < 40; i++) {
    const u = pick(users);
    const code = String(10000 + Math.floor(rng() * 89999));
    smsLogs.push({
      id: `sms_seed_${i}`,
      to: u.phone,
      text: `کد ورود شما به بک‌تست‌لب: ${code}`,
      provider: 'kavenegar',
      kind: 'otp',
      status: rng() < 0.96 ? 'sent' : 'failed',
      error: undefined,
      createdAt: now - Math.floor(rng() * 20 * DAY),
    });
  }
  smsLogs.sort((a, b) => b.createdAt - a.createdAt);

  const ticketSubjects = [
    ['پرداخت انجام شد ولی اشتراک فعال نشد', 'سلام، از درگاه زرین‌پال پرداخت کردم و مبلغ کسر شد ولی پلن هنوز رایگان است.', 'high'],
    ['داده‌ی نماد طلا در سال ۲۰۱۸', 'برای XAUUSD قبل از ۲۰۱۹ کندل‌ها خیلی کم است. امکانش هست اضافه شود؟', 'normal'],
    ['پیشنهاد: میانبر صفحه‌کلید برای خرید و فروش', 'اگر با کلید B و S بشود سفارش گذاشت خیلی سریع‌تر می‌شود.', 'low'],
    ['کد تأیید پیامک نمی‌آید', 'روی خط ایرانسل کد ورود دیر می‌رسد.', 'high'],
    ['خروجی اکسل از ژورنال', 'آیا می‌شود معاملات ژورنال را به اکسل گرفت؟', 'normal'],
    ['تقویم اقتصادی برای ین', 'خبرهای بانک ژاپن روی چارت USDJPY نمایش داده نمی‌شود.', 'normal'],
  ] as const;
  const tickets: Ticket[] = ticketSubjects.map(([subject, text, priority], i) => {
    const u = users[2 + i * 3];
    const created = now - (i * 2 + 1) * DAY - Math.floor(rng() * DAY);
    const answered = i % 2 === 1;
    return {
      id: `tk_seed_${i}`,
      userId: u.id,
      userName: u.name,
      subject,
      status: i === 4 ? 'closed' : answered ? 'answered' : 'open',
      priority,
      messages: [
        { from: 'user', text, at: created },
        ...(answered ? [{ from: 'admin' as const, text: 'سلام، ممنون از پیام شما. موضوع بررسی شد و در نسخه‌ی بعدی برطرف می‌شود.', at: created + 4 * 3_600_000 }] : []),
      ],
      createdAt: created,
      updatedAt: created + (answered ? 4 * 3_600_000 : 0),
    };
  });

  const audit: AuditEntry[] = [
    ['مدیر سیستم', 'تغییر قیمت پلن', 'حرفه‌ای ماهانه'],
    ['مدیر سیستم', 'فعال کردن درگاه', 'زیبال'],
    ['آرش کریمی', 'ارسال پیامک گروهی', '۴۲ کاربر'],
    ['مدیر سیستم', 'ساخت کد تخفیف', 'NOROOZ1405'],
    ['آرش کریمی', 'مسدود کردن کاربر', users[9].name],
    ['مدیر سیستم', 'همگام‌سازی تقویم اقتصادی', 'ForexFactory'],
    ['آرش کریمی', 'تمدید اشتراک', users[14].name],
  ].map(([actor, action, target], i) => ({ id: `au_seed_${i}`, actor, action, target, at: now - (i + 1) * 9 * 3_600_000 }));

  return {
    users,
    plans: DEFAULT_PLANS,
    payments,
    discounts: [
      { id: 'dc1', code: 'NOROOZ1405', percent: 30, maxUses: 500, used: 137, expiresAt: '2026-04-15', active: true },
      { id: 'dc4', code: 'PAEEZ1405', percent: 20, maxUses: 300, used: 46, expiresAt: addDays(localDayKey(), 45), active: true },
      { id: 'dc5', code: 'WELCOME20', percent: 20, maxUses: 5000, used: 64, active: true, firstPurchaseOnly: true },
      { id: 'dc2', code: 'WELCOME15', percent: 15, maxUses: 10_000, used: 412, active: true },
      { id: 'dc3', code: 'VIP50', percent: 50, maxUses: 20, used: 20, expiresAt: '2025-12-31', active: false },
    ],
    gateways: [
      { id: 'zarinpal', name: GATEWAY_NAMES.zarinpal, enabled: true, sandbox: true, merchantId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', priority: 1 },
      { id: 'zibal', name: GATEWAY_NAMES.zibal, enabled: true, sandbox: true, merchantId: 'zibal', priority: 2 },
      { id: 'idpay', name: GATEWAY_NAMES.idpay, enabled: false, sandbox: true, merchantId: '', priority: 3 },
      { id: 'nextpay', name: GATEWAY_NAMES.nextpay, enabled: false, sandbox: false, merchantId: '', priority: 4 },
      { id: 'payir', name: GATEWAY_NAMES.payir, enabled: false, sandbox: true, merchantId: 'test', priority: 5 },
    ],
    cards,
    cardToCard: { ...DEFAULT_CARD_TO_CARD, enabled: true },
    sms: {
      active: 'kavenegar',
      enabled: false,
      providers: (Object.keys(SMS_PROVIDER_NAMES) as SmsProviderId[]).map((id) => ({
        id,
        name: SMS_PROVIDER_NAMES[id],
        apiKey: '',
        sender: id === 'kavenegar' ? '10008663' : '',
        otpTemplate: id === 'kavenegar' ? 'backtest-verify' : '',
      })),
    },
    smsLogs,
    tickets,
    settings: DEFAULT_SETTINGS,
    audit,
    otps: {},
    newsSyncedAt: now - 5 * 3_600_000,
  };
}

const DEFAULT_CARD_TO_CARD: CardToCardSettings = { enabled: false, payMinutes: 30, note: '' };

// ---------- storage ----------
let cache: Db | null = null;
function db(): Db {
  if (!cache) {
    cache = readJson<Db | null>(local, KEY, null) ?? seed();
    // saved before card to card existed
    cache.cards ??= [];
    cache.cardToCard ??= { ...DEFAULT_CARD_TO_CARD };
  }
  return cache;
}
function save() {
  if (cache) writeJson(local, KEY, cache);
}
const delay = <T,>(v: T, ms = 220) => new Promise<T>((r) => setTimeout(() => r(v), ms));
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

function currentUser(): AccountUser {
  const token = getToken();
  const id = token?.startsWith('local.') ? token.slice(6) : null;
  const u = db().users.find((x) => x.id === id);
  if (!u) throw new BackendError('unauthorized', 'نشست شما تمام شده؛ دوباره وارد شوید.');
  if (u.status === 'banned') throw new BackendError('banned', 'این حساب مسدود شده است. با پشتیبانی تماس بگیرید.');
  return u;
}
function requireAdmin(): AccountUser {
  const u = currentUser();
  if (u.role !== 'admin') throw new BackendError('forbidden', 'دسترسی مدیر لازم است.');
  return u;
}
function log(action: string, target?: string) {
  const actor = (() => {
    try {
      return currentUser().name;
    } catch {
      return 'سیستم';
    }
  })();
  db().audit.unshift({ id: uid('au'), actor, action, target, at: Date.now() });
  db().audit = db().audit.slice(0, 300);
}
function sendSms(to: string, text: string, kind: SmsLog['kind']): SmsLog {
  const d = db();
  const entry: SmsLog = { id: uid('sms'), to, text, provider: d.sms.enabled ? d.sms.active : 'dev', kind, status: 'sent', createdAt: Date.now() };
  d.smsLogs.unshift(entry);
  d.smsLogs = d.smsLogs.slice(0, 500);
  return entry;
}

function extendPlan(user: AccountUser, plan: Plan) {
  const today = localDayKey();
  const stillActive = user.planId !== 'free' && user.planEndsAt >= today;
  const from = stillActive ? user.planEndsAt : today;
  user.planId = plan.id;
  if (!stillActive) user.planStartedAt = today;
  user.planEndsAt = addDays(from, plan.durationDays);
}

/** Whether the user has completed a purchase before (a refunded one counts too). */
function hasPurchased(userId: string): boolean {
  return db().payments.some((p) => p.userId === userId && (p.status === 'paid' || p.status === 'refunded'));
}

function discountFor(code: string | undefined, plan: Plan, user?: AccountUser): { percent: number; finalToman: number; dc?: DiscountCode } {
  if (!code) return { percent: 0, finalToman: plan.priceToman };
  const dc = db().discounts.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!dc || !dc.active) throw new BackendError('bad_code', 'این کد تخفیف معتبر نیست.', 'discount');
  if (dc.expiresAt && dc.expiresAt < localDayKey()) throw new BackendError('expired', 'مهلت این کد تخفیف تمام شده است.', 'discount');
  if (dc.used >= dc.maxUses) throw new BackendError('used_up', 'ظرفیت این کد تخفیف پر شده است.', 'discount');
  if (dc.firstPurchaseOnly && user && hasPurchased(user.id)) throw new BackendError('first_purchase', 'این کد تخفیف فقط برای اولین خرید است.', 'discount');
  return { percent: dc.percent, finalToman: Math.round((plan.priceToman * (100 - dc.percent)) / 100), dc };
}

function page<T>(items: T[], p = 1, size = 20) {
  return { items: items.slice((p - 1) * size, p * size), total: items.length };
}

function markPaid(p: Payment, refId?: string, cardPan?: string) {
  const d = db();
  p.status = 'paid';
  p.paidAt = Date.now();
  p.refId = refId;
  p.cardPan = cardPan;
  const user = d.users.find((u) => u.id === p.userId);
  const plan = d.plans.find((x) => x.id === p.planId);
  if (user && plan) extendPlan(user, plan);
  if (p.discountCode) {
    const dc = d.discounts.find((x) => x.code === p.discountCode);
    if (dc) dc.used++;
  }
}

/** Called by the sandbox gateway page in demo mode. */
export function completeSandboxPayment(paymentId: string, ok: boolean): Payment {
  const d = db();
  const p = d.payments.find((x) => x.id === paymentId);
  if (!p) throw new BackendError('not_found', 'تراکنش پیدا نشد.');
  if (p.status !== 'pending' || p.transfer) return clone(p);
  if (ok) markPaid(p, String(Math.floor(Math.random() * 1e9)), '6037-99**-****-1234');
  else p.status = 'failed';
  save();
  return clone(p);
}

// ---------- card to card (same rules as server/src/payments/card.ts) ----------
const cardPaymentsOpen = () => db().cardToCard.enabled && db().cards.some((c) => c.active);

function expireTransfers(now = Date.now()) {
  for (const p of db().payments) {
    if (p.transfer && p.status === 'pending' && p.transfer.expiresAt < now) {
      p.status = 'failed';
      p.transfer.closed = 'expired';
    }
  }
}

function startCardPayment(user: AccountUser, plan: Plan, finalToman: number, discountCode: string | undefined) {
  const d = db();
  if (!cardPaymentsOpen()) throw new BackendError('gateway', 'پرداخت کارت به کارت فعال نیست.', 'gateway');
  const now = Date.now();
  expireTransfers(now);
  const mine = d.payments.filter((p) => p.userId === user.id && p.transfer);
  if (mine.filter((p) => p.status === 'review').length >= 3) {
    throw new BackendError('too_many', 'سه پرداخت کارت به کارت شما در انتظار تأیید است؛ پس از بررسی آن‌ها دوباره تلاش کنید.', 'gateway');
  }
  const same = mine.find((p) => p.status === 'pending' && p.planId === plan.id && p.amountToman === finalToman && p.discountCode === discountCode);
  if (same) return same;
  for (const p of mine) {
    if (p.status === 'pending') {
      p.status = 'failed';
      p.transfer!.closed = 'cancelled';
    }
  }
  const code = pickCardCode(new Set(d.payments.filter((p) => holdsCode(p, now)).map((p) => p.transfer!.code)));
  if (code === null) throw new BackendError('busy', 'ظرفیت پرداخت کارت به کارت موقتاً پر است؛ کمی بعد یا با درگاه بانکی پرداخت کنید.', 'gateway');
  const card = d.cards.filter((c) => c.active).sort((a, b) => (a.lastUsedAt ?? 0) - (b.lastUsedAt ?? 0))[0];
  card.lastUsedAt = now;
  const p: Payment = {
    id: uid('pay'),
    userId: user.id,
    userName: user.name,
    phone: user.phone,
    planId: plan.id,
    planName: plan.name,
    amountToman: finalToman,
    discountCode,
    gateway: 'card',
    status: 'pending',
    createdAt: now,
    transfer: { cardId: card.id, cardNumber: card.number, holder: card.holder, bank: card.bank, code, amountRial: cardAmountRial(finalToman, code), expiresAt: now + d.cardToCard.payMinutes * 60_000, instructions: d.cardToCard.note || undefined },
  };
  d.payments.unshift(p);
  return p;
}

function ownTransfer(id: string) {
  const u = currentUser();
  const p = db().payments.find((x) => x.id === id && x.userId === u.id);
  if (!p?.transfer) throw new BackendError('not_found', 'پرداخت پیدا نشد.');
  return p;
}

function adminTransfer(id: string) {
  const p = db().payments.find((x) => x.id === id);
  if (!p?.transfer) throw new BackendError('not_found', 'پرداخت کارت به کارت پیدا نشد.');
  return p;
}

const latin = (v: string | undefined) => (v ?? '').replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06f0)).trim();

export function sandboxPaymentInfo(paymentId: string): Payment | null {
  const p = db().payments.find((x) => x.id === paymentId);
  return p ? clone(p) : null;
}

export const localBackend: Backend = {
  mode: 'demo',

  async siteConfig() {
    const s = db().settings;
    return {
      siteName: s.siteName,
      registrationOpen: s.registrationOpen,
      maintenance: s.maintenance,
      supportPhone: s.supportPhone,
      enabledSymbols: [...s.enabledSymbols],
      market: {},
    };
  },

  async requestOtp(raw) {
    const phone = normalizePhone(raw);
    if (!phone) throw new BackendError('bad_phone', 'شماره موبایل درست نیست. نمونه: ۰۹۱۲۱۲۳۴۵۶۷', 'phone');
    const d = db();
    const exists = d.users.some((u) => u.phone === phone);
    if (!exists && !d.settings.registrationOpen) throw new BackendError('closed', 'ثبت‌نام کاربر جدید فعلاً بسته است.', 'phone');
    const prev = d.otps[phone];
    const wait = prev ? Math.ceil((prev.sentAt + 60_000 - Date.now()) / 1000) : 0;
    if (wait > 0) throw new BackendError('too_soon', `برای درخواست کد دوباره ${wait} ثانیه صبر کنید.`, 'phone');
    const len = d.settings.otpLength;
    const code = String(Math.floor(10 ** (len - 1) + Math.random() * 9 * 10 ** (len - 1)));
    d.otps[phone] = { code, expiresAt: Date.now() + d.settings.otpTtlSec * 1000, tries: 0, sentAt: Date.now() };
    sendSms(phone, `کد ورود شما به ${d.settings.siteName}: ${code}\n@${location.host} #${code}`, 'otp');
    save();
    return delay({ ttlSec: d.settings.otpTtlSec, length: len, resendInSec: 60, isNew: !exists, devCode: code }, 500);
  },

  async verifyOtp(raw, codeRaw, name) {
    const phone = normalizePhone(raw);
    if (!phone) throw new BackendError('bad_phone', 'شماره موبایل درست نیست.', 'phone');
    const code = codeRaw.replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06f0)).replace(/\D/g, '');
    const d = db();
    const rec = d.otps[phone];
    if (!rec || rec.expiresAt < Date.now()) throw new BackendError('expired', 'کد منقضی شده است؛ کد جدید بگیرید.', 'code');
    if (rec.code !== code) {
      rec.tries++;
      if (rec.tries >= 5) delete d.otps[phone];
      save();
      throw new BackendError('bad_code', rec.tries >= 5 ? 'کد چند بار اشتباه وارد شد؛ کد جدید بگیرید.' : 'کد واردشده درست نیست.', 'code');
    }
    let user = d.users.find((u) => u.phone === phone);
    const isNew = !user;
    if (!user) {
      const n = (name ?? '').trim();
      if (n.length < 2) throw new BackendError('need_name', 'نام و نام خانوادگی را بنویسید.', 'name');
      const today = localDayKey();
      user = {
        id: uid('u'),
        phone,
        name: n,
        role: 'user',
        status: 'active',
        planId: d.settings.trialDays > 0 ? d.settings.trialPlanId : 'free',
        planStartedAt: today,
        planEndsAt: addDays(today, d.settings.trialDays > 0 ? d.settings.trialDays : 3650),
        createdAt: Date.now(),
      };
      d.users.unshift(user);
    }
    if (user.status === 'banned') throw new BackendError('banned', 'این حساب مسدود شده است. با پشتیبانی تماس بگیرید.');
    delete d.otps[phone];
    user.lastLoginAt = Date.now();
    save();
    return delay({ token: `local.${user.id}`, user: clone(user), isNew }, 350);
  },

  /** the demo has no admin sign-in page: its sample account already opens the panel */
  async adminGate() {
    return false;
  },
  async adminLogin() {
    throw new BackendError('unsupported', 'ورود با نام کاربری و رمز فقط روی سرور فعال است؛ در نسخه‌ی نمایشی از «ورود با حساب نمایشی» استفاده کنید.', 'username');
  },

  async demoLogin() {
    const d = db();
    let user = d.users.find((u) => u.id === DEMO_USER_ID);
    if (!user) {
      cache = seed();
      user = db().users.find((u) => u.id === DEMO_USER_ID)!;
    }
    user.lastLoginAt = Date.now();
    save();
    return delay({ token: `local.${DEMO_USER_ID}`, user: clone(user), isNew: false }, 350);
  },

  async me() {
    return delay(clone(currentUser()), 0);
  },
  async updateMe(patch) {
    const u = currentUser();
    if (patch.name !== undefined) u.name = patch.name.trim();
    save();
    return clone(u);
  },
  async logout() {},

  async plans() {
    return delay(clone(db().plans.filter((p) => p.active).sort((a, b) => a.sort - b.sort)), 80);
  },
  async gateways() {
    const list: { id: Payment['gateway']; name: string }[] = db()
      .gateways.filter((g) => g.enabled)
      .sort((a, b) => a.priority - b.priority)
      .map((g) => ({ id: g.id, name: g.name }));
    if (cardPaymentsOpen()) list.push({ id: 'card', name: PAYMENT_METHOD_NAMES.card });
    return delay(list, 80);
  },
  async checkDiscount(code, planId) {
    const plan = db().plans.find((p) => p.id === planId);
    if (!plan) throw new BackendError('not_found', 'پلن پیدا نشد.');
    let user: AccountUser | undefined;
    try {
      user = currentUser();
    } catch {
      user = undefined;
    }
    const r = discountFor(code, plan, user);
    return delay({ percent: r.percent, finalToman: r.finalToman });
  },
  async checkout({ planId, gateway, discountCode }) {
    const user = currentUser();
    const d = db();
    const plan = d.plans.find((p) => p.id === planId && p.active);
    if (!plan || plan.priceToman <= 0) throw new BackendError('not_found', 'این پلن قابل خرید نیست.');
    if (gateway === 'card') {
      const disc = discountFor(discountCode, plan, user);
      const t = startCardPayment(user, plan, disc.finalToman, disc.dc?.code);
      save();
      return delay({ paymentId: t.id, amountToman: t.amountToman, redirectUrl: `/billing/card?payment=${t.id}` }, 400);
    }
    const g = d.gateways.find((x) => x.id === gateway && x.enabled);
    if (!g) throw new BackendError('gateway', 'این درگاه فعال نیست.');
    const disc = discountFor(discountCode, plan, user);
    const p: Payment = {
      id: uid('pay'),
      userId: user.id,
      userName: user.name,
      phone: user.phone,
      planId: plan.id,
      planName: plan.name,
      amountToman: disc.finalToman,
      discountCode: disc.dc?.code,
      gateway,
      status: 'pending',
      authority: `S${Date.now()}`,
      createdAt: Date.now(),
    };
    d.payments.unshift(p);
    save();
    return delay({ paymentId: p.id, amountToman: p.amountToman, redirectUrl: `/pay/sandbox?payment=${p.id}` }, 500);
  },
  async payment(id) {
    expireTransfers();
    const p = db().payments.find((x) => x.id === id);
    if (!p) throw new BackendError('not_found', 'تراکنش پیدا نشد.');
    return clone(p);
  },
  async reportTransfer(id, input) {
    expireTransfers();
    const p = ownTransfer(id);
    if (p.status !== 'review') {
      if (!canReportTransfer(p)) throw new BackendError('bad_state', 'این پرداخت بسته شده است؛ از صفحه‌ی اشتراک دوباره پرداخت کنید.');
      const payerCard = latin(input.payerCard);
      const payerRef = latin(input.payerRef);
      const err = transferReportError(payerCard, payerRef);
      if (err) throw new BackendError('invalid', err.message, err.field);
      p.status = 'review';
      Object.assign(p.transfer!, { closed: undefined, payerCard: payerCard || undefined, payerRef: payerRef || undefined, sentAt: Date.now() });
      save();
    }
    return delay(clone(p), 400);
  },
  async cancelTransfer(id) {
    const p = ownTransfer(id);
    if (p.status !== 'pending') throw new BackendError('bad_state', 'فقط پرداختی که هنوز گزارش نشده لغو می‌شود.');
    p.status = 'failed';
    p.transfer!.closed = 'cancelled';
    save();
    return clone(p);
  },
  async myPayments() {
    const u = currentUser();
    expireTransfers();
    return clone(db().payments.filter((p) => p.userId === u.id));
  },
  async myTickets() {
    const u = currentUser();
    return clone(db().tickets.filter((t) => t.userId === u.id));
  },
  async createTicket(subject, text) {
    const u = currentUser();
    const t: Ticket = { id: uid('tk'), userId: u.id, userName: u.name, subject, status: 'open', priority: 'normal', messages: [{ from: 'user', text, at: Date.now() }], createdAt: Date.now(), updatedAt: Date.now() };
    db().tickets.unshift(t);
    save();
    return delay(clone(t));
  },
  async replyMyTicket(id, text) {
    const u = currentUser();
    const t = db().tickets.find((x) => x.id === id && x.userId === u.id);
    if (!t) throw new BackendError('not_found', 'تیکت پیدا نشد.');
    t.messages.push({ from: 'user', text, at: Date.now() });
    t.status = 'open';
    t.updatedAt = Date.now();
    save();
    return clone(t);
  },

  admin: {
    async stats() {
      requireAdmin();
      const d = db();
      const now = Date.now();
      const today = localDayKey();
      const paid = d.payments.filter((p) => p.status === 'paid');
      const monthStart = now - 30 * DAY;
      const days = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29));
      const byDay = (list: { at: number; v: number }[]) => days.map((day) => list.filter((x) => msToKey(x.at) === day).reduce((s, x) => s + x.v, 0));
      const signups = byDay(d.users.map((u) => ({ at: u.createdAt, v: 1 })));
      const revenue = byDay(paid.map((p) => ({ at: p.paidAt ?? p.createdAt, v: p.amountToman })));
      const gateways = [...new Set(d.payments.map((p) => p.gateway))];
      const stats: AdminStats = {
        users: d.users.length,
        newUsers30d: d.users.filter((u) => u.createdAt >= monthStart).length,
        activeSubscriptions: d.users.filter((u) => u.planId !== 'free' && u.planEndsAt >= today).length,
        revenueMonth: paid.filter((p) => (p.paidAt ?? p.createdAt) >= monthStart).reduce((s, p) => s + p.amountToman, 0),
        revenueTotal: paid.reduce((s, p) => s + p.amountToman, 0),
        openTickets: d.tickets.filter((t) => t.status === 'open').length,
        smsMonth: d.smsLogs.filter((l) => l.createdAt >= monthStart).length,
        signupsByDay: days.map((day, i) => ({ day, count: signups[i] })),
        revenueByDay: days.map((day, i) => ({ day, amount: revenue[i] })),
        byGateway: gateways.map((g) => {
          const list = paid.filter((p) => p.gateway === g);
          return { gateway: g, amount: list.reduce((s, p) => s + p.amountToman, 0), count: list.length };
        }),
        planMix: d.plans.map((p) => ({ planId: p.id, name: p.name, count: d.users.filter((u) => u.planId === p.id && (p.id === 'free' || u.planEndsAt >= today)).length })),
      };
      return delay(stats, 250);
    },
    async users(q) {
      requireAdmin();
      const text = (q.q ?? '').trim().toLowerCase();
      const list = db()
        .users.filter((u) => {
          if (!text) return true;
          const digits = normalizePhone(text) ?? text.replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06f0)).replace(/\D/g, '');
          return u.name.toLowerCase().includes(text) || (digits.length > 0 && u.phone.includes(digits));
        })
        .filter((u) => !q.planId || q.planId === 'all' || u.planId === q.planId)
        .filter((u) => !q.status || q.status === 'all' || u.status === q.status)
        .filter((u) => !q.role || q.role === 'all' || u.role === q.role)
        .sort((a, b) => b.createdAt - a.createdAt);
      return delay(clone(page(list, q.page, q.pageSize)), 150);
    },
    async updateUser(id, patch) {
      requireAdmin();
      const u = db().users.find((x) => x.id === id);
      if (!u) throw new BackendError('not_found', 'کاربر پیدا نشد.');
      const before = { ...u };
      Object.assign(u, patch);
      if (patch.status && patch.status !== before.status) log(patch.status === 'banned' ? 'مسدود کردن کاربر' : 'رفع مسدودی کاربر', u.name);
      else if (patch.planEndsAt && patch.planEndsAt !== before.planEndsAt) log('تغییر اشتراک', `${u.name}: تا ${fmtDayLong(patch.planEndsAt)}`);
      else if (patch.role && patch.role !== before.role) log(patch.role === 'admin' ? 'دادن دسترسی مدیر' : 'گرفتن دسترسی مدیر', u.name);
      else log('ویرایش کاربر', u.name);
      save();
      return clone(u);
    },
    async deleteUser(id) {
      const me = requireAdmin();
      if (id === me.id) throw new BackendError('self', 'نمی‌توانید حساب خودتان را حذف کنید.');
      const d = db();
      const u = d.users.find((x) => x.id === id);
      d.users = d.users.filter((x) => x.id !== id);
      log('حذف کاربر', u?.name);
      save();
    },
    async plans() {
      requireAdmin();
      return clone(db().plans.sort((a, b) => a.sort - b.sort));
    },
    async savePlan(plan) {
      requireAdmin();
      const d = db();
      const i = d.plans.findIndex((p) => p.id === plan.id);
      if (i >= 0) d.plans[i] = plan;
      else d.plans.push(plan);
      log(i >= 0 ? 'ویرایش پلن' : 'ساخت پلن', plan.name);
      save();
      return clone(plan);
    },
    async deletePlan(id) {
      requireAdmin();
      const d = db();
      if (d.users.some((u) => u.planId === id)) throw new BackendError('in_use', 'کاربرانی روی این پلن هستند؛ به‌جای حذف آن را غیرفعال کنید.');
      const p = d.plans.find((x) => x.id === id);
      d.plans = d.plans.filter((x) => x.id !== id);
      log('حذف پلن', p?.name);
      save();
    },
    async payments(q) {
      requireAdmin();
      expireTransfers();
      const text = latin(q.q).replace(/[,٬]/g, '');
      const code = /^\d{1,3}$/.test(text) ? Number(text) : null;
      const list = db()
        .payments.filter(
          (p) =>
            !text ||
            (code !== null
              ? p.transfer?.code === code
              : p.userName.includes(text) ||
                p.phone.includes(text) ||
                (p.refId ?? '').includes(text) ||
                (p.authority ?? '').includes(text) ||
                (!!p.transfer && (String(p.transfer.amountRial).includes(text) || p.transfer.payerRef === text || p.transfer.cardNumber.includes(text)))),
        )
        .filter((p) => !q.status || q.status === 'all' || p.status === q.status)
        .filter((p) => !q.gateway || q.gateway === 'all' || p.gateway === q.gateway);
      return delay(clone(page(list, q.page, q.pageSize)), 150);
    },
    async refundPayment(id) {
      requireAdmin();
      const p = db().payments.find((x) => x.id === id);
      if (!p || p.status !== 'paid') throw new BackendError('bad_state', 'فقط تراکنش‌های موفق قابل استرداد هستند.');
      p.status = 'refunded';
      log('استرداد وجه', `${p.userName} — ${p.amountToman.toLocaleString('fa-IR')} تومان`);
      save();
      return clone(p);
    },
    async confirmPayment(id, refId) {
      const admin = requireAdmin();
      const p = adminTransfer(id);
      if (p.status === 'paid' || p.status === 'refunded') throw new BackendError('bad_state', 'این پرداخت قبلاً تأیید شده است.');
      const ref = latin(refId);
      if (ref && !/^[0-9A-Za-z-]{4,30}$/.test(ref)) throw new BackendError('invalid', 'شماره‌ی پیگیری معتبر نیست.', 'refId');
      Object.assign(p.transfer!, { closed: undefined, reviewedBy: admin.name, reviewedAt: Date.now() });
      markPaid(p, ref || p.transfer!.payerRef, p.transfer!.payerCard ? `****-${p.transfer!.payerCard}` : undefined);
      log('تأیید کارت به کارت', `${p.userName} — ${p.transfer!.amountRial.toLocaleString('fa-IR')} ریال`);
      save();
      return delay(clone(p));
    },
    async rejectPayment(id, reason) {
      const admin = requireAdmin();
      const p = adminTransfer(id);
      if (p.status !== 'pending' && p.status !== 'review') throw new BackendError('bad_state', 'فقط پرداخت‌های باز رد می‌شوند.');
      p.status = 'failed';
      Object.assign(p.transfer!, { closed: 'rejected', note: reason.trim().slice(0, 200) || 'واریزی با این مبلغ به حساب نرسید.', reviewedBy: admin.name, reviewedAt: Date.now() });
      log('رد کارت به کارت', `${p.userName} — ${p.transfer!.amountRial.toLocaleString('fa-IR')} ریال`);
      save();
      return delay(clone(p));
    },
    async cards() {
      requireAdmin();
      const d = db();
      return delay(
        clone({
          settings: d.cardToCard,
          cards: d.cards.map((c) => {
            const list = d.payments.filter((p) => p.transfer?.cardId === c.id);
            const paid = list.filter((p) => p.status === 'paid');
            return { ...c, open: list.filter((p) => p.status === 'pending' || p.status === 'review').length, paidCount: paid.length, paidToman: paid.reduce((s, p) => s + p.amountToman, 0) };
          }),
        }),
        150,
      );
    },
    async saveCard(input) {
      requireAdmin();
      const d = db();
      const number = cardDigits(input.number);
      if (!isCardNumber(number)) throw new BackendError('invalid', 'شماره‌ی کارت ۱۶ رقمی معتبر نیست.', 'number');
      const holder = input.holder.trim();
      if (holder.length < 2 || holder.length > 60) throw new BackendError('invalid', 'نام صاحب کارت را وارد کنید (حداکثر ۶۰ حرف).', 'holder');
      if (d.cards.some((c) => c.number === number && c.id !== input.id)) throw new BackendError('exists', 'این کارت قبلاً اضافه شده است.', 'number');
      const old = d.cards.find((c) => c.id === input.id);
      const card: PaymentCard = { id: input.id, number, holder, bank: input.bank.trim().slice(0, 40) || bankOfCard(number), active: input.active, createdAt: old?.createdAt ?? Date.now(), lastUsedAt: old?.lastUsedAt };
      d.cards = old ? d.cards.map((c) => (c.id === card.id ? card : c)) : [...d.cards, card];
      log(old ? 'ویرایش کارت' : 'افزودن کارت', `${holder} — ${fmtCardNumber(number)}${card.active ? '' : ' (غیرفعال)'}`);
      save();
      return delay(clone(card));
    },
    async deleteCard(id) {
      requireAdmin();
      const d = db();
      const card = d.cards.find((c) => c.id === id);
      if (!card) throw new BackendError('not_found', 'کارت پیدا نشد.');
      const open = d.payments.filter((p) => p.transfer?.cardId === id && (p.status === 'pending' || p.status === 'review')).length;
      if (open) throw new BackendError('in_use', `${open.toLocaleString('fa-IR')} پرداخت باز روی این کارت است؛ فعلاً آن را غیرفعال کنید و پس از بستن آن‌ها حذفش کنید.`);
      d.cards = d.cards.filter((c) => c.id !== id);
      log('حذف کارت', `${card.holder} — ${fmtCardNumber(card.number)}`);
      save();
    },
    async saveCardSettings(input) {
      requireAdmin();
      const minutes = Number(latin(String(input.payMinutes)));
      if (!Number.isInteger(minutes) || minutes < 5 || minutes > 1440) throw new BackendError('invalid', 'مهلت پرداخت باید بین ۵ تا ۱۴۴۰ دقیقه باشد.', 'payMinutes');
      if (input.note.trim().length > 300) throw new BackendError('invalid', 'توضیح حداکثر ۳۰۰ حرف است.', 'note');
      db().cardToCard = { enabled: input.enabled, payMinutes: minutes, note: input.note.trim() };
      log('تنظیم کارت به کارت', input.enabled ? 'فعال' : 'غیرفعال');
      save();
      return clone(db().cardToCard);
    },
    async discounts() {
      requireAdmin();
      return clone(db().discounts);
    },
    async saveDiscount(dc) {
      requireAdmin();
      const d = db();
      const code = dc.code.trim().toUpperCase();
      if (!/^[A-Z0-9_-]{3,24}$/.test(code)) throw new BackendError('bad_code', 'کد باید ۳ تا ۲۴ حرف انگلیسی یا عدد باشد.', 'code');
      if (d.discounts.some((x) => x.code === code && x.id !== dc.id)) throw new BackendError('exists', 'این کد قبلاً ساخته شده است.', 'code');
      const next = { ...dc, code, firstPurchaseOnly: dc.firstPurchaseOnly || undefined };
      const i = d.discounts.findIndex((x) => x.id === dc.id);
      if (i >= 0) d.discounts[i] = next;
      else d.discounts.unshift(next);
      log(i >= 0 ? 'ویرایش کد تخفیف' : 'ساخت کد تخفیف', next.firstPurchaseOnly ? `${code} (فقط اولین خرید)` : code);
      save();
      return clone(next);
    },
    async deleteDiscount(id) {
      requireAdmin();
      const d = db();
      const dc = d.discounts.find((x) => x.id === id);
      d.discounts = d.discounts.filter((x) => x.id !== id);
      log('حذف کد تخفیف', dc?.code);
      save();
    },
    async gateways() {
      requireAdmin();
      return clone(db().gateways.sort((a, b) => a.priority - b.priority));
    },
    async saveGateway(g) {
      requireAdmin();
      const d = db();
      d.gateways = d.gateways.map((x) => (x.id === g.id ? g : x));
      log('تنظیم درگاه پرداخت', `${g.name}${g.enabled ? '' : ' (غیرفعال)'}`);
      save();
      return clone(g);
    },
    async testGateway(id) {
      requireAdmin();
      const g = db().gateways.find((x) => x.id === id);
      if (!g?.merchantId) return { ok: false, message: 'شناسه‌ی پذیرنده (مرچنت) وارد نشده است.' };
      return delay({ ok: true, message: `حالت نمایشی: درخواست آزمایشی به ${g.name}${g.sandbox ? ' (سندباکس)' : ''} شبیه‌سازی شد. برای تست واقعی سرور را راه‌اندازی کنید.` }, 600);
    },
    async sms() {
      requireAdmin();
      return clone(db().sms);
    },
    async saveSms(s) {
      requireAdmin();
      db().sms = s;
      log('تنظیم سامانه‌ی پیامک', SMS_PROVIDER_NAMES[s.active]);
      save();
      return clone(s);
    },
    async testSms(to) {
      requireAdmin();
      const phone = normalizePhone(to);
      if (!phone) throw new BackendError('bad_phone', 'شماره موبایل درست نیست.', 'phone');
      const entry = sendSms(phone, `پیامک آزمایشی ${db().settings.siteName}`, 'test');
      save();
      return delay(clone(entry), 500);
    },
    async bulkSms({ text, audience }) {
      requireAdmin();
      const d = db();
      const today = localDayKey();
      const users = d.users.filter((u) => {
        if (u.status === 'banned') return false;
        if (audience === 'all') return true;
        if (audience === 'active') return u.planId !== 'free' && u.planEndsAt >= today;
        if (audience === 'expired') return u.planId !== 'free' && u.planEndsAt < today;
        return u.planId === audience.slice(5);
      });
      for (const u of users) sendSms(u.phone, text, 'bulk');
      log('ارسال پیامک گروهی', `${users.length.toLocaleString('fa-IR')} کاربر`);
      save();
      return delay({ sent: users.length, failed: 0 }, 700);
    },
    async smsLogs() {
      requireAdmin();
      return clone(db().smsLogs);
    },
    async tickets() {
      requireAdmin();
      return clone(db().tickets.sort((a, b) => b.updatedAt - a.updatedAt));
    },
    async replyTicket(id, text) {
      requireAdmin();
      const t = db().tickets.find((x) => x.id === id);
      if (!t) throw new BackendError('not_found', 'تیکت پیدا نشد.');
      t.messages.push({ from: 'admin', text, at: Date.now() });
      t.status = 'answered';
      t.updatedAt = Date.now();
      log('پاسخ به تیکت', t.subject);
      save();
      return clone(t);
    },
    async setTicketStatus(id, status) {
      requireAdmin();
      const t = db().tickets.find((x) => x.id === id);
      if (!t) throw new BackendError('not_found', 'تیکت پیدا نشد.');
      t.status = status;
      t.updatedAt = Date.now();
      save();
      return clone(t);
    },
    async settings() {
      requireAdmin();
      return clone(db().settings);
    },
    async saveSettings(s) {
      requireAdmin();
      db().settings = s;
      log('تغییر تنظیمات سایت');
      save();
      return clone(s);
    },
    async audit() {
      requireAdmin();
      return clone(db().audit);
    },
    async newsStatus() {
      requireAdmin();
      return sampleNewsStatus(db().newsSyncedAt);
    },
    async syncNews() {
      requireAdmin();
      db().newsSyncedAt = Date.now();
      log('همگام‌سازی تقویم اقتصادی', 'نمونه');
      save();
      return delay(sampleNewsStatus(db().newsSyncedAt), 800);
    },
    async marketStorage() {
      requireAdmin();
      // the demo has no server and no stored history: its prices are generated
      return {
        symbols: SYMBOLS.map((s) => ({ id: s.id, source: 'synthetic' as const, start: dataStartOf(s.id), days: 0, expected: 0, bytes: 0, secondDays: 0 })),
        bytes: 0,
        job: null,
        lastJob: null,
        autoDownload: db().settings.marketAutoDownload,
      };
    },
    async startMarketDownload() {
      requireAdmin();
      throw new BackendError('unsupported', 'نسخه‌ی نمایشی سرور ندارد؛ دانلود داده‌ی بازار روی سرور API انجام می‌شود.');
    },
    async stopMarketDownload() {
      requireAdmin();
      return null;
    },
    async credentials() {
      requireAdmin();
      return { username: null, loginPath: '', keyFromEnv: false };
    },
    async saveCredentials() {
      requireAdmin();
      throw new BackendError('unsupported', 'ورود با نام کاربری و رمز فقط روی سرور API فعال است.');
    },
    async removeCredentials() {
      requireAdmin();
    },
  },
};

/** The demo has no server, so it reports the built-in calendar from 2019 to next week. */
function sampleNewsStatus(lastSyncAt?: number): NewsSyncStatus {
  const from = Date.UTC(2019, 0, 1);
  const to = Date.now() + 7 * 86_400_000;
  return {
    source: 'sample',
    lastSyncAt,
    events: sampleNews(from, to).length,
    weeks: Math.round((to - from) / (7 * 86_400_000)),
    lastError: 'در حالت نمایشی سروری برای دریافت از ForexFactory نیست؛ تقویم نمونه (بر اساس زمان‌بندی واقعی انتشار خبرها) استفاده می‌شود.',
  };
}

/** Days left on a user's plan (0 when expired). */
export const planDaysLeftOf = (u: Pick<AccountUser, 'planEndsAt'>) => Math.max(0, diffDays(localDayKey(), u.planEndsAt));
