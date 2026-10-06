import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { startServer } from './harness';
import { toApiCandles } from './fixtures/dukascopy-api';
import { FF_PAGE } from './fixtures/ff-page';

let s: Awaited<ReturnType<typeof startServer>>;
let admin: { token: string; user: any };
let user: { token: string; user: any };

before(async () => {
  s = await startServer({ PAYMENT_SIMULATOR: 'true', OTP_DEV_ECHO: 'true' });
});
after(() => s.stop());

test('sign-in by phone: validation, wrong code, name for new accounts', async () => {
  const bad = await s.call('POST', '/api/auth/otp', { phone: '12345' });
  assert.equal(bad.status, 400);
  assert.equal(bad.data.code, 'bad_phone');
  assert.equal(bad.data.field, 'phone');

  // Persian digits and +98 are accepted
  const otp = await s.call('POST', '/api/auth/otp', { phone: '+98 ۹۱۲ ۰۰۰ ۰۰۰۱' });
  assert.equal(otp.status, 200);
  assert.equal(otp.data.isNew, true);
  assert.equal(otp.data.length, 5);
  assert.match(otp.data.devCode, /^\d{5}$/);

  const again = await s.call('POST', '/api/auth/otp', { phone: '09120000001' });
  assert.equal(again.data.code, 'too_soon');

  const wrong = await s.call('POST', '/api/auth/verify', { phone: '09120000001', code: otp.data.devCode === '11111' ? '22222' : '11111' });
  assert.equal(wrong.data.code, 'bad_code');
  const noName = await s.call('POST', '/api/auth/verify', { phone: '09120000001', code: otp.data.devCode });
  assert.equal(noName.data.code, 'need_name');
  const ok = await s.call('POST', '/api/auth/verify', { phone: '09120000001', code: otp.data.devCode, name: 'مدیر سایت' });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.isNew, true);
  assert.equal(ok.data.user.role, 'admin', 'ADMIN_PHONES become admins');
  assert.equal(ok.data.user.planId, 'pro-1m', 'new accounts start the trial plan');
  admin = ok.data;

  // the code is single use
  const reuse = await s.call('POST', '/api/auth/verify', { phone: '09120000001', code: otp.data.devCode });
  assert.equal(reuse.data.code, 'expired');
  // codes are stored hashed
  assert.ok(!JSON.stringify(s.db().otps).includes(otp.data.devCode));

  user = await s.signIn('09351234567', 'سارا رضایی');
  assert.equal(user.user.role, 'user');
  const me = await s.call('GET', '/api/me', undefined, user.token);
  assert.equal(me.data.name, 'سارا رضایی');
  assert.equal((await s.call('GET', '/api/me')).status, 401);
  assert.equal((await s.call('GET', '/api/me', undefined, 'forged-token')).status, 401);
});

test('admin API is closed to normal users', async () => {
  const r = await s.call('GET', '/api/admin/stats', undefined, user.token);
  assert.equal(r.status, 403);
  assert.equal(r.data.code, 'forbidden');
  const stats = await s.call('GET', '/api/admin/stats', undefined, admin.token);
  assert.equal(stats.status, 200);
  assert.equal(stats.data.users, 2);
  assert.equal(stats.data.signupsByDay.length, 30);
  assert.equal(stats.data.signupsByDay.at(-1).count, 2);
});

