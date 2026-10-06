import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startServer } from './harness';

let s: Awaited<ReturnType<typeof startServer>>;
let admin: { token: string };
let user: { token: string; user: any };
let other: { token: string };
let card: typeof import('../src/payments/card');

const MELLI = '6037997512345670';
const MELLAT = '6104331287452107';
const transfers = () => s.db().payments.filter((p: any) => p.transfer);

before(async () => {
  s = await startServer({ OTP_DEV_ECHO: 'true' });
  admin = await s.signIn('09120000001', 'مدیر');
  user = await s.signIn('09351234567', 'سارا رضایی');
  other = await s.signIn('09191112233', 'امیر');
  card = await import('../src/payments/card');
});
after(() => s.stop());

test('admins add cards: number checked, bank found from the number, no duplicates', async () => {
  const put = (id: string, body: object, token = admin.token) => s.call('PUT', `/api/admin/cards/${id}`, body, token);
  assert.equal((await put('card_a', { number: '6037-9975-1234-5671', holder: 'پدرام' })).data.field, 'number', 'check digit');
  assert.equal((await put('card_a', { number: '603799751234', holder: 'پدرام' })).data.field, 'number');
  assert.equal((await put('card_a', { number: MELLI, holder: '' })).data.field, 'holder');
  assert.equal((await put('card_a', { number: MELLI, holder: 'x' }, user.token)).status, 403);

  const a = await put('card_a', { number: '۶۰۳۷ ۹۹۷۵ ۱۲۳۴ ۵۶۷۰', holder: 'پدرام آقایی' });
  assert.equal(a.status, 200, JSON.stringify(a.data));
  assert.equal(a.data.number, MELLI, 'Persian digits and spaces accepted');
  assert.equal(a.data.bank, 'بانک ملی ایران');
  assert.equal(a.data.active, true);
  assert.equal((await put('card_b', { number: MELLI, holder: 'دیگری' })).data.code, 'exists');
  const b = await put('card_b', { number: MELLAT, holder: 'پدرام آقایی', bank: 'ملت (حساب دوم)' });
  assert.equal(b.data.bank, 'ملت (حساب دوم)', 'the bank name can be changed');

  const list = await s.call('GET', '/api/admin/cards', undefined, admin.token);
  assert.equal(list.data.cards.length, 2);
  assert.deepEqual(list.data.settings, { enabled: false, payMinutes: 30, note: '' });
  assert.ok(s.db().audit.some((e: any) => e.action === 'افزودن کارت'));
});

test('card to card is offered once it is switched on', async () => {
  const ids = async () => (await s.call('GET', '/api/payments/gateways')).data.map((g: any) => g.id);
  assert.ok(!(await ids()).includes('card'));
  assert.equal((await s.call('POST', '/api/payments/checkout', { planId: 'pro-1m', gateway: 'card' }, user.token)).data.code, 'gateway');

  assert.equal((await s.call('PUT', '/api/admin/cards/settings', { enabled: true, payMinutes: 2 }, admin.token)).data.field, 'payMinutes');
  const set = await s.call('PUT', '/api/admin/cards/settings', { enabled: true, payMinutes: '۴۵', note: 'رسید را نگه دارید.' }, admin.token);
  assert.deepEqual(set.data, { enabled: true, payMinutes: 45, note: 'رسید را نگه دارید.' });
  assert.deepEqual(await ids(), ['zarinpal', 'zibal', 'card']);
});

