import { config } from '../config';
import { db, save, type StoredPayment } from '../db';
import { HttpError, Reply, badRequest, notFound, oneOf, str } from '../http';
import type { AccountUser, DiscountCode, GatewayId, PaymentMethod, Plan } from '../shared';
import { GATEWAY_NAMES, PAYMENT_METHOD_NAMES } from '../shared';
import { UpstreamError, addDays, clone, faNum, todayKey, uid } from '../util';
import { cardPaymentsOpen, expireTransfers, startCardPayment } from './card';
import { GATEWAYS, GatewayError, toRial } from './gateways';

export const GATEWAY_IDS = Object.keys(GATEWAY_NAMES) as GatewayId[];
export const METHOD_IDS = Object.keys(PAYMENT_METHOD_NAMES) as PaymentMethod[];

/** The public view of a payment (internal fields removed). */
export function publicPayment(p: StoredPayment) {
  const { simulated: _s, gatewayMessage: _m, ...rest } = p;
  return clone(rest);
}

/** Whether the user has completed a purchase before (a refunded one counts too). */
export function hasPurchased(userId: string): boolean {
  return db().payments.some((p) => p.userId === userId && (p.status === 'paid' || p.status === 'refunded'));
}

/** The price after a discount code. `user` is checked against first-purchase-only codes (at checkout it always is). */
export function discountFor(code: string | undefined, plan: Plan, user?: AccountUser): { percent: number; finalToman: number; dc?: DiscountCode } {
  if (!code?.trim()) return { percent: 0, finalToman: plan.priceToman };
  const dc = db().discounts.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!dc || !dc.active) throw badRequest('bad_code', 'این کد تخفیف معتبر نیست.', 'discount');
  if (dc.expiresAt && dc.expiresAt < todayKey()) throw badRequest('expired', 'مهلت این کد تخفیف تمام شده است.', 'discount');
  if (dc.used >= dc.maxUses) throw badRequest('used_up', 'ظرفیت این کد تخفیف پر شده است.', 'discount');
  if (dc.firstPurchaseOnly && user && hasPurchased(user.id)) throw badRequest('first_purchase', 'این کد تخفیف فقط برای اولین خرید است.', 'discount');
  return { percent: dc.percent, finalToman: Math.round((plan.priceToman * (100 - dc.percent)) / 100), dc };
}

/** Add a plan's days: on top of the current period while it runs, from today once it has ended. */
export function extendPlan(user: AccountUser, plan: Plan) {
  const today = todayKey();
  const running = user.planId !== 'free' && user.planEndsAt >= today;
  const from = running ? user.planEndsAt : today;
  user.planId = plan.id;
  if (!running) user.planStartedAt = today;
  user.planEndsAt = addDays(from, plan.durationDays);
}

/** Ways to pay offered at checkout: enabled gateways by priority, then card to card when it has an active card. */
export function enabledGateways(): { id: PaymentMethod; name: string }[] {
  const list: { id: PaymentMethod; name: string }[] = db()
    .gateways.filter((g) => g.enabled)
    .sort((a, b) => a.priority - b.priority)
    .map((g) => ({ id: g.id, name: g.name }));
  if (cardPaymentsOpen()) list.push({ id: 'card', name: PAYMENT_METHOD_NAMES.card });
  return list;
}

export function checkDiscount(body: any, user?: AccountUser) {
  const plan = db().plans.find((p) => p.id === body.planId && p.active);
  if (!plan) throw notFound('پلن پیدا نشد.');
  const r = discountFor(str(body.code, 'discount', { max: 40, label: 'کد تخفیف' }), plan, user);
  return { percent: r.percent, finalToman: r.finalToman };
}

