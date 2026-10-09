import { createWriteStream, existsSync, mkdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { config } from './config';
import { db, save, type StoredMedia } from './db';
import { FileReply, HttpError, badRequest, bool, notFound, oneOf, rateLimit, type Ctx } from './http';
import { MEDIA_MAX_BYTES, MEDIA_TYPES, type AccountUser, type Announcement, type AnnouncementMedia } from './shared';
import { announcementError, announcementVisible } from '../../src/services/announcements';
import { clone, todayKey, uid } from './util';

/**
 * Messages the admin writes for visitors, shown once as a popup on the website and/or the dashboard,
 * with an optional uploaded picture or video (kept in DATA_DIR/media and streamed with byte ranges).
 */

const MEDIA_DIR = () => join(config.dataDir, 'media');
const mediaPath = (m: Pick<StoredMedia, 'id'>) => join(MEDIA_DIR(), m.id);
const mediaUrl = (id: string) => `/api/media/${id}`;

export const toMedia = (m: StoredMedia): AnnouncementMedia => ({ id: m.id, kind: m.kind, mime: m.mime, size: m.size, name: m.name, url: mediaUrl(m.id) });

/** Other features that keep uploaded files (the blog): each lists the file ids it still uses. */
const mediaUsers: (() => Iterable<string>)[] = [];
export const registerMediaUser = (fn: () => Iterable<string>) => void mediaUsers.push(fn);

// ---------- admin ----------

export function adminAnnouncements(): Announcement[] {
  return clone(db().announcements);
}

/** PUT /api/admin/announcements/:id (creates it when the id is new). `showAgain` makes people who closed it see it once more. */
export function saveAnnouncement(id: string, b: any): Announcement {
  const d = db();
  const title = String(b.title ?? '').trim();
  const body = String(b.body ?? '').trim();
  const button = b.button && (b.button.label || b.button.url) ? { label: String(b.button.label ?? '').trim(), url: String(b.button.url ?? '').trim() } : undefined;
  const startsAt = typeof b.startsAt === 'string' && b.startsAt ? b.startsAt : undefined;
  const endsAt = typeof b.endsAt === 'string' && b.endsAt ? b.endsAt : undefined;
  const bad = announcementError({ id, title, body, button, startsAt, endsAt });
  if (bad) throw badRequest('invalid', bad.message, bad.field);
  let media: AnnouncementMedia | undefined;
  if (b.mediaId) {
    const m = d.media.find((x) => x.id === b.mediaId);
    if (!m) throw badRequest('invalid', 'فایل پیدا نشد؛ دوباره بارگذاری کنید.', 'media');
    media = toMedia(m);
  }
  const prev = d.announcements.find((a) => a.id === id);
  const now = Date.now();
  const next: Announcement = {
    id,
    title,
    body,
    media,
    button,
    audience: oneOf(b.audience ?? 'everyone', ['everyone', 'users'] as const, 'audience'),
    placement: oneOf(b.placement ?? 'both', ['site', 'app', 'both'] as const, 'placement'),
    startsAt,
    endsAt,
    active: bool(b.active),
    version: (prev?.version ?? 0) + (prev && bool(b.showAgain) ? 1 : 0) || 1,
    views: prev?.views ?? 0,
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
  };
  if (prev) d.announcements[d.announcements.indexOf(prev)] = next;
  else d.announcements.unshift(next);
  dropUnusedMedia();
  save();
  return clone(next);
}

export function deleteAnnouncement(id: string): Announcement | undefined {
  const d = db();
  const a = d.announcements.find((x) => x.id === id);
  d.announcements = d.announcements.filter((x) => x.id !== id);
  dropUnusedMedia();
  save();
  return a;
}

/** Files no message or post uses any more (uploads younger than a day are kept: the admin may still be writing). */
export function dropUnusedMedia() {
  const d = db();
  const used = new Set<string>(d.announcements.map((a) => a.media?.id).filter((id): id is string => !!id));
  for (const fn of mediaUsers) for (const id of fn()) used.add(id);
  const old = Date.now() - 86_400_000;
  for (const m of d.media.filter((x) => !used.has(x.id) && x.createdAt < old)) rmSync(mediaPath(m), { force: true });
  d.media = d.media.filter((x) => used.has(x.id) || x.createdAt >= old);
}

/** POST /api/admin/media?name=…: the raw file in the body, its type in Content-Type. Streamed to disk. */
export async function uploadMedia(ctx: Ctx): Promise<AnnouncementMedia> {
  const mime = String(ctx.req.headers['content-type'] ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  const kind = MEDIA_TYPES[mime];
  if (!kind) throw badRequest('type', 'فقط تصویر (JPG، PNG، WebP، GIF) یا ویدیو (MP4، WebM، MOV) پذیرفته می‌شود.', 'media');
  const max = MEDIA_MAX_BYTES[kind];
  const tooBig = () => new HttpError(413, 'too_large', `حداکثر حجم ${kind === 'image' ? 'تصویر' : 'ویدیو'} ${Math.round(max / 1024 / 1024)} مگابایت است.`, 'media');
  const declared = Number(ctx.req.headers['content-length'] ?? 0);
  if (declared > max) throw tooBig();
  mkdirSync(MEDIA_DIR(), { recursive: true });
  const id = uid('m');
  const tmp = `${mediaPath({ id })}.part`;
  let size = 0;
  const counter = new Transform({
    transform(chunk: Buffer, _enc, done) {
      size += chunk.length;
      done(size > max ? tooBig() : null, chunk);
    },
  });
  try {
    await pipeline(ctx.req, counter, createWriteStream(tmp));
  } catch (e) {
    rmSync(tmp, { force: true });
    throw e instanceof HttpError ? e : badRequest('upload', 'بارگذاری فایل کامل نشد؛ دوباره تلاش کنید.', 'media');
  }
  if (!size) {
    rmSync(tmp, { force: true });
    throw badRequest('empty', 'فایل خالی است.', 'media');
  }
  renameSync(tmp, mediaPath({ id }));
  const name =
    String(ctx.query.get('name') ?? '')
      .replace(/[^\p{L}\p{N} ._-]/gu, '')
      .slice(0, 80) || `${kind}`;
  const m: StoredMedia = { id, kind, mime, size, name, createdAt: Date.now() };
  db().media.push(m);
  save();
  return toMedia(m);
}

// ---------- visitors ----------

/** GET /api/media/:id */
export function serveMedia(id: string): FileReply {
  const m = db().media.find((x) => x.id === id);
  const path = m && mediaPath(m);
  if (!m || !path || !existsSync(path)) throw notFound('فایل پیدا نشد.');
  return new FileReply(path, statSync(path).size, {
    'Content-Type': m.mime,
    // ids are never reused, so the file can be cached for good
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Disposition': 'inline',
  });
}

/** GET /api/announcements?placement=site|app: the messages this visitor should see there now. */
export function visibleAnnouncements(user: AccountUser | undefined, placement: string): Announcement[] {
  const where = placement === 'app' ? 'app' : 'site';
  const today = todayKey();
  return clone(db().announcements.filter((a) => announcementVisible(a, where, !!user, today))).map((a) => ({ ...a, views: 0 }));
}

/** POST /api/announcements/:id/view: counted once per address per message every 6 hours. */
export function countView(ctx: Ctx, id: string) {
  const a = db().announcements.find((x) => x.id === id);
  if (!a) throw notFound('پیام پیدا نشد.');
  try {
    rateLimit(`ann-view:${id}:${ctx.ip}`, 1, 6 * 3_600_000);
  } catch {
    return;
  }
  a.views++;
  save();
}
