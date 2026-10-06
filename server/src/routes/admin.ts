import { dropSessions, requireAdmin } from '../auth';
import { db, save } from '../db';
import { HttpError, badRequest, bool, notFound, num, oneOf, str, type Ctx, type Router } from '../http';
import { INSTRUMENTS } from '../market/instruments';
import { newsStatus, syncNews } from '../news';
import { GATEWAY_IDS, publicPayment, testGateway } from '../payments';
import {
  SMS_PROVIDER_NAMES,
  normalizePhone,
  type AccountUser,
  type AdminStats,
  type DataSource,
  type DiscountCode,
  type GatewayConfig,
  type PaymentStatus,
  type Plan,
  type SiteSettings,
  type SmsProviderId,
  type SmsSettings,
  type Ticket,
} from '../shared';
import { sendTextSms } from '../sms';
import { DAY_MS, addDays, clone, faDay, faNum, isDayKey, tehranDayKey, toLatinDigits, todayKey, uid } from '../util';

function audit(ctx: Ctx, action: string, target?: string) {
  const d = db();
  d.audit.unshift({ id: uid('au'), actor: ctx.user?.name ?? 'سیستم', action, target, at: Date.now() });
  if (d.audit.length > 2000) d.audit.length = 2000;
  save();
}

function page<T>(items: T[], q: URLSearchParams) {
  const p = Math.max(1, Number(q.get('page')) || 1);
  const size = Math.min(100, Math.max(1, Number(q.get('pageSize')) || 20));
  return { items: items.slice((p - 1) * size, p * size), total: items.length };
}

/** Real sources only: the replay never shows generated prices when it has a server. */
const SOURCES: DataSource[] = ['dukascopy', 'binance'];
const SMS_IDS = Object.keys(SMS_PROVIDER_NAMES) as SmsProviderId[];

function stats(): AdminStats {
  const d = db();
  const now = Date.now();
  const today = todayKey();
  const paid = d.payments.filter((p) => p.status === 'paid');
  const monthStart = now - 30 * DAY_MS;
  const days = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29));
  const index = new Map(days.map((k, i) => [k, i]));
  const signups = new Array(30).fill(0);
  const revenue = new Array(30).fill(0);
  for (const u of d.users) {
    const i = index.get(tehranDayKey(u.createdAt));
    if (i !== undefined) signups[i]++;
  }
  for (const p of paid) {
    const i = index.get(tehranDayKey(p.paidAt ?? p.createdAt));
    if (i !== undefined) revenue[i] += p.amountToman;
  }
  const gateways = [...new Set(d.payments.map((p) => p.gateway))];
  return {
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
}

function findUser(id: string): AccountUser {
  const u = db().users.find((x) => x.id === id);
  if (!u) throw notFound('کاربر پیدا نشد.');
  return u;
}

function findTicket(id: string): Ticket {
  const t = db().tickets.find((x) => x.id === id);
  if (!t) throw notFound('تیکت پیدا نشد.');
  return t;
}

function validPlan(b: any, id: string): Plan {
  if (!/^[a-z0-9][a-z0-9-]{1,31}$/.test(id)) throw badRequest('invalid', 'شناسه‌ی پلن فقط حروف کوچک انگلیسی، عدد و خط تیره است.', 'id');
  const features = Array.isArray(b.features)
    ? b.features
        .map((f: unknown) => String(f).trim())
        .filter(Boolean)
        .slice(0, 20)
    : [];
  return {
    id,
    name: str(b.name, 'name', { min: 2, max: 60, label: 'نام پلن' }),
    description: str(b.description, 'description', { max: 200, label: 'توضیح' }),
    priceToman: num(b.priceToman, 'priceToman', { min: 0, max: 1e10, int: true, label: 'قیمت' }),
    durationDays: num(b.durationDays, 'durationDays', { min: 1, max: 3650, int: true, label: 'مدت' }),
    features,
    active: bool(b.active),
    badge: typeof b.badge === 'string' && b.badge.trim() ? b.badge.trim().slice(0, 30) : undefined,
    sort: num(b.sort ?? 0, 'sort', { min: -1000, max: 1000, label: 'ترتیب' }),
  };
}

