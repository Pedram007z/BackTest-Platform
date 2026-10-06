import type {
  AccountUser,
  AdminStats,
  AuditEntry,
  CardAdmin,
  CardToCardSettings,
  DiscountCode,
  GatewayConfig,
  GatewayId,
  MarketDownloadJob,
  MarketStorage,
  NewsSyncStatus,
  Page,
  Payment,
  PaymentCard,
  PaymentMethod,
  PaymentQuery,
  Plan,
  SiteConfig,
  SiteSettings,
  SmsLog,
  SmsSettings,
  Ticket,
  UserQuery,
} from './types';

/**
 * Everything the app asks of a backend. `httpBackend` talks to the API server in server/;
 * `localBackend` runs the same operations in the browser for the hosted demo (no server):
 * SMS codes are shown on screen and payments go through a simulated bank page.
 */

export interface OtpRequest {
  /** Seconds the code stays valid. */
  ttlSec: number;
  length: number;
  /** Seconds before another code may be requested. */
  resendInSec: number;
  /** No account exists for this number yet (the name is asked after the code). */
  isNew: boolean;
  /** Development / demo only: the code, since no SMS is sent. */
  devCode?: string;
}

export interface AuthResult {
  token: string;
  user: AccountUser;
  isNew: boolean;
}

export interface CheckoutResult {
  paymentId: string;
  amountToman: number;
  /** Bank gateway page, or an in-app route (starting with "#/") in the demo. */
  redirectUrl: string;
}

export interface AdminApi {
  stats(): Promise<AdminStats>;
  users(q: UserQuery): Promise<Page<AccountUser>>;
  updateUser(id: string, patch: Partial<Pick<AccountUser, 'name' | 'role' | 'status' | 'planId' | 'planStartedAt' | 'planEndsAt' | 'note'>>): Promise<AccountUser>;
  deleteUser(id: string): Promise<void>;
  plans(): Promise<Plan[]>;
  savePlan(plan: Plan): Promise<Plan>;
  deletePlan(id: string): Promise<void>;
  payments(q: PaymentQuery): Promise<Page<Payment>>;
  refundPayment(id: string): Promise<Payment>;
  /** Card to card: the money arrived (starts the plan), or it did not (the reason is shown to the payer). */
  confirmPayment(id: string, refId?: string): Promise<Payment>;
  rejectPayment(id: string, reason: string): Promise<Payment>;
  cards(): Promise<CardAdmin>;
  saveCard(card: Pick<PaymentCard, 'id' | 'number' | 'holder' | 'bank' | 'active'>): Promise<PaymentCard>;
  deleteCard(id: string): Promise<void>;
  saveCardSettings(s: CardToCardSettings): Promise<CardToCardSettings>;
  discounts(): Promise<DiscountCode[]>;
  saveDiscount(d: DiscountCode): Promise<DiscountCode>;
  deleteDiscount(id: string): Promise<void>;
  gateways(): Promise<GatewayConfig[]>;
  saveGateway(g: GatewayConfig): Promise<GatewayConfig>;
  testGateway(id: GatewayId): Promise<{ ok: boolean; message: string }>;
  sms(): Promise<SmsSettings>;
  saveSms(s: SmsSettings): Promise<SmsSettings>;
  testSms(to: string): Promise<SmsLog>;
  bulkSms(input: { text: string; audience: 'all' | 'active' | 'expired' | `plan:${string}` }): Promise<{ sent: number; failed: number }>;
  smsLogs(): Promise<SmsLog[]>;
  tickets(): Promise<Ticket[]>;
  replyTicket(id: string, text: string): Promise<Ticket>;
  setTicketStatus(id: string, status: Ticket['status']): Promise<Ticket>;
  settings(): Promise<SiteSettings>;
  saveSettings(s: SiteSettings): Promise<SiteSettings>;
  audit(): Promise<AuditEntry[]>;
  newsStatus(): Promise<NewsSyncStatus>;
  syncNews(): Promise<NewsSyncStatus>;
  /** Market history stored on the server, and its downloads. */
  marketStorage(): Promise<MarketStorage>;
  startMarketDownload(input: { kind?: 'm1' | 's1'; symbols?: string[]; from?: string; to?: string }): Promise<MarketDownloadJob>;
  stopMarketDownload(): Promise<MarketDownloadJob | null>;
  /** The signed-in admin's username for signing in with a password (null when not set). */
  credentials(): Promise<{ username: string | null; loginPath: string; keyFromEnv: boolean }>;
  saveCredentials(input: { username: string; password: string; currentPassword?: string }): Promise<{ username: string }>;
  removeCredentials(): Promise<void>;
}

export interface Backend {
  mode: 'demo' | 'server';
  /** Public site settings (no sign-in needed). */
  siteConfig(): Promise<SiteConfig>;
  requestOtp(phone: string): Promise<OtpRequest>;
  verifyOtp(phone: string, code: string, name?: string): Promise<AuthResult>;
  /** The sample account (demo mode only). */
  demoLogin(): Promise<AuthResult>;
  /** Admins: sign in with a username and password. */
  adminLogin(username: string, password: string, key: string): Promise<AuthResult>;
  /** Whether `key` opens the admin sign-in page (its secret address /#/k/<key>). */
  adminGate(key: string): Promise<boolean>;
  me(): Promise<AccountUser>;
  updateMe(patch: { name?: string }): Promise<AccountUser>;
  logout(): Promise<void>;
  plans(): Promise<Plan[]>;
  gateways(): Promise<{ id: PaymentMethod; name: string }[]>;
  checkDiscount(code: string, planId: string): Promise<{ percent: number; finalToman: number }>;
  checkout(input: { planId: string; gateway: PaymentMethod; discountCode?: string }): Promise<CheckoutResult>;
  payment(id: string): Promise<Payment>;
  /** Card to card: the payer has sent the money (both details optional), or gives up before sending. */
  reportTransfer(id: string, input: { payerCard?: string; payerRef?: string }): Promise<Payment>;
  cancelTransfer(id: string): Promise<Payment>;
  myPayments(): Promise<Payment[]>;
  myTickets(): Promise<Ticket[]>;
  createTicket(subject: string, text: string): Promise<Ticket>;
  replyMyTicket(id: string, text: string): Promise<Ticket>;
  admin: AdminApi;
}

export class BackendError extends Error {
  constructor(
    public code: string,
    message: string,
    public field?: string,
  ) {
    super(message);
  }
}
