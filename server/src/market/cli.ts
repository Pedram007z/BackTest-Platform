import { config } from '../config';
import { loadDb } from '../db';
import { HISTORY_START, currentDownload, downloadFinished, startDownload, stopDownload } from './download';
import { storeDir } from './store';

const HELP = `Downloads market history into the data folder, where the API server reads it.

  node server.mjs download [options]

  --symbols=EURUSD,XAUUSD   symbols (default: all)
  --from=2015-01-01         first day (default: ${HISTORY_START}, or the symbol's first day)
  --to=2026-01-31           last day (default: yesterday)
  --seconds                 1-second bars instead of 1-minute bars (needs --symbols, at most 92 days)
  --data-dir=PATH           data folder (default: DATA_DIR, or ./data)

Days already downloaded are skipped, so the command can be stopped (Ctrl+C) and run again.
The sources are Dukascopy and Binance (DUKASCOPY_API_URL, DUKASCOPY_URL, BINANCE_URL and
BINANCE_VISION_URL change their addresses). To fill a server that cannot reach them, run this on
another computer and copy the folder <data folder>/market/store to the server.`;

const flag = (args: string[], name: string) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

export async function runDownloadCli(args: string[]): Promise<number> {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(HELP);
    return 0;
  }
  loadDb({ write: false });
  let job;
  try {
    job = startDownload({
      kind: args.includes('--seconds') ? 's1' : 'm1',
      symbols: flag(args, 'symbols')
        ?.split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
      from: flag(args, 'from'),
      to: flag(args, 'to'),
      by: 'cli',
    });
  } catch (e) {
    console.error((e as Error).message);
    return 1;
  }
  console.log(`Downloading ${job.kind === 's1' ? '1-second' : '1-minute'} bars of ${job.symbols.length} symbols, ${job.from} to ${job.to}, into ${storeDir()}`);
  const started = Date.now();
  const timer = setInterval(() => {
    const j = currentDownload();
    if (!j || !j.total) return;
    const pct = Math.floor((j.done / j.total) * 100);
    console.log(`${pct}%  ${j.current ?? ''}  stored ${j.stored}, closed ${j.closed}, failed ${j.failed}  (${Math.round((Date.now() - started) / 60_000)} min)`);
  }, 10_000);
  const stop = () => {
    console.log('Stopping after the months being downloaded…');
    stopDownload();
  };
  process.once('SIGINT', stop);
  const end = await downloadFinished();
  clearInterval(timer);
  console.log(`\n${end.state}: ${end.stored} days stored, ${end.closed} closed, ${end.failed} failed, ${end.later} not published yet.`);
  for (const e of end.errors.slice(-10)) console.log(`  ${e.symbol} ${e.day}: ${e.error}`);
  if (end.message) console.log(end.message);
  console.log(`Data folder: ${config.dataDir}`);
  return end.state === 'done' && end.failed === 0 ? 0 : 1;
}
