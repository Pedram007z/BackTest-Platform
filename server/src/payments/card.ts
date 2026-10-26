import { db, save, type StoredPayment } from '../db';
import { HttpError, badRequest, notFound, rateLimit } from '../http';
import {
  bankOfCard,
  canReportTransfer,
  cardAmountRial,
  cardDigits,
  holdsCode,
  isCardNumber,
  pickCardCode,
  transferReportError,
  type AccountUser,
  type CardAdmin,
  type CardToCardSettings,
  type PaymentCard,
  type Plan,
} from '../shared';
import { clone, toLatinDigits, uid } from '../util';

/**
 * Card-to-card payments. The payer gets one of the site's cards and an amount in rial whose last
 * three digits are a code no other open payment has; the admin sees a deposit of that amount in
 * the bank account, finds the payment by those digits and confirms it, which starts the plan.
 */

export const cardPaymentsOpen = () => {
  const d = db();
  return d.cardToCard.enabled && d.cards.some((c) => c.active);
};

/** Close transfers whose time ran out (they keep their code for a day: the money may still come). */
export function expireTransfers(now = Date.now()) {
  let changed = false;
  for (const p of db().payments) {
    if (p.transfer && p.status === 'pending' && p.transfer.expiresAt < now) {
      p.status = 'failed';
      p.transfer.closed = 'expired';
      p.gatewayMessage = 'مهلت پرداخت تمام شد.';
      changed = true;
    }
  }
  if (changed) save();
}

function close(p: StoredPayment, closed: 'cancelled' | 'rejected', message: string) {
  p.status = 'failed';
  p.transfer!.closed = closed;
  p.gatewayMessage = message;
}

export function startCardPayment(user: AccountUser, plan: Plan, finalToman: number, discountCode: string | undefined) {
  const d = db();
  if (!cardPaymentsOpen()) throw badRequest('gateway', 'پرداخت کارت به کارت فعال نیست.', 'gateway');
  rateLimit(`card:${user.id}`, 10, 3_600_000, 'در یک ساعت بیش از ۱۰ بار پرداخت کارت به کارت شروع کرده‌اید؛ کمی بعد دوباره تلاش کنید.');
  const now = Date.now();
  expireTransfers(now);
  const mine = d.payments.filter((p) => p.userId === user.id && p.transfer);
  if (mine.filter((p) => p.status === 'review').length >= 3) {
    throw badRequest('too_many', 'سه پرداخت کارت به کارت شما در انتظار تأیید است؛ پس از بررسی آن‌ها دوباره تلاش کنید.', 'gateway');
  }
  // the same order again (for example after going back): keep the transfer already shown
  const same = mine.find((p) => p.status === 'pending' && p.planId === plan.id && p.amountToman === finalToman && p.discountCode === discountCode);
  if (same) return { paymentId: same.id, amountToman: same.amountToman, redirectUrl: transferPage(same.id) };
  // one open transfer per person: a different order replaces it
  for (const p of mine) if (p.status === 'pending') close(p, 'cancelled', 'با سفارش جدید جایگزین شد.');

  const code = pickCardCode(new Set(d.payments.filter((p) => holdsCode(p, now)).map((p) => p.transfer!.code)));
  if (code === null) throw new HttpError(503, 'busy', 'ظرفیت پرداخت کارت به کارت موقتاً پر است؛ کمی بعد یا با درگاه بانکی پرداخت کنید.', 'gateway');
  const card = d.cards.filter((c) => c.active).sort((a, b) => (a.lastUsedAt ?? 0) - (b.lastUsedAt ?? 0))[0];
  card.lastUsedAt = now;
  const p: StoredPayment = {
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
    transfer: {
      cardId: card.id,
      cardNumber: card.number,
      holder: card.holder,
      bank: card.bank,
      code,
      amountRial: cardAmountRial(finalToman, code),
      expiresAt: now + d.cardToCard.payMinutes * 60_000,
      instructions: d.cardToCard.note || undefined,
    },
  };
  d.payments.unshift(p);
  save();
  return { paymentId: p.id, amountToman: p.amountToman, redirectUrl: transferPage(p.id) };
}

const transferPage = (id: string) => `/billing/card?payment=${encodeURIComponent(id)}`;

function ownTransfer(user: AccountUser, id: string) {
  const p = db().payments.find((x) => x.id === id && x.userId === user.id);
  if (!p?.transfer) throw notFound('پرداخت پیدا نشد.');
  return p;
}

/** The payer says the money was sent: the payment waits for an admin. */
export function reportTransfer(user: AccountUser, id: string, body: any) {
  expireTransfers();
  const p = ownTransfer(user, id);
  if (p.status === 'review') return p;
  if (!canReportTransfer(p)) throw badRequest('bad_state', 'این پرداخت بسته شده است؛ از صفحه‌ی اشتراک دوباره پرداخت کنید.');
  const payerCard = toLatinDigits(String(body?.payerCard ?? '')).trim();
  const payerRef = toLatinDigits(String(body?.payerRef ?? '')).trim();
  const err = transferReportError(payerCard, payerRef);
  if (err) throw badRequest('invalid', err.message, err.field);
  p.status = 'review';
  p.gatewayMessage = undefined;
  p.transfer!.closed = undefined;
  p.transfer!.payerCard = payerCard || undefined;
  p.transfer!.payerRef = payerRef || undefined;
  p.transfer!.sentAt = Date.now();
  save();
  return p;
}

