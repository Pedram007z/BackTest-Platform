import { db, save } from './db';
import { notFound, type Ctx } from './http';
import type { AccountUser, ActivityQuery, LoginEvent, LoginEventKind, Page, UserDevice } from './shared';
import { uid } from './util';

/** Sign-ins and sign-outs with the address and browser they came from (newest first, the last 10 000). */

export const LOGIN_LOG_MAX = 10_000;

export function logLogin(ctx: Ctx, user: AccountUser, kind: LoginEventKind, method?: LoginEvent['method']) {
  const d = db();
  d.loginLog.unshift({ id: uid('le'), userId: user.id, userName: user.name, phone: user.phone, kind, method, at: Date.now(), ip: ctx.ip, userAgent: ctx.userAgent });
  if (d.loginLog.length > LOGIN_LOG_MAX) d.loginLog.length = LOGIN_LOG_MAX;
  save();
}

const PAGE = 50;

export function activityList(q: ActivityQuery): Page<LoginEvent> {
  const term = (q.q ?? '').trim().toLowerCase();
  const rows = db().loginLog.filter(
    (e) =>
      (!q.userId || e.userId === q.userId) && (!q.kind || e.kind === q.kind) && (!term || [e.userName, e.phone, e.ip, e.userAgent].some((v) => v.toLowerCase().includes(term))),
  );
  const page = Math.max(1, Number(q.page) || 1);
  return { items: rows.slice((page - 1) * PAGE, page * PAGE), total: rows.length };
}

/** A device is a sign-in session; its id is the start of the stored hash (never the token itself). */
const deviceId = (key: string) => key.slice(0, 16);

export function userDevices(userId: string): UserDevice[] {
  const now = Date.now();
  return Object.entries(db().sessions)
    .filter(([, s]) => s.userId === userId && s.expiresAt > now)
    .map(([k, s]) => ({ id: deviceId(k), createdAt: s.createdAt, lastSeenAt: s.lastSeenAt, expiresAt: s.expiresAt, ip: s.ip ?? '', userAgent: s.userAgent ?? '' }))
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt);
}

/** Signs the user out on one device, or on all of them (`id` omitted). Returns how many. */
export function signOutDevices(user: AccountUser, id?: string): number {
  const d = db();
  const keys = Object.entries(d.sessions)
    .filter(([k, s]) => s.userId === user.id && (!id || deviceId(k) === id))
    .map(([k]) => k);
  if (id && !keys.length) throw notFound('این دستگاه دیگر وارد نیست.');
  for (const k of keys) {
    const s = d.sessions[k];
    d.loginLog.unshift({
      id: uid('le'),
      userId: user.id,
      userName: user.name,
      phone: user.phone,
      kind: 'signed_out_by_admin',
      at: Date.now(),
      ip: s.ip ?? '',
      userAgent: s.userAgent ?? '',
    });
    delete d.sessions[k];
  }
  if (d.loginLog.length > LOGIN_LOG_MAX) d.loginLog.length = LOGIN_LOG_MAX;
  save();
  return keys.length;
}
