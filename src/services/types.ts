/**
 * Types shared by the web app and the API server (server/ imports them with `import type`).
 * Amounts are in Iranian toman unless the name says otherwise.
 */

export type Role = 'user' | 'admin';
export type UserStatus = 'active' | 'banned';

export interface AccountUser {
  id: string;
  /** 09xxxxxxxxx */
  phone: string;
  name: string;
  role: Role;
  status: UserStatus;
  planId: string;
  /** Gregorian day keys of the current subscription period. */
  planStartedAt: string;
  planEndsAt: string;
  createdAt: number;
  lastLoginAt?: number;
  /** The address the account was last seen from (admin panel only). */
  lastIp?: string;
  /** The sample account of the hosted demo. */
  demo?: boolean;
  note?: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  priceToman: number;
  durationDays: number;
  features: string[];
  active: boolean;
  /** Shown on the plan card, e.g. "محبوب". */
  badge?: string;
  sort: number;
}

export type GatewayId = 'zarinpal' | 'zibal' | 'idpay' | 'nextpay' | 'payir';
/** A bank gateway, or 'card': a card-to-card transfer that an admin confirms. */
export type PaymentMethod = GatewayId | 'card';
/** review: a card-to-card transfer the payer reported as sent, waiting for an admin. */
export type PaymentStatus = 'pending' | 'review' | 'paid' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  userId: string;
  userName: string;
  phone: string;
  planId: string;
  planName: string;
  amountToman: number;
  discountCode?: string;
  gateway: PaymentMethod;
  status: PaymentStatus;
  /** Gateway's id for the payment request (authority / trackId). */
  authority?: string;
  /** Bank reference number after a successful payment. */
  refId?: string;
  cardPan?: string;
  createdAt: number;
  paidAt?: number;
  /** card-to-card payments only */
  transfer?: CardTransfer;
}

/**
 * A card-to-card payment: the payer sends exactly `amountRial` to the card. The last three digits
 * of the amount (`code`) belong to this payment alone while it is open, so a deposit in the bank
 * account can be matched to it by its amount.
 */
export interface CardTransfer {
  cardId: string;
  cardNumber: string;
  holder: string;
  bank: string;
  /** 1–999: the last three digits of amountRial */
  code: number;
  amountRial: number;
  /** transfer before this time; a reported transfer waits for an admin without a time limit */
  expiresAt: number;
  /** the admin's note for payers (card-to-card settings) when the payment was made */
  instructions?: string;
  /** what the payer reported: the last 4 digits of their card and the bank's tracking number */
  payerCard?: string;
  payerRef?: string;
  sentAt?: number;
  /** why it was closed unpaid */
  closed?: 'expired' | 'cancelled' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: number;
  /** the reason given when an admin rejects it, shown to the payer */
  note?: string;
}

/** A bank card that receives card-to-card payments (admin panel → کارت به کارت). */
export interface PaymentCard {
  id: string;
  /** 16 digits */
  number: string;
  /** the name on the card, shown to the payer (their bank shows the same name before sending) */
  holder: string;
  bank: string;
  active: boolean;
  createdAt: number;
  /** cards take turns: each payment gets the active card used longest ago */
  lastUsedAt?: number;
}

export interface CardToCardSettings {
  enabled: boolean;
  /** minutes the payer has to make the transfer */
  payMinutes: number;
  /** extra text under the card on the payment page */
  note: string;
}

export interface CardAdmin {
  settings: CardToCardSettings;
  cards: (PaymentCard & { open: number; paidCount: number; paidToman: number })[];
}

export interface DiscountCode {
  id: string;
  code: string;
  percent: number;
  maxUses: number;
  used: number;
  /** Gregorian day key, inclusive. */
  expiresAt?: string;
  active: boolean;
  /** Only for customers who have never completed a purchase (no paid or refunded payment). */
  firstPurchaseOnly?: boolean;
}

export interface GatewayConfig {
  id: GatewayId;
  name: string;
  enabled: boolean;
  sandbox: boolean;
  /** Merchant id / API key issued by the gateway. */
  merchantId: string;
  priority: number;
}

export type SmsProviderId = 'kavenegar' | 'smsir' | 'melipayamak' | 'ghasedak' | 'farazsms';

export interface SmsProviderConfig {
  id: SmsProviderId;
  name: string;
  apiKey: string;
  /** Sender line number. */
  sender: string;
  /** Template / pattern name for verification codes (Kavenegar verify lookup, SMS.ir template id, …). */
  otpTemplate: string;
  username?: string;
  password?: string;
}

