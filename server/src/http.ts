import { createReadStream } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { gzipSync } from 'node:zlib';
import { allowedOrigins, config } from './config';
import type { AccountUser } from './shared';
import { UpstreamError } from './util';

/** A tiny router: handlers return a value (sent as JSON), a Reply (redirects, HTML) or nothing (204). */

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public field?: string,
  ) {
    super(message);
  }
}

export const badRequest = (code: string, message: string, field?: string) => new HttpError(400, code, message, field);
export const notFound = (message = 'پیدا نشد.') => new HttpError(404, 'not_found', message);

export class Reply {
  constructor(
    public status: number,
    public body: string | Buffer,
    public headers: Record<string, string> = {},
  ) {}
  static redirect(url: string) {
    return new Reply(302, '', { Location: url });
  }
  static html(body: string, status = 200) {
    return new Reply(status, body, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  }
}

/** A file sent from disk in pieces (pictures, videos): one byte range when the browser asks for one. */
export class FileReply {
  constructor(
    public path: string,
    public size: number,
    public headers: Record<string, string> = {},
  ) {}
}

export interface Ctx {
  req: IncomingMessage;
  method: string;
  path: string;
  query: URLSearchParams;
  params: Record<string, string>;
  /** Parsed JSON or form body ({} when empty). */
  body: any;
  ip: string;
  userAgent: string;
  /** Set by requireUser(). */
  user?: AccountUser;
  token?: string;
}

type Handler = (ctx: Ctx) => unknown | Promise<unknown>;
export interface RouteOptions {
  /** Largest request body in bytes (default 1 MB). */
  maxBody?: number;
  /** Leave the body unread: the handler reads ctx.req itself (uploads). */
  raw?: boolean;
}
interface Route {
  method: string;
  parts: string[];
  handler: Handler;
  options: RouteOptions;
}

const MAX_BODY = 1_000_000;

export class Router {
  private routes: Route[] = [];

  on(method: string, path: string, handler: Handler, options: RouteOptions = {}) {
    this.routes.push({ method, parts: path.split('/').filter(Boolean), handler, options });
    return this;
  }
  get = (p: string, h: Handler) => this.on('GET', p, h);
  post = (p: string, h: Handler, o?: RouteOptions) => this.on('POST', p, h, o);
  put = (p: string, h: Handler, o?: RouteOptions) => this.on('PUT', p, h, o);
  delete = (p: string, h: Handler) => this.on('DELETE', p, h);

