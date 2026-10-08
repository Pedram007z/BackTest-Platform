import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** Server settings from the environment (and `server/.env` when present). See `.env.example`. */

if (existsSync('.env')) {
  try {
    process.loadEnvFile('.env');
  } catch (e) {
    console.warn('[config] could not read .env:', (e as Error).message);
  }
}

const env = (k: string, fallback = '') => (process.env[k] ?? fallback).trim();
const bool = (k: string, fallback: boolean) => {
  const v = env(k).toLowerCase();
  if (!v) return fallback;
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
};
const int = (k: string, fallback: number) => {
  const n = Number(env(k));
  return Number.isFinite(n) && env(k) !== '' ? Math.floor(n) : fallback;
};
const list = (k: string) =>
  env(k)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const production = env('NODE_ENV') === 'production';
const port = int('PORT', 8787);

export const config = {
  production,
  port,
  host: env('HOST', '0.0.0.0'),
  /** Where the web app is served, e.g. https://backtestlab.ir. Payment callbacks send the browser back here. */
  appUrl: env('APP_URL', 'http://localhost:5173').replace(/\/$/, ''),
  /** Public address of this API server; gateways call `${publicUrl}/api/payments/callback/...`. */
  publicUrl: env('PUBLIC_URL', `http://localhost:${port}`).replace(/\/$/, ''),
  /** Allowed browser origins (comma separated). Defaults to APP_URL plus the Vite dev server. */
  corsOrigins: list('CORS_ORIGINS'),
  dataDir: resolve(env('DATA_DIR', './data')),
  /** Phones that are made admins when they sign in (comma separated, 09xxxxxxxxx). */
  adminPhones: list('ADMIN_PHONES'),
  /** An admin who signs in with a username and password (make-admin.sh --username sets both). */
  adminUsername: env('ADMIN_USERNAME').toLowerCase(),
  adminPasswordHash: env('ADMIN_PASSWORD_HASH'),
  /**
   * The secret part of the admin sign-in address (APP_URL/k/<key>); without it the address and the
   * admin sign-in API answer "not found". Empty: a random key made on first start and kept in db.json.
   */
  adminLoginKey: env('ADMIN_LOGIN_KEY'),
  /** Read X-Forwarded-For (behind nginx / a load balancer). */
  trustProxy: bool('TRUST_PROXY', false),
  /** Return the sign-in code in the API response while real SMS sending is off. Never enable on a public server. */
  devOtpEcho: bool('OTP_DEV_ECHO', !production),
  /** Skip the bank and complete payments on a local test page. For development only. */
  paymentSimulator: bool('PAYMENT_SIMULATOR', !production),
  sessionDays: int('SESSION_DAYS', 30),
  /** Upstream hosts; point them at a mirror or relay if the server cannot reach them directly. */
  forexFactoryUrl: env('FF_BASE_URL', 'https://www.forexfactory.com').replace(/\/$/, ''),
  forexFactoryFeedUrl: env('FF_FEED_URL', 'https://nfs.faireconomy.media/ff_calendar_thisweek.json'),
  /** Dukascopy's data API (JSON); `off` uses only the older datafeed files below. */
  dukascopyApiUrl: env('DUKASCOPY_API_URL', 'https://jetta.dukascopy.com/v1').replace(/\/$/, ''),
  dukascopyUrl: env('DUKASCOPY_URL', 'https://datafeed.dukascopy.com/datafeed').replace(/\/$/, ''),
  /** Most requests a second to Dukascopy; its firewall blocks an address that sends too many for a while. */
  dukascopyRate: Math.max(1, int('DUKASCOPY_RATE', 10)),
  binanceUrl: env('BINANCE_URL', 'https://data-api.binance.vision').replace(/\/$/, ''),
  /** Binance's history archives (monthly and daily ZIP files), used by the downloader. */
  binanceVisionUrl: env('BINANCE_VISION_URL', 'https://data.binance.vision').replace(/\/$/, ''),
  /**
   * QVeris (qveris.ai), a paid gateway to EODHD's 1-minute history and live quotes; optional. Without a
   * key it is never called. The key stays on the server; the admin sets a daily credit limit.
   */
  qverisApiKey: env('QVERIS_API_KEY'),
  qverisUrl: env('QVERIS_URL', 'https://qveris.ai/api/v1').replace(/\/$/, ''),
  /** Large QVeris results are files on https://oss.qveris.ai; set this to fetch them through a relay. */
  qverisFilesUrl: env('QVERIS_FILES_URL').replace(/\/$/, ''),
  /**
   * Ready-made market history (admin panel → import): a GitHub repository branch holding
   * store/<SYMBOL>/<YYYY>-<MM>.m1. A token is needed only when the repository is private.
   */
  marketDataRepo: env('MARKET_DATA_REPO', 'Pedram007z/BackTest-Platform'),
  marketDataBranch: env('MARKET_DATA_BRANCH', 'market-data'),
  marketDataToken: env('MARKET_DATA_TOKEN'),
  githubApiUrl: env('GITHUB_API_URL', 'https://api.github.com').replace(/\/$/, ''),
  githubRawUrl: env('GITHUB_RAW_URL', 'https://raw.githubusercontent.com').replace(/\/$/, ''),
  /**
   * Financial Modeling Prep (paid, optional): the economic calendar's history, for the weeks
   * ForexFactory does not give a server (admin panel → economic calendar → history).
   */
  fmpApiKey: env('FMP_API_KEY'),
  fmpUrl: env('FMP_URL', 'https://financialmodelingprep.com').replace(/\/$/, ''),
  /** Hourly refresh of the current calendar week. */
  newsSyncMinutes: int('NEWS_SYNC_MINUTES', 60),
  upstreamTimeoutMs: int('UPSTREAM_TIMEOUT_MS', 15_000),
};

export type Config = typeof config;

export function allowedOrigins(): string[] {
  if (config.corsOrigins.length) return config.corsOrigins;
  const out = [new URL(config.appUrl).origin];
  if (!config.production) out.push('http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173');
  return out;
}
