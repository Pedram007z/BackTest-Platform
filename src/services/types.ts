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
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  userId: string;
  userName: string;
  phone: string;
  planId: string;
  planName: string;
  amountToman: number;
  discountCode?: string;
  gateway: GatewayId;
  status: PaymentStatus;
  /** Gateway's id for the payment request (authority / trackId). */
  authority?: string;
  /** Bank reference number after a successful payment. */
  refId?: string;
  cardPan?: string;
  createdAt: number;
  paidAt?: number;
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

export type DataSource = 'synthetic' | 'dukascopy' | 'binance';

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
  byGateway: { gateway: GatewayId; amount: number; count: number }[];
  planMix: { planId: string; name: string; count: number }[];
}

export interface NewsSyncStatus {
  source: 'forexfactory' | 'sample';
  lastSyncAt?: number;
  events: number;
  weeks: number;
  lastError?: string;
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
  gateway?: GatewayId | 'all';
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