  private match(method: string, path: string): { route: Route; params: Record<string, string> } | 'method' | null {
    const parts = path.split('/').filter(Boolean);
    let pathMatched = false;
    for (const route of this.routes) {
      if (route.parts.length !== parts.length) continue;
      const params: Record<string, string> = {};
      let ok = true;
      for (let i = 0; i < parts.length; i++) {
        const want = route.parts[i];
        if (want.startsWith(':')) {
          try {
            params[want.slice(1)] = decodeURIComponent(parts[i]);
          } catch {
            ok = false;
            break;
          }
        } else if (want !== parts[i]) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      pathMatched = true;
      if (route.method === method || (method === 'HEAD' && route.method === 'GET')) return { route, params };
    }
    return pathMatched ? 'method' : null;
  }

  async handle(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? '/', 'http://local');
    const method = (req.method ?? 'GET').toUpperCase();
    const origin = req.headers.origin;
    const cors: Record<string, string> = {};
    if (origin && (allowedOrigins().includes(origin) || allowedOrigins().includes('*'))) {
      cors['Access-Control-Allow-Origin'] = origin;
      cors['Vary'] = 'Origin';
      cors['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
      cors['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      cors['Access-Control-Max-Age'] = '600';
    }
    if (method === 'OPTIONS') {
      res.writeHead(204, cors).end();
      return;
    }

    const started = Date.now();
    let status = 200;
    try {
      const found = this.match(method, url.pathname);
      if (!found) throw notFound('مسیر API پیدا نشد.');
      if (found === 'method') throw new HttpError(405, 'method', 'این روش درخواست پشتیبانی نمی‌شود.');
      const ctx: Ctx = {
        req,
        method,
        path: url.pathname,
        query: url.searchParams,
        params: found.params,
        body: found.route.options.raw ? {} : await readBody(req, found.route.options.maxBody),
        ip: clientIp(req),
        userAgent: String(req.headers['user-agent'] ?? '').slice(0, 200),
      };
      const out = await found.route.handler(ctx);
      if (out instanceof FileReply) {
        status = sendFile(req, res, out, cors);
      } else if (out instanceof Reply) {
        status = out.status;
        send(req, res, out.status, out.body, { ...cors, ...out.headers });
      } else if (out === undefined) {
        status = 204;
        res.writeHead(204, cors).end();
      } else {
        send(req, res, 200, JSON.stringify(out), { ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      }
    } catch (e) {
      let err: HttpError;
      if (e instanceof HttpError) err = e;
      else if (e instanceof UpstreamError) err = new HttpError(502, 'upstream', `سرویس بیرونی پاسخ نداد: ${e.message}`);
      else {
        console.error(`[http] ${method} ${url.pathname}`, e);
        err = new HttpError(500, 'error', 'خطای داخلی سرور. دوباره تلاش کنید.');
      }
      status = err.status;
      send(req, res, err.status, JSON.stringify({ code: err.code, message: err.message, field: err.field }), { ...cors, 'Content-Type': 'application/json; charset=utf-8' });
    } finally {
      if (!config.production || status >= 500) console.log(`${method} ${url.pathname} ${status} ${Date.now() - started}ms`);
    }
  }
}

function send(req: IncomingMessage, res: ServerResponse, status: number, body: string | Buffer, headers: Record<string, string>) {
  const h: Record<string, string> = { 'X-Content-Type-Options': 'nosniff', ...headers };
  let data = typeof body === 'string' ? Buffer.from(body) : body;
  if (data.length > 1024 && /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''))) {
    data = gzipSync(data, { level: 6 });
    h['Content-Encoding'] = 'gzip';
    h['Vary'] = h['Vary'] ? `${h['Vary']}, Accept-Encoding` : 'Accept-Encoding';
  }
  h['Content-Length'] = String(data.length);
  res.writeHead(status, h);
  res.end(req.method === 'HEAD' ? undefined : data);
}

/**
 * Behind a reverse proxy, the address the proxy saw. The leftmost X-Forwarded-For entry comes from
 * the visitor and can be forged, so this reads X-Real-IP (set by nginx) or the entry the proxy added last.
 */
function clientIp(req: IncomingMessage): string {
  if (config.trustProxy) {
    const real = String(req.headers['x-real-ip'] ?? '').trim();
    if (real) return real;
    const fwd = String(req.headers['x-forwarded-for'] ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .pop();
    if (fwd) return fwd;
  }
  return req.socket.remoteAddress ?? '';
}

/** Streams a file; answers a `Range: bytes=a-b` request with that part (206), as video players need to seek. */
function sendFile(req: IncomingMessage, res: ServerResponse, f: FileReply, cors: Record<string, string>): number {
  const h: Record<string, string> = { 'X-Content-Type-Options': 'nosniff', 'Accept-Ranges': 'bytes', ...cors, ...f.headers };
  let start = 0;
  let end = f.size - 1;
  let status = 200;
  const m = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range ?? '').trim());
  if (m && (m[1] || m[2])) {
    if (m[1]) {
      start = Number(m[1]);
      if (m[2]) end = Math.min(Number(m[2]), f.size - 1);
    } else start = Math.max(0, f.size - Number(m[2]));
    if (start > end || start >= f.size) {
      res.writeHead(416, { ...h, 'Content-Range': `bytes */${f.size}` }).end();
      return 416;
    }
    status = 206;
    h['Content-Range'] = `bytes ${start}-${end}/${f.size}`;
  }
  h['Content-Length'] = String(end - start + 1);
  res.writeHead(status, h);
  if (req.method === 'HEAD' || f.size === 0) {
    res.end();
    return status;
  }
  const stream = createReadStream(f.path, { start, end });
  stream.on('error', () => res.destroy());
  stream.pipe(res);
  return status;
}

async function readBody(req: IncomingMessage, max = MAX_BODY): Promise<any> {
  if (req.method === 'GET' || req.method === 'HEAD') return {};
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > max) throw new HttpError(413, 'too_large', 'حجم درخواست بیش از حد مجاز است.');
    chunks.push(chunk as Buffer);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return {};
  const type = String(req.headers['content-type'] ?? '');
  if (type.includes('application/x-www-form-urlencoded')) return Object.fromEntries(new URLSearchParams(text));
  try {
    return JSON.parse(text);
  } catch {
    throw badRequest('bad_json', 'بدنه‌ی درخواست JSON معتبر نیست.');
  }
}

// ---------- input helpers ----------
export function str(v: unknown, field: string, { min = 0, max = 500, label = field }: { min?: number; max?: number; label?: string } = {}): string {
  const s = typeof v === 'string' ? v.trim() : v === undefined || v === null ? '' : String(v).trim();
  if (s.length < min) throw badRequest('invalid', min <= 1 ? `${label} را وارد کنید.` : `${label} باید دست‌کم ${min} حرف باشد.`, field);
  if (s.length > max) throw badRequest('invalid', `${label} حداکثر ${max} حرف است.`, field);
  return s;
}

export function num(
  v: unknown,
  field: string,
  { min = -Infinity, max = Infinity, int = false, label = field }: { min?: number; max?: number; int?: boolean; label?: string } = {},
): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n) || (int && !Number.isInteger(n)) || n < min || n > max) throw badRequest('invalid', `${label} معتبر نیست.`, field);
  return n;
}

export const bool = (v: unknown) => v === true || v === 'true' || v === 1 || v === '1';

export function oneOf<T extends string>(v: unknown, allowed: readonly T[], field: string): T {
  if (typeof v !== 'string' || !allowed.includes(v as T)) throw badRequest('invalid', `مقدار ${field} معتبر نیست.`, field);
  return v as T;
}

/** Fixed-window rate limit per key. Throws 429 when exceeded. */
const buckets = new Map<string, { count: number; resetAt: number }>();
export function rateLimit(key: string, max: number, windowMs: number, message = 'تعداد درخواست‌ها زیاد است؛ چند دقیقه بعد دوباره تلاش کنید.') {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  b.count++;
  if (b.count > max) throw new HttpError(429, 'rate_limited', message);
}
/** Throws 429 when `key` already reached `max` in its window, without counting this call (failures are counted with rateLimit). */
export function checkRateLimit(key: string, max: number, message?: string) {
  const b = buckets.get(key);
  if (b && b.resetAt >= Date.now() && b.count >= max) throw new HttpError(429, 'rate_limited', message ?? 'تعداد درخواست‌ها زیاد است؛ چند دقیقه بعد دوباره تلاش کنید.');
}
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
}, 60_000).unref();