function validSettings(b: any): SiteSettings {
  const d = db();
  const md = b.marketData ?? {};
  const enabled = Array.isArray(b.enabledSymbols) ? b.enabledSymbols.filter((s: unknown) => typeof s === 'string' && INSTRUMENTS[s]) : [];
  const trialPlanId = String(b.trialPlanId ?? '');
  if (!d.plans.some((p) => p.id === trialPlanId)) throw badRequest('invalid', 'پلن دوره‌ی آزمایشی پیدا نشد.', 'trialPlanId');
  return {
    siteName: str(b.siteName, 'siteName', { min: 2, max: 60, label: 'نام سایت' }),
    registrationOpen: bool(b.registrationOpen),
    maintenance: bool(b.maintenance),
    trialDays: num(b.trialDays, 'trialDays', { min: 0, max: 90, int: true, label: 'روزهای آزمایشی' }),
    trialPlanId,
    supportPhone: str(b.supportPhone, 'supportPhone', { max: 30, label: 'تلفن پشتیبانی' }),
    otpLength: num(b.otpLength, 'otpLength', { min: 4, max: 8, int: true, label: 'طول کد' }),
    otpTtlSec: num(b.otpTtlSec, 'otpTtlSec', { min: 30, max: 900, int: true, label: 'اعتبار کد' }),
    marketData: {
      forex: oneOf(md.forex, SOURCES, 'marketData.forex'),
      index: oneOf(md.index, SOURCES, 'marketData.index'),
      metal: oneOf(md.metal, SOURCES, 'marketData.metal'),
      energy: oneOf(md.energy, SOURCES, 'marketData.energy'),
      crypto: oneOf(md.crypto, SOURCES, 'marketData.crypto'),
    },
    enabledSymbols: enabled.length === Object.keys(INSTRUMENTS).length ? [] : enabled,
    newsAutoSync: bool(b.newsAutoSync),
  };
}

