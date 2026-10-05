import { createServer } from 'node:http';
import { config } from './config';
import { db, flush, loadDb, prune } from './db';
import { flushNews, loadNews, syncNews } from './news';
import { expireStalePayments } from './payments';
import { buildRouter } from './routes';

loadDb();
loadNews();
const router = buildRouter();

const server = createServer((req, res) => void router.handle(req, res));
server.requestTimeout = 60_000;
server.listen(config.port, config.host, () => {
  console.log(`[server] listening on http://${config.host}:${config.port} (app: ${config.appUrl}, data: ${config.dataDir})`);
  if (config.paymentSimulator) console.warn('[server] PAYMENT_SIMULATOR is on: checkouts skip the bank. Turn it off in production.');
  if (config.devOtpEcho) console.warn('[server] OTP_DEV_ECHO is on: sign-in codes are returned to the browser while SMS sending is off.');
  if (!db().users.some((u) => u.role === 'admin') && !config.adminPhones.length) console.warn('[server] no admin yet: set ADMIN_PHONES=09xxxxxxxxx and sign in with that number.');
});

// ---------- background jobs ----------
const every = (ms: number, job: () => unknown) =>
  setInterval(() => {
    try {
      const r = job();
      if (r instanceof Promise) r.catch((e) => console.warn('[job]', (e as Error).message));
    } catch (e) {
      console.warn('[job]', (e as Error).message);
    }
  }, ms).unref();

every(10 * 60_000, () => {
  prune();
  expireStalePayments();
});
every(config.newsSyncMinutes * 60_000, () => (db().settings.newsAutoSync ? syncNews() : undefined));
// first calendar sync shortly after start
setTimeout(() => {
  if (db().settings.newsAutoSync) syncNews().catch((e) => console.warn('[news] first sync failed:', (e as Error).message));
}, 5_000).unref();

function shutdown(signal: string) {
  console.log(`[server] ${signal}: saving and stopping`);
  server.close();
  try {
    flush();
    flushNews();
  } finally {
    process.exit(0);
  }
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
