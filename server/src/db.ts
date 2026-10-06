import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { config } from './config';
import {
  GATEWAY_NAMES,
  SMS_PROVIDER_NAMES,
  type AccountUser,
  type AuditEntry,
  type CardToCardSettings,
  type DiscountCode,
  type GatewayConfig,
  type GatewayId,
  type Payment,
  type PaymentCard,
  type Plan,
  type SiteSettings,
  type SmsLog,
  type SmsProviderId,
  type SmsSettings,
  type Ticket,
} from './shared';
import { uid } from './util';

/**
 * The whole account database as one JSON document, loaded at start and written back (atomically,
 * debounced) after each change. That suits a single server process with up to tens of thousands of
 * users; calendar events and market bars are kept in their own files (see news/ and market/).
 */

export interface OtpRecord {
  /** HMAC of the code; the code itself is never stored. */
  hash: string;
  expiresAt: number;
  sentAt: number;
  tries: number;
}

export interface AuthSessionRecord {
  userId: string;
  createdAt: number;
  expiresAt: number;
  lastSeenAt: number;
  ip?: string;
  userAgent?: string;
}

export interface StoredPayment extends Payment {
  /** Completed on the local payment simulator (PAYMENT_SIMULATOR) rather than at the bank. */
  simulated?: boolean;
  /** Last message from the gateway (errors while verifying). */
  gatewayMessage?: string;
}

export interface Db {
  version: 1;
  /** Secret for code hashes; generated on first start. */
  secret: string;
  users: AccountUser[];
  plans: Plan[];
  payments: StoredPayment[];
  discounts: DiscountCode[];
  gateways: GatewayConfig[];
  /** cards that receive card-to-card payments */
  cards: PaymentCard[];
  cardToCard: CardToCardSettings;
  sms: SmsSettings;
  smsLogs: SmsLog[];
  tickets: Ticket[];
  settings: SiteSettings;
  audit: AuditEntry[];
  otps: Record<string, OtpRecord>;
  /** sha256(token) → session */
  sessions: Record<string, AuthSessionRecord>;
  /** user id → admin username and password hash (never sent to the app) */
  credentials: Record<string, AdminCredential>;
}

export interface AdminCredential {
  username: string;
  hash: string;
  /** the ADMIN_PASSWORD_HASH this came from, so a changed .env value is applied once */
  fromEnv?: string;
  updatedAt: number;
}

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

export const DEFAULT_SETTINGS: SiteSettings = {
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

export const DEFAULT_CARD_TO_CARD: CardToCardSettings = { enabled: false, payMinutes: 30, note: '' };

const GATEWAY_ORDER: GatewayId[] = ['zarinpal', 'zibal', 'idpay', 'nextpay', 'payir'];

function defaultGateways(): GatewayConfig[] {
  return GATEWAY_ORDER.map((id, i) => ({
    id,
    name: GATEWAY_NAMES[id],
    // Zibal's public sandbox merchant is "zibal"; the others need the merchant id from their panel.
    enabled: id === 'zarinpal' || id === 'zibal',
    sandbox: true,
    merchantId: id === 'zibal' ? 'zibal' : id === 'payir' ? 'test' : '',
    priority: i + 1,
  }));
}

function defaultSms(): SmsSettings {
  return {
    active: 'kavenegar',
    enabled: false,
    providers: (Object.keys(SMS_PROVIDER_NAMES) as SmsProviderId[]).map((id) => ({ id, name: SMS_PROVIDER_NAMES[id], apiKey: '', sender: '', otpTemplate: '' })),
  };
}

function fresh(): Db {
  return {
    version: 1,
    secret: uid('s') + uid('k'),
    users: [],
    plans: structuredClone(DEFAULT_PLANS),
    payments: [],
    discounts: [],
    gateways: defaultGateways(),
    cards: [],
    cardToCard: { ...DEFAULT_CARD_TO_CARD },
    sms: defaultSms(),
    smsLogs: [],
    tickets: [],
    settings: structuredClone(DEFAULT_SETTINGS),
    audit: [],
    otps: {},
    sessions: {},
    credentials: {},
  };
}

/** Fill keys added in later versions so older files keep working. */
function upgrade(d: Partial<Db>): Db {
  const base = fresh();
  const out = { ...base, ...d } as Db;
  out.settings = { ...base.settings, ...(d.settings ?? {}), marketData: { ...base.settings.marketData, ...(d.settings?.marketData ?? {}) } };
  // generated prices are no longer offered: markets that used them get their real source
  for (const g of Object.keys(out.settings.marketData) as (keyof typeof out.settings.marketData)[]) {
    if (out.settings.marketData[g] === 'synthetic') out.settings.marketData[g] = base.settings.marketData[g];
  }
  out.cardToCard = { ...base.cardToCard, ...(d.cardToCard ?? {}) };
  out.gateways = GATEWAY_ORDER.map((id) => d.gateways?.find((g) => g.id === id) ?? base.gateways.find((g) => g.id === id)!);
  const sms = d.sms ?? base.sms;
  out.sms = { ...sms, providers: base.sms.providers.map((p) => sms.providers.find((x) => x.id === p.id) ?? p) };
  out.otps = d.otps ?? {};
  out.sessions = d.sessions ?? {};
  return out;
}

const FILE = () => join(config.dataDir, 'db.json');
let state: Db | null = null;
let timer: NodeJS.Timeout | null = null;

/** Read the database (`write: false` leaves the data folder as it is: the download command). */
export function loadDb({ write = true } = {}): Db {
  mkdirSync(config.dataDir, { recursive: true });
  const file = FILE();
  state = existsSync(file) ? upgrade(JSON.parse(readFileSync(file, 'utf8'))) : fresh();
  if (write) flush();
  return state;
}

export function db(): Db {
  if (!state) throw new Error('database not loaded');
  return state;
}

/** Write the database to disk now (temp file + rename, so a crash never leaves half a file). */
export function flush() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (!state) return;
  const file = FILE();
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(state));
  renameSync(tmp, file);
}

/** Schedule a write; many changes in one request are saved together. */
export function save() {
  if (!timer) timer = setTimeout(flush, 250);
}

/** Drop expired sign-in codes and sessions, and cap the logs. */
export function prune() {
  const d = db();
  const now = Date.now();
  for (const [k, o] of Object.entries(d.otps)) if (o.expiresAt < now - 3_600_000) delete d.otps[k];
  for (const [k, s] of Object.entries(d.sessions)) if (s.expiresAt < now) delete d.sessions[k];
  d.smsLogs = d.smsLogs.slice(0, 5000);
  d.audit = d.audit.slice(0, 2000);
  save();
}