test('discount code, checkout through the simulator, plan extension', async () => {
  const save = await s.call('PUT', '/api/admin/discounts/dc_test', { id: 'dc_test', code: 'mehr20', percent: 20, maxUses: 5, used: 0, active: true }, admin.token);
  assert.equal(save.status, 200);
  assert.equal(save.data.code, 'MEHR20');

  const check = await s.call('POST', '/api/payments/discount', { code: 'mehr20', planId: 'pro-3m' });
  assert.deepEqual(check.data, { percent: 20, finalToman: 1_432_000 });
  assert.equal((await s.call('POST', '/api/payments/discount', { code: 'NOPE', planId: 'pro-3m' })).data.code, 'bad_code');

  const gateways = await s.call('GET', '/api/payments/gateways');
  assert.deepEqual(
    gateways.data.map((g: any) => g.id),
    ['zarinpal', 'zibal'],
  );

  const before = (await s.call('GET', '/api/me', undefined, user.token)).data;
  const co = await s.call('POST', '/api/payments/checkout', { planId: 'pro-3m', gateway: 'zarinpal', discountCode: 'MEHR20' }, user.token);
  assert.equal(co.status, 200);
  assert.equal(co.data.amountToman, 1_432_000);
  assert.equal(co.data.redirectUrl, `https://api.test/api/payments/simulate/${co.data.paymentId}`);

  const page = await s.call('GET', `/api/payments/simulate/${co.data.paymentId}`);
  assert.equal(page.status, 200);
  assert.match(page.data, /شبیه‌ساز/);
  const done = await s.call('POST', `/api/payments/simulate/${co.data.paymentId}`, 'action=pay', undefined, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  assert.equal(done.status, 302);
  assert.equal(done.headers.get('location'), `https://app.test/#/billing?payment=${co.data.paymentId}`);

  const pay = await s.call('GET', `/api/payments/${co.data.paymentId}`, undefined, user.token);
  assert.equal(pay.data.status, 'paid');
  assert.ok(pay.data.refId);
  assert.equal(pay.data.simulated, undefined, 'internal fields stay on the server');
  // another user cannot read it
  assert.equal((await s.call('GET', `/api/payments/${co.data.paymentId}`, undefined, 'nope')).status, 401);

  const after = (await s.call('GET', '/api/me', undefined, user.token)).data;
  assert.equal(after.planId, 'pro-3m');
  // the trial was still running, so 90 days are added to its end
  const days = (Date.parse(after.planEndsAt) - Date.parse(before.planEndsAt)) / 86_400_000;
  assert.equal(days, 90);
  assert.equal(after.planStartedAt, before.planStartedAt);
  assert.equal(s.db().discounts.find((d) => d.code === 'MEHR20')!.used, 1);

  const mine = await s.call('GET', '/api/me/payments', undefined, user.token);
  assert.equal(mine.data.length, 1);

  const refund = await s.call('POST', `/api/admin/payments/${co.data.paymentId}/refund`, {}, admin.token);
  assert.equal(refund.data.status, 'refunded');
  const list = await s.call('GET', '/api/admin/payments?status=refunded', undefined, admin.token);
  assert.equal(list.data.total, 1);

  // cancelling on the simulator fails the payment and leaves the plan alone
  const co2 = await s.call('POST', '/api/payments/checkout', { planId: 'pro-1m', gateway: 'zibal' }, user.token);
  await s.call('POST', `/api/payments/simulate/${co2.data.paymentId}`, 'action=cancel', undefined, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  assert.equal((await s.call('GET', `/api/payments/${co2.data.paymentId}`, undefined, user.token)).data.status, 'failed');
  assert.equal((await s.call('GET', '/api/me', undefined, user.token)).data.planId, 'pro-3m');
  // free plans and disabled gateways cannot be bought
  assert.equal((await s.call('POST', '/api/payments/checkout', { planId: 'free', gateway: 'zibal' }, user.token)).status, 404);
  assert.equal((await s.call('POST', '/api/payments/checkout', { planId: 'pro-1m', gateway: 'idpay' }, user.token)).data.code, 'gateway');
});

test('support tickets between user and admin', async () => {
  const t = await s.call('POST', '/api/me/tickets', { subject: 'سؤال درباره‌ی داده', text: 'داده‌ی طلا از چه سالی است؟' }, user.token);
  assert.equal(t.status, 200);
  const reply = await s.call('POST', `/api/admin/tickets/${t.data.id}/reply`, { text: 'از ۲۰۱۵.' }, admin.token);
  assert.equal(reply.data.status, 'answered');
  const back = await s.call('POST', `/api/me/tickets/${t.data.id}/reply`, { text: 'ممنون' }, user.token);
  assert.equal(back.data.status, 'open');
  assert.equal(back.data.messages.length, 3);
  const closed = await s.call('PUT', `/api/admin/tickets/${t.data.id}`, { status: 'closed' }, admin.token);
  assert.equal(closed.data.status, 'closed');
  assert.equal((await s.call('POST', '/api/me/tickets', { subject: 'x', text: 'y' }, user.token)).data.field, 'subject');
});

test('users: search, ban signs out, self-protection, audit trail', async () => {
  const found = await s.call('GET', `/api/admin/users?q=${encodeURIComponent('۰۹۳۵۱۲۳')}`, undefined, admin.token);
  assert.equal(found.data.total, 1);
  assert.equal(found.data.items[0].id, user.user.id);

  const self = await s.call('PUT', `/api/admin/users/${admin.user.id}`, { status: 'banned' }, admin.token);
  assert.equal(self.data.code, 'self');

  const ban = await s.call('PUT', `/api/admin/users/${user.user.id}`, { status: 'banned' }, admin.token);
  assert.equal(ban.data.status, 'banned');
  assert.equal((await s.call('GET', '/api/me', undefined, user.token)).status, 401, 'sessions are dropped');
  const otp = await s.call('POST', '/api/auth/otp', { phone: '09351234567' });
  assert.equal(otp.data.code, 'banned');

  await s.call('PUT', `/api/admin/users/${user.user.id}`, { status: 'active', planEndsAt: '2030-01-01' }, admin.token);
  const audit = await s.call('GET', '/api/admin/audit', undefined, admin.token);
  const actions = audit.data.map((a: any) => a.action);
  assert.ok(actions.includes('مسدود کردن کاربر'));
  assert.ok(actions.includes('رفع مسدودی کاربر'));
  assert.ok(actions.includes('ساخت کد تخفیف'));
  assert.equal(audit.data[0].actor, 'مدیر سایت');
});

test('plans and settings are validated', async () => {
  const plan = await s.call(
    'PUT',
    '/api/admin/plans/pro-6m',
    { name: 'حرفه‌ای شش‌ماهه', description: '', priceToman: 3_300_000, durationDays: 180, features: ['همه‌چیز'], active: true, sort: 4 },
    admin.token,
  );
  assert.equal(plan.status, 200);
  assert.equal((await s.call('GET', '/api/plans')).data.length, 5);
  assert.equal((await s.call('PUT', '/api/admin/plans/Bad Id', { name: 'x' }, admin.token)).status, 400);
  assert.equal((await s.call('DELETE', '/api/admin/plans/pro-1m', undefined, admin.token)).data.code, 'in_use');
  assert.equal((await s.call('DELETE', '/api/admin/plans/pro-6m', undefined, admin.token)).status, 204);

  const settings = (await s.call('GET', '/api/admin/settings', undefined, admin.token)).data;
  const bad = await s.call('PUT', '/api/admin/settings', { ...settings, otpLength: 3 }, admin.token);
  assert.equal(bad.data.field, 'otpLength');
  const generated = await s.call('PUT', '/api/admin/settings', { ...settings, marketData: { ...settings.marketData, forex: 'synthetic' } }, admin.token);
  assert.equal(generated.data.field, 'marketData.forex', 'generated prices are not a market data source');
  const good = await s.call('PUT', '/api/admin/settings', { ...settings, otpLength: 6, registrationOpen: false, enabledSymbols: ['EURUSD', 'XAUUSD', 'FAKE'] }, admin.token);
  assert.equal(good.status, 200);
  assert.deepEqual(good.data.enabledSymbols, ['EURUSD', 'XAUUSD']);
  const cfg = await s.call('GET', '/api/config');
  assert.deepEqual(cfg.data.enabledSymbols, ['EURUSD', 'XAUUSD']);
  assert.equal(cfg.data.market.EURUSD, 'dukascopy');
  assert.equal(cfg.data.market.BTCUSD, 'binance');

  const closed = await s.call('POST', '/api/auth/otp', { phone: '09191112233' });
  assert.equal(closed.data.code, 'closed', 'registration closed for new numbers');
  const existing = await s.call('POST', '/api/auth/otp', { phone: '09351234567' });
  assert.equal(existing.data.length, 6, 'existing accounts still sign in');
  await s.call('PUT', '/api/admin/settings', { ...settings }, admin.token);
});

test('SMS: real sending through Kavenegar, failures are reported and logged', async () => {
  const sms = (await s.call('GET', '/api/admin/sms', undefined, admin.token)).data;
  sms.enabled = true;
  sms.active = 'kavenegar';
  sms.providers.find((p: any) => p.id === 'kavenegar').apiKey = 'KEY123';
  sms.providers.find((p: any) => p.id === 'kavenegar').otpTemplate = 'verify';
  assert.equal((await s.call('PUT', '/api/admin/sms', sms, admin.token)).status, 200);

  s.setUpstream(() => s.json({ return: { status: 200, message: 'تایید شد' }, entries: [] }));
  const otp = await s.call('POST', '/api/auth/otp', { phone: '09121112233' });
  assert.equal(otp.status, 200);
  assert.equal(otp.data.devCode, undefined, 'the code is never returned once SMS is live');
  const sent = new URL(s.calls.at(-1)!.url);
  assert.equal(sent.pathname, '/v1/KEY123/verify/lookup.json');
  assert.equal(sent.searchParams.get('receptor'), '09121112233');
  assert.equal(sent.searchParams.get('template'), 'verify');
  assert.match(sent.searchParams.get('token')!, /^\d{5}$/);

  s.setUpstream(() => s.json({ return: { status: 418, message: 'اعتبار کافی نیست' } }));
  const fail = await s.call('POST', '/api/auth/otp', { phone: '09121112244' });
  assert.equal(fail.status, 502);
  assert.equal(fail.data.code, 'sms_failed');
  const test = await s.call('POST', '/api/admin/sms/test', { to: '09121112255' }, admin.token);
  assert.equal(test.status, 502);
  assert.match(test.data.message, /اعتبار کافی نیست/);

  s.setUpstream(() => s.json({ return: { status: 200 } }));
  const bulk = await s.call('POST', '/api/admin/sms/bulk', { text: 'اطلاعیه', audience: 'all' }, admin.token);
  assert.deepEqual(bulk.data, { sent: 2, failed: 0 });
  const receptors = new URLSearchParams(s.calls.at(-1)!.body).get('receptor')!.split(',');
  assert.equal(receptors.length, 2);

  const logs = (await s.call('GET', '/api/admin/sms/logs', undefined, admin.token)).data;
  assert.ok(logs.some((l: any) => l.status === 'failed' && l.error.includes('اعتبار کافی نیست')));
  sms.enabled = false;
  await s.call('PUT', '/api/admin/sms', sms, admin.token);
});

test('economic calendar: ForexFactory weeks are fetched once and cached', async () => {
  let pages = 0;
  s.setUpstream((url) => {
    if (url.includes('forexfactory.com/calendar?week=jan7.2024')) {
      pages++;
      return new Response(FF_PAGE, { status: 200 });
    }
    return new Response('<html><title>Just a moment...</title>cf-chl</html>', { status: 403 });
  });
  // from mid-Sunday, so the request also needs the week before (blocked below)
  const from = Date.UTC(2024, 0, 7, 12);
  const to = Date.UTC(2024, 0, 13);
  const r = await s.call('GET', `/api/news?from=${from}&to=${to}`, undefined, admin.token);
  assert.equal(r.status, 200);
  assert.deepEqual(
    r.data.events.map((e: any) => e.id),
    ['ff-131406', 'ff-131407', 'ff-131500', 'ff-131502'],
  );
  // the week before (Dec 31) was blocked: reported as missing so the app can fill it
  assert.deepEqual(r.data.missing, [Date.UTC(2023, 11, 31)]);
  await s.call('GET', `/api/news?from=${from}&to=${to}`, undefined, admin.token);
  assert.equal(pages, 1, 'a past week is fetched once');
  assert.equal((await s.call('GET', `/api/news?from=${from}&to=${to}`)).status, 401);

  const status = (await s.call('GET', '/api/admin/news', undefined, admin.token)).data;
  assert.equal(status.weeks, 1);
  assert.equal(status.events, 4);
  const sync = await s.call('POST', '/api/admin/news/sync', {}, admin.token);
  assert.equal(sync.status, 200);
  assert.match(sync.data.lastError, /Cloudflare/);
});

test('market data: Dukascopy and Binance days, cached on disk', async () => {
  const bi5 = readFileSync(new URL('./fixtures/EURUSD_2024-01-15_min_1.bi5', import.meta.url));
  const seen: string[] = [];
  s.setUpstream((url) => {
    seen.push(url);
    if (url.includes('dukascopy') && url.includes('/EURUSD/2024/00/15/')) return new Response(bi5);
    if (url.includes('dukascopy')) return new Response('', { status: 404 });
    if (url.includes('/api/v3/klines')) {
      const q = new URL(url).searchParams;
      const start = Number(q.get('startTime'));
      return s.json([[start, '42000', '42100', '41900', '42050', '1']]);
    }
    throw new Error(url);
  });
  const r = await s.call('GET', '/api/market/days?symbol=EURUSD&from=2024-01-13&to=2024-01-15', undefined, admin.token);
  assert.equal(r.status, 200);
  assert.equal(r.data.source, 'dukascopy');
  assert.deepEqual(
    r.data.days.map((d: any) => [d.day, d.bars === null ? 'closed' : d.bars ? d.bars.length : d.error]),
    [
      ['2024-01-13', 'closed'],
      ['2024-01-14', 'closed'],
      ['2024-01-15', 1152],
    ],
  );
  assert.equal(r.data.days[2].bars[0], 1.08, 'prices are divided by the instrument factor');
  assert.equal(seen.filter((u) => u.includes('/2024/00/13/')).length, 0, 'Saturdays are not requested');

  const n = seen.length;
  await s.call('GET', '/api/market/days?symbol=EURUSD&from=2024-01-13&to=2024-01-15', undefined, admin.token);
  assert.equal(seen.length, n, 'second read comes from the disk cache');

  const btc = await s.call('GET', '/api/market/days?symbol=BTCUSD&from=2024-01-01&to=2024-01-04', undefined, admin.token);
  assert.equal(btc.data.source, 'binance');
  assert.equal(btc.data.days.length, 4);
  assert.deepEqual(btc.data.days[0].bars.slice(0, 4), [42000, 42100, 41900, 42050]);
  assert.equal(btc.data.days[1].bars, null);
  assert.equal(seen.filter((u) => u.includes('klines')).length, 2, 'four days take two requests (three per request)');

  assert.equal((await s.call('GET', '/api/market/days?symbol=NOPE&from=2024-01-01&to=2024-01-02', undefined, admin.token)).data.field, 'symbol');
  assert.equal((await s.call('GET', '/api/market/days?symbol=EURUSD&from=2024-01-01&to=2024-03-30', undefined, admin.token)).data.code, 'range');
  const gz = await s.call('GET', '/api/market/days?symbol=EURUSD&from=2024-01-15&to=2024-01-15', undefined, admin.token, { headers: { 'Accept-Encoding': 'gzip' } });
  assert.equal(gz.status, 200);
});

test('market data: Dukascopy data API first, the datafeed when it fails', async () => {
  const { parseDukascopyMinuteBars } = await import('../src/market/sources');
  const bars = parseDukascopyMinuteBars(readFileSync(new URL('./fixtures/EURUSD_2024-01-15_min_1.bi5', import.meta.url)), 1e5)!;
  const seen: string[] = [];
  s.setUpstream((url) => {
    seen.push(url);
    // GBPJPY from the API; XAUUSD's API answer is broken, so its datafeed file is used
    if (url === 'https://jetta.dukascopy.com/v1/candles/minute/GBP-JPY/BID/2024/1/16') return s.json(toApiCandles(bars, Date.UTC(2024, 0, 16), 0.00001));
    if (url.startsWith('https://jetta.dukascopy.com/v1/candles/minute/XAU-USD/BID/2024/1/16')) return new Response('<html>busy</html>', { status: 503 });
    if (url.includes('datafeed.dukascopy.com/datafeed/XAUUSD/2024/00/16/BID_candles_min_1'))
      return new Response(readFileSync(new URL('./fixtures/EURUSD_2024-01-15_min_1.bi5', import.meta.url)));
    throw new Error(url);
  });
  const gj = await s.call('GET', '/api/market/days?symbol=GBPJPY&from=2024-01-16&to=2024-01-16', undefined, admin.token);
  assert.equal(gj.status, 200);
  assert.equal(gj.data.days[0].bars.length, 1152);
  assert.equal(gj.data.days[0].bars[0], 1.08, 'prices use the multiplier sent with the data, not the datafeed factor');
  assert.ok(!seen.some((u) => u.includes('datafeed')), 'the datafeed is not needed');

  const gold = await s.call('GET', '/api/market/days?symbol=XAUUSD&from=2024-01-16&to=2024-01-16', undefined, admin.token);
  assert.equal(gold.data.days[0].bars.length, 1152);
  assert.equal(gold.data.days[0].bars[0], 108, 'datafeed prices use the instrument factor');
  assert.ok(
    seen.some((u) => u.includes('datafeed.dukascopy.com/datafeed/XAUUSD/')),
    'fell back to the datafeed',
  );
});

test('market showcase: real prices for the landing and sign-in pages, without signing in', async () => {
  const bi5 = readFileSync(new URL('./fixtures/EURUSD_2024-01-15_min_1.bi5', import.meta.url));
  s.setUpstream((url) => {
    if (url.includes('jetta.dukascopy.com')) return new Response('', { status: 404 });
    if (url.includes('datafeed.dukascopy.com') && /\/(EURUSD|GBPUSD)\//.test(url)) return new Response(bi5);
    if (url.includes('datafeed.dukascopy.com')) return new Response('', { status: 404 });
    if (url.includes('/api/v3/klines')) {
      const q = new URL(url).searchParams;
      const start = Number(q.get('startTime'));
      return s.json([[start, '42000', '42100', '41900', '42000', '1']]);
    }
    throw new Error(url);
  });
  const r = await s.call('GET', '/api/market/showcase');
  assert.equal(r.status, 200);
  assert.equal(r.data.sample.symbol, 'EURUSD');
  assert.equal(r.data.sample.bars.length, 3 * 276, 'three days of 5-minute bars (the fixture day has 276 traded ones)');
  assert.equal(r.data.sample.bars[0][0], Date.UTC(2024, 2, 4) / 1000);
  const symbols = r.data.quotes.map((q: any) => q.symbol);
  assert.ok(symbols.includes('EURUSD') && symbols.includes('BTCUSD'), symbols.join());
  assert.ok(!symbols.includes('XAUUSD'), 'symbols without data are left out, never made up');
  assert.equal(typeof r.data.quotes[0].change, 'number');
});

test('market data: 1-minute days and 1-second hours', async () => {
  const bi5 = readFileSync(new URL('./fixtures/EURUSD_2024-01-15_min_1.bi5', import.meta.url));
  const ticks = readFileSync(new URL('./fixtures/EURUSD_2024-01-15_10h_ticks.bi5', import.meta.url));
  const seen: string[] = [];
  s.setUpstream((url) => {
    seen.push(url);
    if (url.includes('dukascopy') && url.includes('/EURUSD/2024/00/15/BID_candles_min_1')) return new Response(bi5);
    if (url.includes('dukascopy') && url.includes('/EURUSD/2024/00/15/10h_ticks')) return new Response(ticks);
    if (url.includes('dukascopy')) return new Response('', { status: 404 });
    if (url.includes('/api/v3/klines')) {
      const q = new URL(url).searchParams;
      const start = Number(q.get('startTime'));
      return s.json([[start, '42000', '42100', '41900', '42050', '1']]);
    }
    throw new Error(url);
  });
  const m1 = await s.call('GET', '/api/market/days?symbol=EURUSD&from=2024-01-15&to=2024-01-15&res=1m', undefined, admin.token);
  assert.equal(m1.status, 200);
  assert.equal(m1.data.res, '1m');
  assert.equal(m1.data.days[0].bars.length, 1440 * 4);
  assert.equal(
    (await s.call('GET', '/api/market/days?symbol=EURUSD&from=2024-01-01&to=2024-01-10&res=1m', undefined, admin.token)).data.code,
    'range',
    'at most 7 days of minutes',
  );
  assert.equal((await s.call('GET', '/api/market/days?symbol=EURUSD&from=2024-01-15&to=2024-01-15&res=2m', undefined, admin.token)).data.field, 'res');

  const sec = await s.call('GET', '/api/market/seconds?symbol=EURUSD&from=2024-01-15T09&to=2024-01-15T10', undefined, admin.token);
  assert.equal(sec.status, 200);
  assert.deepEqual(
    sec.data.hours.map((h: any) => [h.hour, h.bars === null ? 'closed' : h.bars ? h.bars.length : h.error]),
    [
      ['2024-01-15T09', 'closed'],
      ['2024-01-15T10', 3600 * 4],
    ],
  );
  const n = seen.length;
  await s.call('GET', '/api/market/seconds?symbol=EURUSD&from=2024-01-15T09&to=2024-01-15T10', undefined, admin.token);
  assert.equal(seen.length, n, 'hours come from the disk cache the second time');
  assert.equal((await s.call('GET', '/api/market/seconds?symbol=EURUSD&from=2024-01-15T00&to=2024-01-15T10', undefined, admin.token)).data.code, 'range', 'at most 6 hours');

  const btc = await s.call('GET', '/api/market/seconds?symbol=BTCUSD&from=2024-01-01T00&to=2024-01-01T00', undefined, admin.token);
  assert.equal(btc.data.source, 'binance');
  assert.deepEqual(btc.data.hours[0].bars.slice(0, 4), [42000, 42100, 41900, 42050]);
  assert.equal(seen.filter((u) => u.includes('interval=1s')).length, 4, 'an hour of seconds takes four requests');
  const btcMin = await s.call('GET', '/api/market/days?symbol=BTCUSD&from=2024-01-02&to=2024-01-02&res=1m', undefined, admin.token);
  assert.equal(btcMin.data.days[0].bars.length, 1440 * 4);
  assert.equal(seen.filter((u) => u.includes('interval=1m')).length, 2, 'a day of minutes takes two requests');
});

test("errors from visitors' browsers are logged", async () => {
  const logged: string[] = [];
  const warn = console.warn;
  console.warn = (...a: unknown[]) => void logged.push(a.join(' '));
  try {
    // sent as text/plain (no CORS preflight), the way the app reports them
    const r = await s.call('POST', '/api/client-errors', JSON.stringify({ message: 'boom\nline 2', stack: 'at x', url: 'https://app.test/#/sessions' }), undefined, {
      headers: { 'Content-Type': 'text/plain' },
    });
    assert.ok(r.status < 300, `status ${r.status}`);
  } finally {
    console.warn = warn;
  }
  assert.equal(logged.length, 1);
  assert.match(logged[0], /^\[client-error\] .*#\/sessions :: boom line 2 :: at x/);
});

test('CORS allows the app origin only', async () => {
  const pre = await s.call('OPTIONS', '/api/me', undefined, undefined, { headers: { Origin: 'https://app.test', 'Access-Control-Request-Method': 'GET' } });
  assert.equal(pre.status, 204);
  assert.equal(pre.headers.get('access-control-allow-origin'), 'https://app.test');
  const other = await s.call('OPTIONS', '/api/me', undefined, undefined, { headers: { Origin: 'https://evil.test' } });
  assert.equal(other.headers.get('access-control-allow-origin'), null);
  assert.equal((await s.call('GET', '/api/nothing')).status, 404);
});
