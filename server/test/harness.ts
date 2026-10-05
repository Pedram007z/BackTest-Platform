import { mkdtempSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Starts the API on a random port with an empty data directory. Calls to outside services
 * (SMS providers, banks, ForexFactory, Binance, Dukascopy) go to `upstream`, which tests replace.
 * Each test file runs in its own process, so env set here applies to the whole file.
 */
export async function startServer(env: Record<string, string> = {}) {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    DATA_DIR: mkdtempSync(join(tmpdir(), 'bt-api-')),
    APP_URL: 'https://app.test',
    PUBLIC_URL: 'https://api.test',
    ADMIN_PHONES: '09120000001',
    ...env,
  });
  const realFetch = globalThis.fetch;
  const calls: { url: string; init?: RequestInit; body?: string }[] = [];
  let upstream: (url: string, init?: RequestInit) => Response | Promise<Response> = (url) => {
    throw new TypeError(`unexpected upstream call: ${url}`);
  };
  let base = '';
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (base && url.startsWith(base)) return realFetch(input, init);
    calls.push({ url, init, body: typeof init?.body === 'string' ? init.body : undefined });
    return upstream(url, init);
  }) as typeof fetch;

  const { createServer } = await import('node:http');
  const { loadDb, db, flush } = await import('../src/db');
  const { loadNews } = await import('../src/news');
  const { buildRouter } = await import('../src/routes');
  loadDb();
  loadNews();
  const router = buildRouter();
  const server = createServer((req, res) => void router.handle(req, res));
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  async function call<T = any>(method: string, path: string, body?: unknown, token?: string, extra: RequestInit = {}) {
    const headers: Record<string, string> = { ...(extra.headers as Record<string, string>) };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined && typeof body !== 'string') headers['Content-Type'] = 'application/json';
    const res = await realFetch(base + path, {
      ...extra,
      method,
      headers,
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
      redirect: 'manual',
    });
    const text = await res.text();
    let data: any = text;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      /* HTML or empty */
    }
    return { status: res.status, data: data as T, headers: res.headers };
  }

  /** Sign in (new accounts get `name`). */
  async function signIn(phone: string, name = 'کاربر آزمایشی') {
    const otp = await call('POST', '/api/auth/otp', { phone });
    if (otp.status !== 200) throw new Error(`otp ${otp.status} ${JSON.stringify(otp.data)}`);
    const v = await call('POST', '/api/auth/verify', { phone, code: otp.data.devCode, name });
    if (v.status !== 200) throw new Error(`verify ${v.status} ${JSON.stringify(v.data)}`);
    return v.data as { token: string; user: any; isNew: boolean };
  }

  return {
    call,
    signIn,
    db,
    calls,
    setUpstream: (fn: typeof upstream) => (upstream = fn),
    json: (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } }),
    stop: () =>
      new Promise<void>((r) => {
        flush();
        server.close(() => r());
        globalThis.fetch = realFetch;
      }),
  };
}