test('each transfer has its own last three digits and an amount in rial', async () => {
  const before = Date.now();
  const co = await s.call('POST', '/api/payments/checkout', { planId: 'pro-1m', gateway: 'card' }, user.token);
  assert.equal(co.status, 200, JSON.stringify(co.data));
  assert.equal(co.data.redirectUrl, `#/billing/card?payment=${co.data.paymentId}`);
  const p = (await s.call('GET', `/api/payments/${co.data.paymentId}`, undefined, user.token)).data;
  assert.equal(p.gateway, 'card');
  assert.equal(p.status, 'pending');
  const t = p.transfer;
  assert.ok(t.code >= 1 && t.code <= 999);
  assert.equal(t.amountRial, 6_900_000 + t.code, '690,000 toman = 6,900,000 rial, plus the code');
  assert.equal(t.amountRial % 1000, t.code);
  assert.ok([MELLI, MELLAT].includes(t.cardNumber));
  assert.equal(t.holder, 'پدرام آقایی');
  assert.ok(t.expiresAt >= before + 45 * 60_000 && t.expiresAt <= Date.now() + 45 * 60_000);

  // going back and paying for the same plan again shows the same transfer
  const again = await s.call('POST', '/api/payments/checkout', { planId: 'pro-1m', gateway: 'card' }, user.token);
  assert.equal(again.data.paymentId, co.data.paymentId);
  // another plan replaces it
  const other3m = await s.call('POST', '/api/payments/checkout', { planId: 'pro-3m', gateway: 'card' }, user.token);
  assert.notEqual(other3m.data.paymentId, co.data.paymentId);
  const old = s.db().payments.find((x: any) => x.id === co.data.paymentId)!;
  assert.equal(old.status, 'failed');
  assert.equal(old.transfer!.closed, 'cancelled');

  // the next person gets the other card (cards take turns) and a different code
  const co2 = await s.call('POST', '/api/payments/checkout', { planId: 'pro-1m', gateway: 'card' }, other.token);
  const t2 = s.db().payments.find((x: any) => x.id === co2.data.paymentId)!.transfer!;
  const t3 = s.db().payments.find((x: any) => x.id === other3m.data.paymentId)!.transfer!;
  assert.notEqual(t2.code, t3.code);
  assert.notEqual(t2.cardId, t3.cardId);
  await s.call('POST', `/api/payments/${co2.data.paymentId}/cancel`, {}, other.token);
  await s.call('POST', `/api/payments/${other3m.data.paymentId}/cancel`, {}, user.token);
});

test('codes are never shared by open transfers; when all 999 are taken, checkout says so', async () => {
  const d = s.db();
  const now = Date.now();
  const fake = (code: number, extra: object = {}) => ({
    id: `pay_fake_${code}`,
    userId: 'nobody',
    userName: 'x',
    phone: '',
    planId: 'pro-1m',
    planName: 'x',
    amountToman: 690_000,
    gateway: 'card',
    status: 'pending',
    createdAt: now,
    transfer: { cardId: 'card_a', cardNumber: MELLI, holder: 'x', bank: 'x', code, amountRial: 6_900_000 + code, expiresAt: now + 3_600_000 },
    ...extra,
  });
  const saved = d.payments;
  d.payments = [...saved];
  // 997 open, one expired an hour ago (the money may still come), one rejected (free again)
  for (let c = 1; c <= 997; c++) d.payments.push(fake(c, c % 2 ? { status: 'review' } : {}) as any);
  d.payments.push(fake(998, { status: 'failed', transfer: { ...fake(998).transfer, expiresAt: now - 3_600_000, closed: 'expired' } }) as any);
  d.payments.push(fake(999, { status: 'failed', transfer: { ...fake(999).transfer, closed: 'rejected' } }) as any);

  const co = await s.call('POST', '/api/payments/checkout', { planId: 'pro-1m', gateway: 'card' }, user.token);
  assert.equal(co.status, 200);
  assert.equal(d.payments.find((x: any) => x.id === co.data.paymentId)!.transfer!.code, 999, 'the only free code');
  const full = await s.call('POST', '/api/payments/checkout', { planId: 'pro-1m', gateway: 'card' }, other.token);
  assert.equal(full.status, 503);
  assert.equal(full.data.code, 'busy');
  d.payments = saved;
});