export async function checkout(user: AccountUser, body: any) {
  const d = db();
  const plan = d.plans.find((p) => p.id === body.planId && p.active);
  if (!plan || plan.priceToman <= 0) throw notFound('این پلن قابل خرید نیست.');
  const method = oneOf(body.gateway, METHOD_IDS, 'gateway');
  const disc = discountFor(typeof body.discountCode === 'string' ? body.discountCode : undefined, plan, user);
  if (disc.finalToman < 1000) throw badRequest('amount', 'مبلغ پرداخت کمتر از حداقل مجاز درگاه است.', 'discount');
  if (method === 'card') return startCardPayment(user, plan, disc.finalToman, disc.dc?.code);
  const gatewayId = method;
  const g = d.gateways.find((x) => x.id === gatewayId && x.enabled);
  if (!g) throw badRequest('gateway', 'این درگاه فعال نیست.', 'gateway');

  const p: StoredPayment = {
    id: uid('pay'),
    userId: user.id,
    userName: user.name,
    phone: user.phone,
    planId: plan.id,
    planName: plan.name,
    amountToman: disc.finalToman,
    discountCode: disc.dc?.code,
    gateway: gatewayId,
    status: 'pending',
    createdAt: Date.now(),
  };

  if (config.paymentSimulator) {
    p.simulated = true;
    p.authority = `SIM${Date.now()}`;
    d.payments.unshift(p);
    save();
    return { paymentId: p.id, amountToman: p.amountToman, redirectUrl: `${config.publicUrl}/api/payments/simulate/${p.id}` };
  }

  try {
    const r = await GATEWAYS[gatewayId].request(g, {
      paymentId: p.id,
      amountToman: p.amountToman,
      callbackUrl: callbackUrl(gatewayId, p.id),
      description: `خرید اشتراک ${plan.name} — ${d.settings.siteName}`,
      mobile: user.phone,
    });
    p.authority = r.authority;
    d.payments.unshift(p);
    save();
    return { paymentId: p.id, amountToman: p.amountToman, redirectUrl: r.redirectUrl };
  } catch (e) {
    if (e instanceof GatewayError || e instanceof UpstreamError) {
      console.warn(`[pay] ${gatewayId} request failed:`, e.message);
      throw new HttpError(502, 'gateway', `اتصال به ${g.name} برقرار نشد. درگاه دیگری را امتحان کنید. (${e.message})`, 'gateway');
    }
    throw e;
  }
}

const callbackUrl = (gateway: GatewayId, paymentId: string) => `${config.publicUrl}/api/payments/callback/${gateway}?pid=${encodeURIComponent(paymentId)}`;
const backToApp = (paymentId: string) => Reply.redirect(`${config.appUrl}/billing?payment=${encodeURIComponent(paymentId)}`);

export function markPaid(p: StoredPayment, refId?: string, cardPan?: string) {
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
  save();
}

function markFailed(p: StoredPayment, message?: string) {
  p.status = 'failed';
  p.gatewayMessage = message;
  save();
}

/** One verification per payment at a time (gateways sometimes call back twice). */
const inflight = new Map<string, Promise<void>>();

/** The gateway sends the browser here (GET, or a form POST for IDPay / NextPay). */
export async function handleCallback(gatewayId: string, query: URLSearchParams, body: Record<string, unknown>) {
  const params: Record<string, string> = {};
  query.forEach((v, k) => (params[k] = v));
  for (const [k, v] of Object.entries(body ?? {})) if (typeof v === 'string' || typeof v === 'number') params[k] = String(v);
  const pid = params.pid ?? params.order_id ?? params.orderId ?? params.factorNumber ?? '';
  const p = db().payments.find((x) => x.id === pid);
  if (!p || p.gateway !== gatewayId || p.gateway === 'card') return Reply.redirect(`${config.appUrl}/billing`);

  if (!inflight.has(p.id)) {
    inflight.set(
      p.id,
      verifyPayment(p, params).finally(() => inflight.delete(p.id)),
    );
  }
  await inflight.get(p.id);
  return backToApp(p.id);
}

async function verifyPayment(p: StoredPayment, params: Record<string, string>) {
  if (p.status !== 'pending' || p.gateway === 'card') return;
  const gw = GATEWAYS[p.gateway];
  const info = gw.callback(params);
  if (info.authority && p.authority && info.authority !== p.authority) {
    console.warn(`[pay] ${p.id}: callback token ${info.authority} does not match ${p.authority}`);
    return;
  }
  if (!info.ok) return markFailed(p, 'پرداخت توسط کاربر لغو شد یا ناموفق بود.');
  const g = db().gateways.find((x) => x.id === p.gateway)!;
  try {
    const r = await gw.verify(g, { authority: p.authority ?? info.authority ?? '', amountToman: p.amountToman, paymentId: p.id });
    if (!r.ok) return markFailed(p, r.message);
    if (r.amountRial !== undefined && r.amountRial !== toRial(p.amountToman)) {
      return markFailed(p, `مبلغ تأییدشده (${faNum(r.amountRial)} ریال) با سفارش برابر نیست.`);
    }
    markPaid(p, r.refId, r.cardPan);
  } catch (e) {
    // Leave it pending: the money may have been taken; an admin can check it and the gateway reverses unverified payments.
    p.gatewayMessage = `تأیید پرداخت انجام نشد: ${(e as Error).message}`;
    save();
    console.error(`[pay] verify ${p.id} failed:`, e);
  }
}