export interface SmsSettings {
  active: SmsProviderId;
  /** When off (development) codes are only logged, never sent. */
  enabled: boolean;
  providers: SmsProviderConfig[];
}

export interface SmsLog {
  id: string;
  to: string;
  text: string;
  provider: SmsProviderId | 'dev';
  kind: 'otp' | 'bulk' | 'test';
  status: 'sent' | 'failed';
  error?: string;
  createdAt: number;
}

export interface TicketMessage {
  from: 'user' | 'admin';
  text: string;
  at: number;
}

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  status: 'open' | 'answered' | 'closed';
  priority: 'low' | 'normal' | 'high';
  messages: TicketMessage[];
  createdAt: number;
  updatedAt: number;
}

export type DataSource = 'synthetic' | 'dukascopy' | 'binance' | 'qveris';

/** QVeris (paid, per call): EODHD's 1-minute history for forex, metals and crypto, and live quotes. */
export interface QverisSettings {
  /** Most credits QVeris may spend in one UTC day (downloads and live quotes together). */
  dailyCredits: number;
  /** Live prices in the sign-in page's ticker strip (crypto from Binance, free; others via QVeris). */
  live: boolean;
  /** Minutes a live price is reused before it is asked again. */
  liveMinutes: number;
}

export interface SiteSettings {
  siteName: string;
  registrationOpen: boolean;
  maintenance: boolean;
  trialDays: number;
  trialPlanId: string;
  supportPhone: string;
  otpLength: number;
  otpTtlSec: number;
  marketData: { forex: DataSource; index: DataSource; metal: DataSource; energy: DataSource; crypto: DataSource };
  /** Symbols users can pick when creating a session (empty = all). */
  enabledSymbols: string[];
  newsAutoSync: boolean;
  /** The server downloads missing market history by itself (and each new day) into its storage. */
  marketAutoDownload: boolean;
  qveris: QverisSettings;
}

/** Public settings the app reads at start (GET /api/config). */
export interface SiteConfig {
  siteName: string;
  registrationOpen: boolean;
  maintenance: boolean;
  supportPhone: string;
  /** Symbols users can pick when creating a session (empty = all). */
  enabledSymbols: string[];
  /** symbol → where its prices come from; the demo uses synthetic data for every symbol. */
  market: Record<string, DataSource>;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target?: string;
  at: number;
}

export interface AdminStats {
  users: number;
  newUsers30d: number;
  activeSubscriptions: number;
  revenueMonth: number;
  revenueTotal: number;
  openTickets: number;
  smsMonth: number;
  signupsByDay: { day: string; count: number }[];
  revenueByDay: { day: string; amount: number }[];
  byGateway: { gateway: PaymentMethod; amount: number; count: number }[];
  planMix: { planId: string; name: string; count: number }[];
}

export interface NewsSyncStatus {
  source: 'forexfactory' | 'sample';
  lastSyncAt?: number;
  events: number;
  weeks: number;
  /** earliest stored week (its Sunday, YYYY-MM-DD) */
  firstWeek?: string;
  /** ForexFactory answers this server's page requests with a bot check: only the weekly feed is used */
  pagesBlocked?: boolean;
  lastError?: string;
  /** past weeks from Financial Modeling Prep (FMP_API_KEY on the server) */
  history?: { configured: boolean; job: NewsHistoryJob | null; lastJob: NewsHistoryJob | null };
}

/** Filling the calendar's past weeks from Financial Modeling Prep (admin panel). */
export interface NewsHistoryJob {
  from: string;
  state: 'running' | 'done' | 'stopped' | 'failed';
  /** requests (four weeks each) */
  total: number;
  done: number;
  /** weeks stored and events received */
  weeks: number;
  events: number;
  current?: string;
  message?: string;
  startedAt: number;
  finishedAt?: number;
}

/** A download of market history into the server's storage (admin panel, command line, or automatic). */
export interface MarketDownloadJob {
  /** m1: 1-minute bars (all timeframes from 1 minute up); s1: 1-second bars */
  kind: 'm1' | 's1';
  symbols: string[];
  from: string;
  to: string;
  by: 'admin' | 'auto' | 'cli';
  state: 'running' | 'done' | 'stopped' | 'failed';
  /** days to download, and how they went */
  total: number;
  done: number;
  stored: number;
  closed: number;
  failed: number;
  /** recent days the source has not published yet: tried again later */
  later: number;
  current?: string;
  errors: { symbol: string; day: string; error: string }[];
  message?: string;
  startedAt: number;
  finishedAt?: number;
}