test('the payer reports the transfer; an admin finds it by its last three digits and confirms it', async () => {
  await s.call('PUT', '/api/admin/discounts/dc_c2c', { id: 'dc_c2c', code: 'CARD10', percent: 10, maxUses: 5, used: 0, active: true }, admin.token);
  const co = await s.call('POST', '/api/payments/checkout', { planId: 'pro-3m', gateway: 'card', discountCode: 'card10' }, user.token);
  assert.equal(co.data.amountToman, 1_611_000);
  const id = co.data.paymentId;
  const t = s.db().payments.find((x: any) => x.id === id)!.transfer!;
  assert.equal(t.amountRial, 16_110_000 + t.code);

  assert.equal((await s.call('POST', `/api/payments/${id}/sent`, {}, other.token)).status, 404, 'only the payer');
  assert.equal((await s.call('POST', `/api/payments/${id}/sent`, { payerCard: '12' }, user.token)).data.field, 'payerCard');
  const sent = await s.call('POST', `/api/payments/${id}/sent`, { payerCard: '۴۴۲۱', payerRef: '123456789' }, user.token);
  assert.equal(sent.data.status, 'review');
  assert.equal(sent.data.transfer.payerCard, '4421');
  assert.equal((await s.call('POST', `/api/payments/${id}/cancel`, {}, user.token)).data.code, 'bad_state', 'a reported transfer cannot be cancelled');

  const byCode = await s.call('GET', `/api/admin/payments?gateway=card&q=${String(t.code).padStart(3, '0')}`, undefined, admin.token);
  assert.deepEqual(
    byCode.data.items.map((p: any) => p.id),
    [id],
  );
  const waiting = await s.call('GET', '/api/admin/payments?status=review', undefined, admin.token);
  assert.equal(waiting.data.total, 1);
  const byAmount = await s.call('GET', `/api/admin/payments?q=${(16_110_000 + t.code).toLocaleString('en-US')}`, undefined, admin.token);
  assert.equal(byAmount.data.total, 1, 'the full amount, with separators, finds it too');

  const meBefore = (await s.call('GET', '/api/me', undefined, user.token)).data;
  assert.equal((await s.call('POST', `/api/admin/payments/${id}/confirm`, {}, user.token)).status, 403);
  const ok = await s.call('POST', `/api/admin/payments/${id}/confirm`, { refId: '' }, admin.token);
  assert.equal(ok.status, 200, JSON.stringify(ok.data));
  assert.equal(ok.data.status, 'paid');
  assert.equal(ok.data.refId, '123456789', "the payer's tracking number");
  assert.equal(ok.data.transfer.reviewedBy, 'مدیر');
  const me = (await s.call('GET', '/api/me', undefined, user.token)).data;
  assert.equal(me.planId, 'pro-3m');
  assert.equal((Date.parse(me.planEndsAt) - Date.parse(meBefore.planEndsAt)) / 86_400_000, 90);
  assert.equal(s.db().discounts.find((x: any) => x.code === 'CARD10')!.used, 1);
  assert.equal((await s.call('POST', `/api/admin/payments/${id}/confirm`, {}, admin.token)).data.code, 'bad_state', 'confirmed once');

  const cards = (await s.call('GET', '/api/admin/cards', undefined, admin.token)).data.cards;
  const used = cards.find((c: any) => c.id === t.cardId);
  assert.equal(used.paidCount, 1);
  assert.equal(used.paidToman, 1_611_000);
  const stats = (await s.call('GET', '/api/admin/stats', undefined, admin.token)).data;
  assert.ok(stats.byGateway.some((g: any) => g.gateway === 'card' && g.amount === 1_611_000));
});