// ---------- local simulator (PAYMENT_SIMULATOR) ----------
export function simulatorPage(id: string) {
  if (!config.paymentSimulator) throw notFound();
  const p = db().payments.find((x) => x.id === id);
  if (!p) throw notFound('تراکنش پیدا نشد.');
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  return Reply.html(`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>درگاه آزمایشی</title><style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#eef1f6;font-family:Vazirmatn,Tahoma,sans-serif;color:#1b2433}
.card{width:min(420px,92vw);background:#fff;border-radius:16px;box-shadow:0 20px 60px -20px rgba(20,30,60,.35);overflow:hidden}
.head{background:#5b3fd6;color:#fff;padding:16px 20px;display:flex;justify-content:space-between;align-items:center}
.tag{background:#ffc53d;color:#000;border-radius:6px;padding:2px 8px;font-size:12px;font-weight:700}
dl{display:grid;grid-template-columns:1fr auto;gap:8px;margin:20px;padding:16px;background:#f5f7fb;border-radius:12px;font-size:14px}
dt{color:#5b6577}dd{margin:0;font-weight:600}
.row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 20px 20px}
button{height:44px;border-radius:12px;border:0;font:inherit;font-weight:700;cursor:pointer}
.ok{background:#1f9d55;color:#fff}.no{background:#fff;border:1px solid #d6dbe6;color:#5b6577}
p{margin:0 20px 16px;font-size:12px;color:#7a5600;background:#fff6e0;padding:8px 12px;border-radius:10px;line-height:1.8}
</style></head><body><div class="card">
<div class="head"><div><div style="font-size:11px;opacity:.8">درگاه پرداخت</div><b>${esc(PAYMENT_METHOD_NAMES[p.gateway])}</b></div><span class="tag">شبیه‌ساز توسعه</span></div>
<dl><dt>بابت</dt><dd>${esc(p.planName)}</dd><dt>پرداخت‌کننده</dt><dd dir="ltr">${esc(p.phone)}</dd><dt>مبلغ</dt><dd>${faNum(p.amountToman * 10)} ریال</dd></dl>
<p>این صفحه فقط وقتی PAYMENT_SIMULATOR روشن است نمایش داده می‌شود و پولی جابه‌جا نمی‌شود. روی سرور اصلی آن را خاموش کنید تا کاربر به درگاه واقعی برود.</p>
${
  p.status === 'pending'
    ? `<form method="post" class="row"><button class="ok" name="action" value="pay">پرداخت</button><button class="no" name="action" value="cancel">انصراف</button></form>`
    : `<p>این تراکنش قبلاً بسته شده است.</p>`
}
</div></body></html>`);
}

export function simulatorComplete(id: string, action: unknown) {
  if (!config.paymentSimulator) throw notFound();
  const p = db().payments.find((x) => x.id === id);
  if (!p) throw notFound('تراکنش پیدا نشد.');
  if (p.status === 'pending' && p.simulated) {
    if (action === 'pay') markPaid(p, String(100_000_000 + Math.floor(Math.random() * 899_999_999)), '6037-99**-****-1234');
    else markFailed(p, 'پرداخت لغو شد.');
  }
  return backToApp(p.id);
}

/** Admin "test connection": registers a 1,000-toman payment and discards it. */
export async function testGateway(id: GatewayId): Promise<{ ok: boolean; message: string }> {
  const g = db().gateways.find((x) => x.id === id);
  if (!g) throw notFound('درگاه پیدا نشد.');
  try {
    const r = await GATEWAYS[id].request(g, {
      paymentId: uid('test'),
      amountToman: 1000,
      callbackUrl: callbackUrl(id, 'test'),
      description: 'آزمایش اتصال درگاه',
      mobile: '09120000000',
    });
    return { ok: true, message: `اتصال به ${g.name}${g.sandbox ? ' (سندباکس)' : ''} برقرار است. شناسه‌ی آزمایشی: ${r.authority}` };
  } catch (e) {
    if (e instanceof GatewayError || e instanceof UpstreamError) return { ok: false, message: e.message };
    throw e;
  }
}

/** Gateway payments still pending after two hours will not complete any more; card transfers end at their own deadline. */
export function expireStalePayments() {
  expireTransfers();
  const cutoff = Date.now() - 2 * 3_600_000;
  let changed = false;
  for (const p of db().payments) {
    if (p.status === 'pending' && !p.transfer && p.createdAt < cutoff) {
      p.status = 'failed';
      p.gatewayMessage = p.gatewayMessage ?? 'مهلت پرداخت تمام شد.';
      changed = true;
    }
  }
  if (changed) save();
}