export interface MarketStorageSymbol {
  id: string;
  source: DataSource;
  /** first day of history kept for this symbol */
  start: string;
  /** days downloaded (traded or closed) of the days from `start` to yesterday */
  days: number;
  expected: number;
  first?: string;
  last?: string;
  bytes: number;
  /** days of 1-second bars */
  secondDays: number;
}

export interface MarketStorage {
  symbols: MarketStorageSymbol[];
  bytes: number;
  job: MarketDownloadJob | null;
  lastJob: MarketDownloadJob | null;
  autoDownload: boolean;
  /** ready-made history from GitHub; absent in the demo */
  import?: MarketImportStatus;
}

/** Loading ready-made month files from a GitHub repository branch (admin panel). */
export interface MarketImportJob {
  repo: string;
  branch: string;
  state: 'running' | 'done' | 'stopped' | 'failed';
  /** month files on the branch, and how they went */
  total: number;
  done: number;
  added: number;
  replaced: number;
  /** the server already had them (same file, or one covering as many days) */
  kept: number;
  failed: number;
  /** downloaded so far, and the size of every file on the branch */
  bytes: number;
  totalBytes: number;
  current?: string;
  errors: { file: string; error: string }[];
  message?: string;
  startedAt: number;
  finishedAt?: number;
}

export interface MarketImportStatus {
  /** the server's default repository and branch */
  repo: string;
  branch: string;
  /** MARKET_DATA_TOKEN is set (private repositories) */
  tokenSet: boolean;
  job: MarketImportJob | null;
  lastJob: MarketImportJob | null;
}

/** QVeris on this server (admin panel). */
export interface QverisStatus {
  /** QVERIS_API_KEY is set in the server's .env */
  configured: boolean;
  /** credits spent today (UTC) by this server, and its daily limit */
  today: { day: string; credits: number; calls: number };
  dailyCredits: number;
  /** credits a call costs */
  callCredits: number;
  /** the account's balance as QVeris last reported it */
  remaining?: number;
  remainingAt?: number;
  /** symbols QVeris can supply (forex, metals and crypto) */
  symbols: string[];
  error?: string;
}

export interface Page<T> {
  items: T[];
  total: number;
}

export interface UserQuery {
  q?: string;
  planId?: string;
  status?: UserStatus | 'all';
  role?: Role | 'all';
  page?: number;
  pageSize?: number;
}

export interface PaymentQuery {
  q?: string;
  status?: PaymentStatus | 'all';
  gateway?: PaymentMethod | 'all';
  page?: number;
  pageSize?: number;
}

export const GATEWAY_NAMES: Record<GatewayId, string> = {
  zarinpal: 'زرین‌پال',
  zibal: 'زیبال',
  idpay: 'آیدی‌پی',
  nextpay: 'نکست‌پی',
  payir: 'پی‌دات‌آی‌آر',
};

export const PAYMENT_METHOD_NAMES: Record<PaymentMethod, string> = { ...GATEWAY_NAMES, card: 'کارت به کارت' };

export const SMS_PROVIDER_NAMES: Record<SmsProviderId, string> = {
  kavenegar: 'کاوه‌نگار',
  smsir: 'اس‌ام‌اس.آی‌آر',
  melipayamak: 'ملی‌پیامک',
  ghasedak: 'قاصدک',
  farazsms: 'فراز اس‌ام‌اس (IPPanel)',
};

/** Normalise an Iranian mobile number to 09xxxxxxxxx, or null when it is not one. */
export function normalizePhone(raw: string): string | null {
  const latin = raw
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\s\-()]/g, '');
  let p = latin;
  if (p.startsWith('+98')) p = '0' + p.slice(3);
  else if (p.startsWith('0098')) p = '0' + p.slice(4);
  else if (p.startsWith('98') && p.length === 12) p = '0' + p.slice(2);
  else if (p.startsWith('9') && p.length === 10) p = '0' + p;
  return /^09\d{9}$/.test(p) ? p : null;
}

// ---------- users' backtest data (a copy kept on the server for the admin panel) ----------

/** A backtest session as the app saves it on the server (the app's Session without layout and notes). */
export interface SnapshotSession {
  id: string;
  name: string;
  balance: number;
  symbols: string[];
  startDate: string;
  endDate: string;
  strategyId?: string;
  /** Replay position in market time (UTC ms). */
  cursor: number;
  timeframe: string;
  activeSymbol: string;
  createdAt: number;
  lastOpenedAt?: number;
}

