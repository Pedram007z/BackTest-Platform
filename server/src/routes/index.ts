import { adminGate, adminLogin, logout, optionalUser, requestOtp, requireUser, verifyOtp } from '../auth';
import { db, save } from '../db';
import { HttpError, Router, badRequest, notFound, rateLimit, str } from '../http';
import { marketConfig, marketDays, marketSeconds, marketShowcase } from '../market';
import { eventsBetween } from '../news';
import { checkDiscount, checkout, enabledGateways, handleCallback, publicPayment, simulatorComplete, simulatorPage } from '../payments';
import { cancelTransfer, expireTransfers, reportTransfer } from '../payments/card';
import type { Ticket } from '../shared';
import { DAY_MS, clone, uid } from '../util';
import { adminRoutes } from './admin';
import { countView, serveMedia, visibleAnnouncements } from '../announcements';
import { syncCheck, syncUpload } from '../backtests';

export function buildRouter(): Router {
  const r = new Router();

  // ---------- public ----------
  r.get('/api/health', () => ({ ok: true, time: Date.now() }));
  // Errors a visitor's browser hit (the app reports them), so a page that went blank on someone's machine shows in the log.
  r.post('/api/client-errors', (ctx) => {
    rateLimit(`client-error:${ctx.ip}`, 20, 10 * 60_000);
    const s = (v: unknown, max: number) => (typeof v === 'string' ? v : '').replace(/\s+/g, ' ').slice(0, max);
    console.warn(`[client-error] ${ctx.ip} ${s(ctx.body.url, 200)} :: ${s(ctx.body.message, 300)} :: ${s(ctx.body.stack, 800)} :: ${ctx.userAgent}`);
    return undefined;
  });
  r.get('/api/config', () => {
    const s = db().settings;
    return {
      siteName: s.siteName,
      registrationOpen: s.registrationOpen,
      maintenance: s.maintenance,
      supportPhone: s.supportPhone,
      enabledSymbols: s.enabledSymbols,
      /** symbol → 'dukascopy' | 'binance' */
      market: marketConfig(),
    };
  });
  r.get('/api/market/showcase', (ctx) => {
    rateLimit(`showcase:${ctx.ip}`, 60, 60_000);
    return marketShowcase();
  });
  r.get('/api/plans', () =>
    clone(
      db()
        .plans.filter((p) => p.active)
        .sort((a, b) => a.sort - b.sort),
    ),
  );

  // ---------- sign-in ----------
  r.post('/api/auth/otp', requestOtp);
  r.post('/api/auth/verify', verifyOtp);
  r.post('/api/auth/admin-gate', adminGate);
  r.post('/api/auth/admin-login', adminLogin);
  r.post('/api/auth/logout', (ctx) => logout(ctx));

  // ---------- account ----------
  r.get('/api/me', (ctx) => clone(requireUser(ctx)));
  r.put('/api/me', (ctx) => {
    const u = requireUser(ctx);
    if (ctx.body.name !== undefined) u.name = str(ctx.body.name, 'name', { min: 2, max: 60, label: 'نام' });
    save();
    return clone(u);
  });
  r.get('/api/me/payments', (ctx) => {
    const u = requireUser(ctx);
    expireTransfers();
    return db()
      .payments.filter((p) => p.userId === u.id)
      .map(publicPayment);
  });
  r.get('/api/me/tickets', (ctx) => {
    const u = requireUser(ctx);
    return clone(db().tickets.filter((t) => t.userId === u.id));
  });
  r.post('/api/me/tickets', (ctx) => {
    const u = requireUser(ctx);
    const d = db();
    if (d.tickets.filter((t) => t.userId === u.id && t.status === 'open').length >= 10) throw badRequest('too_many', 'ده تیکت باز دارید؛ صبر کنید تا پاسخ داده شوند.');
    const now = Date.now();
    const t: Ticket = {
      id: uid('tk'),
      userId: u.id,
      userName: u.name,
      subject: str(ctx.body.subject, 'subject', { min: 3, max: 120, label: 'موضوع' }),
      status: 'open',
      priority: 'normal',
      messages: [{ from: 'user', text: str(ctx.body.text, 'text', { min: 1, max: 4000, label: 'متن پیام' }), at: now }],
      createdAt: now,
      updatedAt: now,
    };
    d.tickets.unshift(t);
    save();
    return clone(t);
  });
  r.post('/api/me/tickets/:id/reply', (ctx) => {
    const u = requireUser(ctx);
    const t = db().tickets.find((x) => x.id === ctx.params.id && x.userId === u.id);
    if (!t) throw notFound('تیکت پیدا نشد.');
    t.messages.push({ from: 'user', text: str(ctx.body.text, 'text', { min: 1, max: 4000, label: 'متن پیام' }), at: Date.now() });
    t.status = 'open';
    t.updatedAt = Date.now();
    save();
    return clone(t);
  });

  // ---------- a copy of the user's backtests for the admin panel (the app syncs it) ----------
  r.post('/api/me/backtests/check', (ctx) => {
    const u = requireUser(ctx);
    rateLimit(`bt-check:${u.id}`, 600, 10 * 60_000);
    return syncCheck(u, ctx.body);
  });
  r.put(
    '/api/me/backtests',
    (ctx) => {
      const u = requireUser(ctx);
      rateLimit(`bt-sync:${u.id}`, 120, 10 * 60_000);
      return syncUpload(ctx, u);
    },
    { maxBody: 8_000_000 },
  );

  // ---------- announcements (popup messages) and their pictures / videos ----------
  r.get('/api/announcements', (ctx) => visibleAnnouncements(optionalUser(ctx), ctx.query.get('placement') ?? 'site'));
  r.post('/api/announcements/:id/view', (ctx) => countView(ctx, ctx.params.id));
  r.get('/api/media/:id', (ctx) => serveMedia(ctx.params.id));

  // ---------- payments ----------
  r.get('/api/payments/gateways', () => enabledGateways());
  // signed in: first-purchase-only codes are checked against the user's purchases right away
  r.post('/api/payments/discount', (ctx) => checkDiscount(ctx.body, optionalUser(ctx)));
  r.post('/api/payments/checkout', (ctx) => checkout(requireUser(ctx), ctx.body));
  for (const method of ['GET', 'POST']) {
    r.on(method, '/api/payments/callback/:gateway', (ctx) => handleCallback(ctx.params.gateway, ctx.query, ctx.body));
  }
  r.get('/api/payments/simulate/:id', (ctx) => simulatorPage(ctx.params.id));
  r.post('/api/payments/simulate/:id', (ctx) => simulatorComplete(ctx.params.id, ctx.body.action));
  // card to card: the payer reports the transfer as sent, or gives up on it
  r.post('/api/payments/:id/sent', (ctx) => publicPayment(reportTransfer(requireUser(ctx), ctx.params.id, ctx.body)));
  r.post('/api/payments/:id/cancel', (ctx) => publicPayment(cancelTransfer(requireUser(ctx), ctx.params.id)));
  r.get('/api/payments/:id', (ctx) => {
    const u = requireUser(ctx);
    expireTransfers();
    const p = db().payments.find((x) => x.id === ctx.params.id);
    if (!p || (p.userId !== u.id && u.role !== 'admin')) throw notFound('تراکنش پیدا نشد.');
    return publicPayment(p);
  });

  // ---------- replay data ----------
  r.get('/api/news', async (ctx) => {
    requireUser(ctx);
    const from = Number(ctx.query.get('from'));
    const to = Number(ctx.query.get('to'));
    if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) throw badRequest('range', 'بازه‌ی زمانی معتبر نیست.');
    if (to - from > 12 * 7 * DAY_MS) throw badRequest('range', 'بازه حداکثر ۱۲ هفته است.');
    return eventsBetween(from, to);
  });
  r.get('/api/market/days', (ctx) => {
    requireUser(ctx);
    return marketDays(ctx.query);
  });
  r.get('/api/market/seconds', (ctx) => {
    requireUser(ctx);
    return marketSeconds(ctx.query);
  });

  adminRoutes(r);

  r.get('/', () => {
    throw new HttpError(404, 'not_found', 'این سرور فقط API است؛ برنامه را از آدرس سایت باز کنید.');
  });
  return r;
}