export function cancelTransfer(user: AccountUser, id: string) {
  const p = ownTransfer(user, id);
  if (p.status !== 'pending') throw badRequest('bad_state', 'فقط پرداختی که هنوز گزارش نشده لغو می‌شود.');
  close(p, 'cancelled', 'پرداخت لغو شد.');
  save();
  return p;
}

// ---------- admin ----------
export function cardAdmin(): CardAdmin {
  const d = db();
  return clone({
    settings: d.cardToCard,
    cards: d.cards.map((c) => {
      const list = d.payments.filter((p) => p.transfer?.cardId === c.id);
      const paid = list.filter((p) => p.status === 'paid');
      return {
        ...c,
        open: list.filter((p) => p.status === 'pending' || p.status === 'review').length,
        paidCount: paid.length,
        paidToman: paid.reduce((s, p) => s + p.amountToman, 0),
      };
    }),
  });
}

export function saveCardSettings(body: any): CardToCardSettings {
  const minutes = Number(toLatinDigits(String(body?.payMinutes ?? '')));
  if (!Number.isInteger(minutes) || minutes < 5 || minutes > 1440) throw badRequest('invalid', 'مهلت پرداخت باید بین ۵ تا ۱۴۴۰ دقیقه باشد.', 'payMinutes');
  const note = typeof body?.note === 'string' ? body.note.trim() : '';
  if (note.length > 300) throw badRequest('invalid', 'توضیح حداکثر ۳۰۰ حرف است.', 'note');
  const d = db();
  d.cardToCard = { enabled: body?.enabled === true, payMinutes: minutes, note };
  save();
  return clone(d.cardToCard);
}

export function saveCard(id: string, body: any): PaymentCard {
  if (!/^[\w-]{3,40}$/.test(id)) throw badRequest('invalid', 'شناسه‌ی کارت معتبر نیست.');
  const number = cardDigits(String(body?.number ?? ''));
  if (!isCardNumber(number)) throw badRequest('invalid', 'شماره‌ی کارت ۱۶ رقمی معتبر نیست.', 'number');
  const holder = String(body?.holder ?? '').trim();
  if (holder.length < 2 || holder.length > 60) throw badRequest('invalid', 'نام صاحب کارت را وارد کنید (حداکثر ۶۰ حرف).', 'holder');
  const bank = String(body?.bank ?? '').trim() || bankOfCard(number);
  if (bank.length > 40) throw badRequest('invalid', 'نام بانک حداکثر ۴۰ حرف است.', 'bank');
  const d = db();
  if (d.cards.some((c) => c.number === number && c.id !== id)) throw badRequest('exists', 'این کارت قبلاً اضافه شده است.', 'number');
  const old = d.cards.find((c) => c.id === id);
  const card: PaymentCard = { id, number, holder, bank, active: body?.active !== false, createdAt: old?.createdAt ?? Date.now(), lastUsedAt: old?.lastUsedAt };
  if (old) d.cards = d.cards.map((c) => (c.id === id ? card : c));
  else d.cards.push(card);
  save();
  return clone(card);
}

export function deleteCard(id: string): PaymentCard {
  const d = db();
  const card = d.cards.find((c) => c.id === id);
  if (!card) throw notFound('کارت پیدا نشد.');
  const open = d.payments.filter((p) => p.transfer?.cardId === id && (p.status === 'pending' || p.status === 'review')).length;
  if (open) throw badRequest('in_use', `${open.toLocaleString('fa-IR')} پرداخت باز روی این کارت است؛ فعلاً آن را غیرفعال کنید و پس از بستن آن‌ها حذفش کنید.`);
  d.cards = d.cards.filter((c) => c.id !== id);
  save();
  return card;
}

/** Card-to-card payments an admin can still confirm: open, or closed unpaid (money that arrived late). */
export function transferToReview(id: string) {
  const p = db().payments.find((x) => x.id === id);
  if (!p?.transfer) throw notFound('پرداخت کارت به کارت پیدا نشد.');
  return p;
}

export function rejectTransfer(p: StoredPayment, reason: unknown, by: string) {
  if (p.status !== 'pending' && p.status !== 'review') throw badRequest('bad_state', 'فقط پرداخت‌های باز رد می‌شوند.');
  const note = typeof reason === 'string' ? reason.trim().slice(0, 200) : '';
  close(p, 'rejected', note || 'واریز پیدا نشد.');
  p.transfer!.note = note || 'واریزی با این مبلغ به حساب نرسید.';
  p.transfer!.reviewedBy = by;
  p.transfer!.reviewedAt = Date.now();
  save();
}