/** An order or position (the app's Trade without its journal). */
export interface SnapshotTrade {
  id: string;
  sessionId: string;
  strategyId?: string;
  symbol: string;
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop';
  status: 'pending' | 'open' | 'closed' | 'cancelled';
  entry: number;
  sl: number;
  tp: number;
  lots: number;
  initialLots: number;
  pointValue: number;
  risk: number;
  riskPct: number;
  /** Market times (UTC ms): order placed, position opened, position closed. */
  placedTime: number;
  openTime: number;
  closeTime?: number;
  exit?: number;
  partials: { time: number; price: number; lots: number; pnl?: number }[];
  r?: number;
  pnl?: number;
  maxR?: number;
  closeReason?: 'tp' | 'sl' | 'manual' | 'session_end';
  /** Wall-clock times the trade was placed / closed. */
  executedAt: number;
  closedAt?: number;
}

export interface BacktestSnapshot {
  sessions: SnapshotSession[];
  trades: SnapshotTrade[];
  strategies: { id: string; name: string }[];
}

/** One session in the admin list, worked out when the copy is saved. */
export interface BacktestSessionSummary {
  id: string;
  name: string;
  symbols: string[];
  timeframe: string;
  startDate: string;
  endDate: string;
  balance: number;
  cursor: number;
  /** 0–1: how far the replay has got through the session's dates. */
  progress: number;
  createdAt: number;
  lastOpenedAt?: number;
  strategy?: string;
  /** Closed positions, open positions and waiting orders. */
  closed: number;
  open: number;
  pending: number;
  wins: number;
  losses: number;
  netPnl: number;
}

export interface AdminBacktestRow extends BacktestSessionSummary {
  userId: string;
  userName: string;
  phone: string;
  /** When the user's app last saved its copy, and from which address. */
  syncedAt: number;
  ip?: string;
}

export interface BacktestQuery {
  q?: string;
  userId?: string;
  sort?: 'recent' | 'pnl' | 'trades';
  page?: number;
}

/** Everything the admin sees for one user's backtests. */
export interface AdminBacktestDetail {
  user: Pick<AccountUser, 'id' | 'name' | 'phone' | 'planId' | 'status' | 'lastLoginAt' | 'lastIp'>;
  syncedAt: number;
  ip?: string;
  userAgent?: string;
  snapshot: BacktestSnapshot;
  /** Sessions the admin deleted that the user's app has not removed yet. */
  pendingRemovals: string[];
}

/** Answer to the app's sync check: send the data (the server's copy is out of date), and sessions an admin deleted. */
export interface BacktestSyncState {
  needData: boolean;
  remove: string[];
}

// ---------- sign-in history ----------

export type LoginEventKind = 'login' | 'logout' | 'signed_out_by_admin';

export interface LoginEvent {
  id: string;
  userId: string;
  userName: string;
  phone: string;
  kind: LoginEventKind;
  /** How they signed in: SMS code, admin password or the demo account. */
  method?: 'otp' | 'password' | 'demo';
  at: number;
  ip: string;
  userAgent: string;
}

export interface ActivityQuery {
  q?: string;
  userId?: string;
  kind?: LoginEventKind;
  page?: number;
}

/** A device the user is signed in on. */
export interface UserDevice {
  id: string;
  createdAt: number;
  lastSeenAt: number;
  expiresAt: number;
  ip: string;
  userAgent: string;
}

// ---------- announcements ----------

export interface AnnouncementMedia {
  id: string;
  kind: 'image' | 'video';
  mime: string;
  size: number;
  name: string;
  /** Address of the file (relative to the API server, or a blob: address in the demo). */
  url: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  media?: AnnouncementMedia;
  /** Optional button: an in-app path (/billing) or a full https:// address. */
  button?: { label: string; url: string };
  /** Who sees it: every visitor, or signed-in users only. */
  audience: 'everyone' | 'users';
  /** Where it pops up: the website (home page), the dashboard pages, or both. */
  placement: 'site' | 'app' | 'both';
  /** Gregorian day keys, inclusive; empty for no limit. */
  startsAt?: string;
  endsAt?: string;
  active: boolean;
  /** Raised when the message is edited "to show again": people who closed it see it once more. */
  version: number;
  views: number;
  createdAt: number;
  updatedAt: number;
}

export const MEDIA_TYPES: Record<string, 'image' | 'video'> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
};
/** Largest upload: pictures and videos. */
export const MEDIA_MAX_BYTES = { image: 10 * 1024 * 1024, video: 100 * 1024 * 1024 };