export function adminRoutes(r: Router) {
  const admin = (fn: (ctx: Ctx) => unknown) => (ctx: Ctx) => {
    requireAdmin(ctx);
    return fn(ctx);
  };

  r.get(
    '/api/admin/stats',
    admin(() => stats()),
  );

  // ---------- users ----------
  r.get(
    '/api/admin/users',
    admin(({ query }) => {
      const text = (query.get('q') ?? '').trim().toLowerCase();
      const digits = text ? (normalizePhone(text) ?? toLatinDigits(text).replace(/\D/g, '')) : '';
      const plan = query.get('planId');
      const status = query.get('status');
      const role = query.get('role');
      const list = db()
        .users.filter((u) => !text || u.name.toLowerCase().includes(text) || (digits.length > 0 && u.phone.includes(digits)))
        .filter((u) => !plan || plan === 'all' || u.planId === plan)
        .filter((u) => !status || status === 'all' || u.status === status)
        .filter((u) => !role || role === 'all' || u.role === role)
        .sort((a, b) => b.createdAt - a.createdAt);
      return clone(page(list, query));
    }),
  );

  r.put(
    '/api/admin/users/:id',
    admin((ctx) => {
      const u = findUser(ctx.params.id);
      const b = ctx.body;
      const me = ctx.user!;
      const before = { ...u };
      if (b.name !== undefined) u.name = str(b.name, 'name', { min: 2, max: 60, label: 'نام' });
      if (b.role !== undefined) {
        const role = oneOf(b.role, ['user', 'admin'] as const, 'role');
        if (u.id === me.id && role !== 'admin') throw badRequest('self', 'نمی‌توانید دسترسی مدیر را از خودتان بگیرید.');
        u.role = role;
      }
      if (b.status !== undefined) {
        const status = oneOf(b.status, ['active', 'banned'] as const, 'status');
        if (u.id === me.id && status === 'banned') throw badRequest('self', 'نمی‌توانید حساب خودتان را مسدود کنید.');
        u.status = status;
      }
      if (b.planId !== undefined) {
        if (!db().plans.some((p) => p.id === b.planId)) throw badRequest('invalid', 'پلن پیدا نشد.', 'planId');
        u.planId = b.planId;
      }
      if (b.planStartedAt !== undefined) {
        if (!isDayKey(b.planStartedAt)) throw badRequest('invalid', 'تاریخ شروع معتبر نیست.', 'planStartedAt');
        u.planStartedAt = b.planStartedAt;
      }
      if (b.planEndsAt !== undefined) {
        if (!isDayKey(b.planEndsAt)) throw badRequest('invalid', 'تاریخ پایان معتبر نیست.', 'planEndsAt');
        u.planEndsAt = b.planEndsAt;
      }
      if (b.note !== undefined) u.note = str(b.note, 'note', { max: 500, label: 'یادداشت' }) || undefined;

      if (u.status !== before.status) {
        if (u.status === 'banned') dropSessions(u.id);
        audit(ctx, u.status === 'banned' ? 'مسدود کردن کاربر' : 'رفع مسدودی کاربر', u.name);
      } else if (u.planEndsAt !== before.planEndsAt || u.planId !== before.planId) audit(ctx, 'تغییر اشتراک', `${u.name}: تا ${faDay(u.planEndsAt)}`);
      else if (u.role !== before.role) audit(ctx, u.role === 'admin' ? 'دادن دسترسی مدیر' : 'گرفتن دسترسی مدیر', u.name);
      else audit(ctx, 'ویرایش کاربر', u.name);
      save();
      return clone(u);
    }),
  );

  r.delete(
    '/api/admin/users/:id',
    admin((ctx) => {
      if (ctx.params.id === ctx.user!.id) throw badRequest('self', 'نمی‌توانید حساب خودتان را حذف کنید.');
      const u = findUser(ctx.params.id);
      const d = db();
      d.users = d.users.filter((x) => x.id !== u.id);
      dropSessions(u.id);
      audit(ctx, 'حذف کاربر', u.name);
      save();
    }),
  );

  // ---------- plans ----------
  r.get(
    '/api/admin/plans',
    admin(() => clone([...db().plans].sort((a, b) => a.sort - b.sort))),
  );
  r.put(
    '/api/admin/plans/:id',
    admin((ctx) => {
      const plan = validPlan(ctx.body, ctx.params.id);
      const d = db();
      const i = d.plans.findIndex((p) => p.id === plan.id);
      if (i >= 0) d.plans[i] = plan;
      else d.plans.push(plan);
      audit(ctx, i >= 0 ? 'ویرایش پلن' : 'ساخت پلن', plan.name);
      save();
      return clone(plan);
    }),
  );
  r.delete(
    '/api/admin/plans/:id',
    admin((ctx) => {
      const d = db();
      const id = ctx.params.id;
      if (d.users.some((u) => u.planId === id)) throw badRequest('in_use', 'کاربرانی روی این پلن هستند؛ به‌جای حذف آن را غیرفعال کنید.');
      if (d.settings.trialPlanId === id) throw badRequest('in_use', 'این پلن برای دوره‌ی آزمایشی انتخاب شده است.');
      const p = d.plans.find((x) => x.id === id);
      if (!p) throw notFound('پلن پیدا نشد.');
      d.plans = d.plans.filter((x) => x.id !== id);
      audit(ctx, 'حذف پلن', p.name);
      save();
    }),
  );

  // ---------- payments ----------
  r.get(
    '/api/admin/payments',
    admin(({ query }) => {
      const text = (query.get('q') ?? '').trim();
      const status = query.get('status');
      const gateway = query.get('gateway');
      const list = db()
        .payments.filter(
          (p) => !text || p.userName.includes(text) || p.phone.includes(text) || (p.refId ?? '').includes(text) || (p.authority ?? '').includes(text) || p.id === text,
        )
        .filter((p) => !status || status === 'all' || p.status === status)
        .filter((p) => !gateway || gateway === 'all' || p.gateway === gateway);
      return clone(page(list, query));
    }),
  );
  r.post(
    '/api/admin/payments/:id/refund',
    admin((ctx) => {
      const p = db().payments.find((x) => x.id === ctx.params.id);
      if (!p || p.status !== 'paid') throw badRequest('bad_state', 'فقط تراکنش‌های موفق قابل استرداد هستند.');
      p.status = 'refunded' satisfies PaymentStatus;
      audit(ctx, 'استرداد وجه', `${p.userName} — ${faNum(p.amountToman)} تومان`);
      save();
      return publicPayment(p);
    }),
  );

  // ---------- discount codes ----------
  r.get(
    '/api/admin/discounts',
    admin(() => clone(db().discounts)),
  );
  r.put(
    '/api/admin/discounts/:id',
    admin((ctx) => {
      const b = ctx.body;
      const d = db();
      const code = String(b.code ?? '')
        .trim()
        .toUpperCase();
      if (!/^[A-Z0-9_-]{3,24}$/.test(code)) throw badRequest('bad_code', 'کد باید ۳ تا ۲۴ حرف انگلیسی یا عدد باشد.', 'code');
      if (d.discounts.some((x) => x.code === code && x.id !== ctx.params.id)) throw badRequest('exists', 'این کد قبلاً ساخته شده است.', 'code');
      if (b.expiresAt && !isDayKey(b.expiresAt)) throw badRequest('invalid', 'تاریخ انقضا معتبر نیست.', 'expiresAt');
      const next: DiscountCode = {
        id: ctx.params.id,
        code,
        percent: num(b.percent, 'percent', { min: 1, max: 100, int: true, label: 'درصد تخفیف' }),
        maxUses: num(b.maxUses, 'maxUses', { min: 1, max: 1e7, int: true, label: 'سقف استفاده' }),
        used: num(b.used ?? 0, 'used', { min: 0, int: true, label: 'تعداد استفاده' }),
        expiresAt: b.expiresAt || undefined,
        active: bool(b.active),
      };
      const i = d.discounts.findIndex((x) => x.id === next.id);
      if (i >= 0) d.discounts[i] = next;
      else d.discounts.unshift(next);
      audit(ctx, i >= 0 ? 'ویرایش کد تخفیف' : 'ساخت کد تخفیف', code);
      save();
      return clone(next);
    }),
  );
  r.delete(
    '/api/admin/discounts/:id',
    admin((ctx) => {
      const d = db();
      const dc = d.discounts.find((x) => x.id === ctx.params.id);
      d.discounts = d.discounts.filter((x) => x.id !== ctx.params.id);
      audit(ctx, 'حذف کد تخفیف', dc?.code);
      save();
    }),
  );

  // ---------- gateways ----------
  r.get(
    '/api/admin/gateways',
    admin(() => clone([...db().gateways].sort((a, b) => a.priority - b.priority))),
  );
  r.put(
    '/api/admin/gateways/:id',
    admin((ctx) => {
      const id = oneOf(ctx.params.id, GATEWAY_IDS, 'id');
      const d = db();
      const g = d.gateways.find((x) => x.id === id)!;
      const b = ctx.body;
      const next: GatewayConfig = {
        id,
        name: g.name,
        enabled: bool(b.enabled),
        sandbox: bool(b.sandbox),
        merchantId: str(b.merchantId, 'merchantId', { max: 120, label: 'شناسه‌ی پذیرنده' }),
        priority: num(b.priority ?? g.priority, 'priority', { min: 0, max: 100, int: true, label: 'اولویت' }),
      };
      d.gateways = d.gateways.map((x) => (x.id === id ? next : x));
      audit(ctx, 'تنظیم درگاه پرداخت', `${next.name}${next.enabled ? '' : ' (غیرفعال)'}`);
      save();
      return clone(next);
    }),
  );
  r.post(
    '/api/admin/gateways/:id/test',
    admin((ctx) => testGateway(oneOf(ctx.params.id, GATEWAY_IDS, 'id'))),
  );

  // ---------- SMS ----------
  r.get(
    '/api/admin/sms',
    admin(() => clone(db().sms)),
  );
  r.put(
    '/api/admin/sms',
    admin((ctx) => {
      const b = ctx.body;
      const providers = Array.isArray(b.providers) ? b.providers : [];
      const next: SmsSettings = {
        active: oneOf(b.active, SMS_IDS, 'active'),
        enabled: bool(b.enabled),
        providers: SMS_IDS.map((id) => {
          const p = providers.find((x: any) => x?.id === id) ?? {};
          return {
            id,
            name: SMS_PROVIDER_NAMES[id],
            apiKey: str(p.apiKey, 'apiKey', { max: 200 }),
            sender: str(p.sender, 'sender', { max: 30 }),
            otpTemplate: str(p.otpTemplate, 'otpTemplate', { max: 80 }),
            username: p.username ? str(p.username, 'username', { max: 80 }) : undefined,
            password: p.password ? str(p.password, 'password', { max: 120 }) : undefined,
          };
        }),
      };
      db().sms = next;
      audit(ctx, 'تنظیم سامانه‌ی پیامک', SMS_PROVIDER_NAMES[next.active]);
      save();
      return clone(next);
    }),
  );
  r.post(
    '/api/admin/sms/test',
    admin(async (ctx) => {
      const phone = normalizePhone(String(ctx.body.to ?? ''));
      if (!phone) throw badRequest('bad_phone', 'شماره موبایل درست نیست.', 'phone');
      const { logs } = await sendTextSms([phone], `پیامک آزمایشی ${db().settings.siteName}`, 'test');
      const log = logs[0];
      if (log.status === 'failed') throw new HttpError(502, 'sms_failed', `ارسال ناموفق بود: ${log.error}`);
      return clone(log);
    }),
  );
  r.post(
    '/api/admin/sms/bulk',
    admin(async (ctx) => {
      const text = str(ctx.body.text, 'text', { min: 1, max: 700, label: 'متن پیامک' });
      const audience = String(ctx.body.audience ?? '');
      if (!['all', 'active', 'expired'].includes(audience) && !audience.startsWith('plan:')) throw badRequest('invalid', 'گیرندگان معتبر نیستند.', 'audience');
      const today = todayKey();
      const phones = db()
        .users.filter((u) => {
          if (u.status === 'banned') return false;
          if (audience === 'all') return true;
          if (audience === 'active') return u.planId !== 'free' && u.planEndsAt >= today;
          if (audience === 'expired') return u.planId !== 'free' && u.planEndsAt < today;
          return u.planId === audience.slice(5);
        })
        .map((u) => u.phone);
      const r = await sendTextSms(phones, text, 'bulk');
      audit(ctx, 'ارسال پیامک گروهی', `${faNum(phones.length)} کاربر`);
      return { sent: r.sent, failed: r.failed };
    }),
  );
  r.get(
    '/api/admin/sms/logs',
    admin(() => clone(db().smsLogs.slice(0, 500))),
  );

  // ---------- tickets ----------
  r.get(
    '/api/admin/tickets',
    admin(() => clone([...db().tickets].sort((a, b) => b.updatedAt - a.updatedAt))),
  );
  r.post(
    '/api/admin/tickets/:id/reply',
    admin((ctx) => {
      const t = findTicket(ctx.params.id);
      t.messages.push({ from: 'admin', text: str(ctx.body.text, 'text', { min: 1, max: 4000, label: 'پاسخ' }), at: Date.now() });
      t.status = 'answered';
      t.updatedAt = Date.now();
      audit(ctx, 'پاسخ به تیکت', t.subject);
      save();
      return clone(t);
    }),
  );
  r.put(
    '/api/admin/tickets/:id',
    admin((ctx) => {
      const t = findTicket(ctx.params.id);
      t.status = oneOf(ctx.body.status, ['open', 'answered', 'closed'] as const, 'status');
      t.updatedAt = Date.now();
      save();
      return clone(t);
    }),
  );

  // ---------- site settings, audit, news ----------
  r.get(
    '/api/admin/settings',
    admin(() => clone(db().settings)),
  );
  r.put(
    '/api/admin/settings',
    admin((ctx) => {
      db().settings = validSettings(ctx.body);
      audit(ctx, 'تغییر تنظیمات سایت');
      save();
      return clone(db().settings);
    }),
  );
  r.get(
    '/api/admin/audit',
    admin(() => clone(db().audit.slice(0, 500))),
  );
  r.get(
    '/api/admin/news',
    admin(() => newsStatus()),
  );
  r.post(
    '/api/admin/news/sync',
    admin(async (ctx) => {
      const status = await syncNews();
      audit(ctx, 'همگام‌سازی تقویم اقتصادی', 'ForexFactory');
      return status;
    }),
  );
}