test('rejected transfers tell the payer why; late transfers can still be reported and confirmed', async () => {
  const co = await s.call('POST', '/api/payments/checkout', { planId: 'pro-1m', gateway: 'card' }, other.token);
  await s.call('POST', `/api/payments/${co.data.paymentId}/sent`, {}, other.token);
  const no = await s.call('POST', `/api/admin/payments/${co.data.paymentId}/reject`, { reason: 'واریزی با این مبلغ نرسید.' }, admin.token);
  assert.equal(no.data.status, 'failed');
  assert.equal(no.data.transfer.closed, 'rejected');
  const seen = (await s.call('GET', `/api/payments/${co.data.paymentId}`, undefined, other.token)).data;
  assert.equal(seen.transfer.note, 'واریزی با این مبلغ نرسید.');
  assert.equal((await s.call('POST', `/api/payments/${co.data.paymentId}/sent`, {}, other.token)).data.code, 'bad_state');

  // time runs out before the payer says anything
  const late = await s.call('POST', '/api/payments/checkout', { planId: 'pro-1m', gateway: 'card' }, other.token);
  const p = s.db().payments.find((x: any) => x.id === late.data.paymentId)!;
  p.transfer!.expiresAt = Date.now() - 60_000;
  card.expireTransfers();
  assert.equal(p.status, 'failed');
  assert.equal(p.transfer!.closed, 'expired');
  // its code stays reserved for a day …
  const next = await s.call('POST', '/api/payments/checkout', { planId: 'pro-12m', gateway: 'card' }, user.token);
  assert.notEqual(s.db().payments.find((x: any) => x.id === next.data.paymentId)!.transfer!.code, p.transfer!.code);
  await s.call('POST', `/api/payments/${next.data.paymentId}/cancel`, {}, user.token);
  // … so a payer who sent the money late can still report it
  const sent = await s.call('POST', `/api/payments/${late.data.paymentId}/sent`, { payerRef: 'ABC-12345' }, other.token);
  assert.equal(sent.data.status, 'review');
  assert.equal((await s.call('POST', `/api/admin/payments/${late.data.paymentId}/confirm`, { refId: '۹۸۷۶۵۴' }, admin.token)).data.refId, '987654');

  // a day after the deadline it is closed for good
  const old = await s.call('POST', '/api/payments/checkout', { planId: 'pro-1m', gateway: 'card' }, other.token);
  const q = s.db().payments.find((x: any) => x.id === old.data.paymentId)!;
  q.transfer!.expiresAt = Date.now() - 25 * 3_600_000;
  assert.equal((await s.call('POST', `/api/payments/${old.data.paymentId}/sent`, {}, other.token)).data.code, 'bad_state');
  // an admin can still confirm money that arrived, from the payments list
  assert.equal((await s.call('POST', `/api/admin/payments/${old.data.paymentId}/confirm`, {}, admin.token)).data.status, 'paid');
});

test('cards with open transfers are not deleted; switching a card off takes it out of turn', async () => {
  const co = await s.call('POST', '/api/payments/checkout', { planId: 'pro-1m', gateway: 'card' }, user.token);
  const cardId = s.db().payments.find((x: any) => x.id === co.data.paymentId)!.transfer!.cardId;
  const del = await s.call('DELETE', `/api/admin/cards/${cardId}`, undefined, admin.token);
  assert.equal(del.data.code, 'in_use');
  await s.call('POST', `/api/payments/${co.data.paymentId}/cancel`, {}, user.token);

  const keep = cardId === 'card_a' ? 'card_b' : 'card_a';
  const off = s.db().cards.find((c: any) => c.id === keep)!;
  await s.call('PUT', `/api/admin/cards/${keep}`, { ...off, active: false }, admin.token);
  for (let i = 0; i < 3; i++) {
    const c = await s.call('POST', '/api/payments/checkout', { planId: i % 2 ? 'pro-3m' : 'pro-1m', gateway: 'card' }, user.token);
    assert.equal(s.db().payments.find((x: any) => x.id === c.data.paymentId)!.transfer!.cardId, cardId);
  }
  const last = transfers().find((p: any) => p.status === 'pending' && p.userId === user.user.id)!;
  await s.call('POST', `/api/payments/${last.id}/cancel`, {}, user.token);
  assert.equal((await s.call('DELETE', `/api/admin/cards/${cardId}`, undefined, admin.token)).status, 204);
  // no active card left: the method is no longer offered
  assert.ok(!(await s.call('GET', '/api/payments/gateways')).data.some((g: any) => g.id === 'card'));
  // payments keep the card they were made to
  const gone = s.db().payments.find((x: any) => x.id === co.data.paymentId)!.transfer!;
  assert.equal(gone.cardId, cardId);
  assert.match(gone.cardNumber, /^\d{16}$/);
});
