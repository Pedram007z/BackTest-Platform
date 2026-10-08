import clsx from 'clsx';
import { CircleStop, CloudDownload, Download, HardDrive, Timer } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { addDays, fmtDay, localDayKey, type DayKey } from '../../lib/calendar';
import { faDigits, fmtNum } from '../../lib/format';
import { SYMBOLS, SYMBOL_MAP } from '../../lib/market';
import { BackendError, backend } from '../../services';
import type { MarketDownloadJob, MarketImportJob, MarketImportStatus, MarketStorage } from '../../services/types';
import { DatePicker } from '../ui/DatePicker';
import { Meter, Select, Toggle } from '../ui/controls';
import { Badge, act, dateTime } from './kit';

const fmtBytes = (b: number) => (b >= 1e9 ? `${fmtNum(b / 1e9, 2)} گیگابایت` : `${fmtNum(b / 1e6, 1)} مگابایت`);
const STATE: Record<MarketDownloadJob['state'], { label: string; tone: 'gain' | 'loss' | 'amber' | 'accent' }> = {
  running: { label: 'در حال دانلود', tone: 'accent' },
  done: { label: 'تمام شد', tone: 'gain' },
  stopped: { label: 'متوقف شد', tone: 'amber' },
  failed: { label: 'ناموفق', tone: 'loss' },
};
const BY: Record<MarketDownloadJob['by'], string> = { admin: 'پنل مدیریت', auto: 'خودکار', cli: 'خط فرمان' };

function JobSummary({ job }: { job: MarketDownloadJob }) {
  const [open, setOpen] = useState(false);
  const pct = job.total ? job.done / job.total : 1;
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line/70 p-3 text-[13px]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STATE[job.state].tone}>{STATE[job.state].label}</Badge>
        <span className="text-muted">
          {job.kind === 's1' ? 'داده‌ی ثانیه‌ای' : 'داده‌ی دقیقه‌ای'} · {job.symbols.length > 4 ? `${fmtNum(job.symbols.length)} نماد` : job.symbols.join('، ')} ·{' '}
          {fmtDay(job.from)} تا {fmtDay(job.to)}
        </span>
        <span className="text-faint">({BY[job.by]})</span>
        <span className="num ms-auto text-[12px] text-faint">{dateTime(job.finishedAt ?? job.startedAt)}</span>
      </div>
      {job.state === 'running' && (
        <>
          <Meter value={pct} tone="accent" className="h-2" />
          <p className="num text-muted">
            {fmtNum(job.done)} از {fmtNum(job.total)} روز ({faDigits(Math.floor(pct * 100))}٪){job.current ? ` · ${job.current}` : ''}
          </p>
        </>
      )}
      <p className="num text-[12px] text-muted">
        ذخیره: {fmtNum(job.stored)} · بازار بسته: {fmtNum(job.closed)} · ناموفق: <span className={clsx(job.failed > 0 && 'text-loss')}>{fmtNum(job.failed)}</span>
        {job.later > 0 && ` · هنوز منتشر نشده (بعداً): ${fmtNum(job.later)}`}
      </p>
      {job.message && <p className={clsx('text-[12px]', job.state === 'failed' ? 'text-loss' : 'text-amber')}>{job.message}</p>}
      {job.errors.length > 0 && (
        <div>
          <button type="button" className="text-[12px] font-semibold text-accent-ink" onClick={() => setOpen((v) => !v)}>
            {open ? 'بستن خطاها' : `نمایش خطاها (${fmtNum(job.errors.length)})`}
          </button>
          {open && (
            <ul className="mt-2 max-h-40 overflow-auto rounded-lg bg-raised/60 p-2 text-left text-[11px] text-muted" dir="ltr">
              {job.errors.map((e, i) => (
                <li key={i}>
                  {e.symbol} {e.day}: {e.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ImportSummary({ job }: { job: MarketImportJob }) {
  const [open, setOpen] = useState(false);
  const pct = job.total ? job.done / job.total : 0;
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line/70 p-3 text-[13px]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STATE[job.state].tone}>{STATE[job.state].label}</Badge>
        <span className="text-muted" dir="ltr">
          {job.repo} · {job.branch}
        </span>
        <span className="num ms-auto text-[12px] text-faint">{dateTime(job.finishedAt ?? job.startedAt)}</span>
      </div>
      {job.state === 'running' && (
        <>
          <Meter value={pct} tone="accent" className="h-2" />
          <p className="num text-muted">
            {fmtNum(job.done)} از {fmtNum(job.total)} فایل ({faDigits(Math.floor(pct * 100))}٪) · {fmtBytes(job.bytes)} دریافت شد{job.current ? ` · ${job.current}` : ''}
          </p>
        </>
      )}
      <p className="num text-[12px] text-muted">
        ماه‌های اضافه‌شده: {fmtNum(job.added)} · جایگزین با نسخه‌ی کامل‌تر: {fmtNum(job.replaced)} · از قبل روی سرور: {fmtNum(job.kept)} · ناموفق:{' '}
        <span className={clsx(job.failed > 0 && 'text-loss')}>{fmtNum(job.failed)}</span>
      </p>
      {job.message && <p className="text-[12px] text-loss">{job.message}</p>}
      {job.errors.length > 0 && (
        <div>
          <button type="button" className="text-[12px] font-semibold text-accent-ink" onClick={() => setOpen((v) => !v)}>
            {open ? 'بستن خطاها' : `نمایش خطاها (${fmtNum(job.errors.length)})`}
          </button>
          {open && (
            <ul className="mt-2 max-h-40 overflow-auto rounded-lg bg-raised/60 p-2 text-left text-[11px] text-muted" dir="ltr">
              {job.errors.map((e, i) => (
                <li key={i}>
                  {e.file}: {e.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Ready-made history (1-minute candles from 2015) from a GitHub repository branch. */
function ImportBox({
  st,
  busy,
  onStart,
  onStop,
  downloading,
}: {
  st: MarketImportStatus;
  busy: boolean;
  downloading: boolean;
  onStart: (repo: string, branch: string) => void;
  onStop: () => void;
}) {
  const [repo, setRepo] = useState(st.repo);
  const [branch, setBranch] = useState(st.branch);
  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-bold">
        <CloudDownload size={16} /> تاریخچه‌ی آماده از GitHub
      </h3>
      <p className="mb-3 text-xs leading-6 text-faint">
        سریع‌ترین راه پر کردن تاریخچه: کندل‌های یک‌دقیقه‌ای از ۲۰۱۵ (حدود ۱ گیگابایت، با همین قالب ذخیره‌سازی) از یک شاخه‌ی مخزن GitHub دریافت می‌شود. فقط ماه‌هایی که سرور ندارد یا
        روزهای کمتری از آن دارد دریافت و ذخیره می‌شوند؛ اجرای دوباره فقط تغییرها را می‌گیرد. بعد از آن دانلود خودکار کمبودها و روزهای جدید را اضافه می‌کند.
        {!st.tokenSet && ' برای مخزن خصوصی، توکن فقط‌خواندنی را در MARKET_DATA_TOKEN فایل ‎.env‎ سرور بگذارید.'}
      </p>
      {st.job ? (
        <div className="flex flex-col gap-2">
          <ImportSummary job={st.job} />
          <button type="button" className="btn-soft self-start" disabled={busy} onClick={onStop}>
            <CircleStop size={15} /> توقف دریافت
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid items-end gap-3 sm:grid-cols-[2fr_1fr_auto]">
            <div>
              <label className="label" htmlFor="imp-repo">
                مخزن
              </label>
              <input id="imp-repo" className="field" dir="ltr" value={repo} onChange={(e) => setRepo(e.target.value.trim())} placeholder="owner/repo" />
            </div>
            <div>
              <label className="label" htmlFor="imp-branch">
                شاخه
              </label>
              <input id="imp-branch" className="field" dir="ltr" value={branch} onChange={(e) => setBranch(e.target.value.trim())} />
            </div>
            <button type="button" className="btn-primary" disabled={busy || downloading || !repo || !branch} onClick={() => onStart(repo, branch)}>
              <CloudDownload size={15} /> دریافت از GitHub
            </button>
          </div>
          {st.lastJob && <ImportSummary job={st.lastJob} />}
        </div>
      )}
    </div>
  );
}

/**
 * Market history on the server's disk: what is stored, the download in progress, and the controls.
 * Charts read only this storage.
 */
export function MarketStoragePanel({ autoDownload, onAutoDownload }: { autoDownload: boolean; onAutoDownload: (v: boolean) => void }) {
  const [st, setSt] = useState<MarketStorage | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const yesterday = addDays(localDayKey(), -1);
  const [secSymbol, setSecSymbol] = useState('EURUSD');
  const [secFrom, setSecFrom] = useState<DayKey | ''>(addDays(yesterday, -6));
  const [secTo, setSecTo] = useState<DayKey | ''>(yesterday);

  const load = useCallback(async () => {
    try {
      setSt(await backend.admin.marketStorage());
      setError('');
    } catch (e) {
      setError(e instanceof BackendError ? e.message : 'وضعیت داده‌ها دریافت نشد.');
    }
  }, []);
  useEffect(() => void load(), [load]);
  // follow a running download or import
  const importing = !!st?.import?.job;
  const running = !!st?.job || importing;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => void load(), 2000);
    return () => clearInterval(t);
  }, [running, load]);

  const start = async (input: { kind?: 'm1' | 's1'; symbols?: string[]; from?: string; to?: string }) => {
    setBusy(true);
    if (await act(backend.admin.startMarketDownload(input), 'دانلود شروع شد')) await load();
    setBusy(false);
  };
  const stop = async () => {
    setBusy(true);
    if (await act(backend.admin.stopMarketDownload(), 'دانلود پس از ماه‌های در حال دریافت متوقف می‌شود')) await load();
    setBusy(false);
  };
  const startImport = async (repo: string, branch: string) => {
    setBusy(true);
    if (await act(backend.admin.startMarketImport({ repo, branch }), 'دریافت تاریخچه از GitHub شروع شد')) await load();
    setBusy(false);
  };
  const stopImport = async () => {
    setBusy(true);
    if (await act(backend.admin.stopMarketImport(), 'دریافت پس از فایل‌های در حال دریافت متوقف می‌شود')) await load();
    setBusy(false);
  };

  if (error && !st) return <p className="card mb-4 p-5 text-sm text-muted">{error}</p>;
  if (!st) return <div className="card mb-4 h-40 animate-pulse" />;
  if (st.symbols.every((x) => x.source === 'synthetic'))
    return (
      <p className="card mb-4 flex items-center gap-3 p-5 text-sm leading-7 text-muted">
        <HardDrive size={18} className="shrink-0 text-faint" />
        نسخه‌ی نمایشی سرور ندارد و قیمت‌هایش نمونه هستند. تاریخچه‌ی واقعی بازار روی سرور API دانلود و ذخیره می‌شود و این بخش آن را مدیریت می‌کند.
      </p>
    );
  const days = st.symbols.reduce((n, s) => n + s.days, 0);
  const expected = st.symbols.reduce((n, s) => n + s.expected, 0);

  return (
    <section className="card mb-4 flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-ink">
          <HardDrive size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold">تاریخچه‌ی بازار روی سرور</h2>
          <p className="mt-1 text-xs leading-6 text-faint">
            کندل‌ها یک بار از Dukascopy و Binance دانلود و روی همین سرور ذخیره می‌شوند و نمودارها فقط از این داده‌ها خوانده می‌شوند. روزهایی که هنوز دانلود نشده‌اند در نمودار خالی
            می‌مانند.
          </p>
        </div>
        <div className="text-left">
          <p className="num text-sm font-bold">{fmtBytes(st.bytes)}</p>
          <p className="num text-[11px] text-faint">
            {fmtNum(days)} از {fmtNum(expected)} روز
          </p>
        </div>
      </div>
      <Meter value={expected ? days / expected : 0} tone="gain" className="h-2" />

      {st.import && <ImportBox st={st.import} busy={busy} downloading={!!st.job} onStart={(r, b) => void startImport(r, b)} onStop={() => void stopImport()} />}

      {st.job ? (
        <div className="flex flex-col gap-2">
          <JobSummary job={st.job} />
          <button type="button" className="btn-soft self-start" disabled={busy} onClick={() => void stop()}>
            <CircleStop size={15} /> توقف دانلود
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-primary" disabled={busy || importing || days >= expected} onClick={() => void start({})}>
              <Download size={15} /> {days ? 'دانلود روزهای باقی‌مانده' : 'دانلود تاریخچه‌ی همه‌ی نمادها'}
            </button>
            <span className="text-xs text-faint">فقط روزهایی که ذخیره نشده‌اند دانلود می‌شوند؛ دانلود کامل چند ساعت طول می‌کشد (حدود ۱٫۵ گیگابایت).</span>
          </div>
          {st.lastJob && <JobSummary job={st.lastJob} />}
        </div>
      )}

      <label className="flex items-center justify-between gap-3 text-sm">
        <span>
          دانلود خودکار
          <span className="block text-xs text-faint">هر ساعت روزهای جدید و کمبودها را دانلود می‌کند (برای همه‌ی نمادهای فعال).</span>
        </span>
        <Toggle checked={autoDownload} onChange={onAutoDownload} label="دانلود خودکار" />
      </label>

      <div className="overflow-hidden rounded-xl border border-line/70">
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-line/70">
                <th className="th">نماد</th>
                <th className="th">منبع</th>
                <th className="th">پوشش</th>
                <th className="th">بازه</th>
                <th className="th">حجم</th>
                <th className="th">ثانیه‌ای</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody>
              {SYMBOLS.map((sym) => st.symbols.find((x) => x.id === sym.id))
                .filter((x): x is MarketStorage['symbols'][number] => !!x)
                .map((x) => {
                  const pct = x.expected ? x.days / x.expected : 0;
                  return (
                    <tr key={x.id} className="border-b border-line/40 last:border-0">
                      <td className="td font-bold" dir="ltr">
                        {x.id}
                      </td>
                      <td className="td text-muted">{x.source === 'binance' ? 'Binance' : x.source === 'qveris' ? 'QVeris' : 'Dukascopy'}</td>
                      <td className="td">
                        <div className="flex items-center gap-2">
                          <Meter value={pct} tone={pct >= 0.999 ? 'gain' : 'amber'} className="w-20" />
                          <span className="num text-[12px] text-muted">{faDigits(Math.floor(pct * 100))}٪</span>
                        </div>
                      </td>
                      <td className="td num text-[12px] text-muted">{x.first ? `${fmtDay(x.first)} تا ${fmtDay(x.last!)}` : '—'}</td>
                      <td className="td num text-[12px] text-muted">{x.bytes ? fmtBytes(x.bytes) : '—'}</td>
                      <td className="td num text-[12px] text-muted">{x.secondDays ? `${fmtNum(x.secondDays)} روز` : '—'}</td>
                      <td className="td">
                        <button
                          type="button"
                          className="btn-ghost px-2 py-1 text-[12px]"
                          disabled={busy || running || x.days >= x.expected}
                          onClick={() => void start({ symbols: [x.id] })}
                          title={`دانلود روزهای باقی‌مانده‌ی ${x.id}`}
                        >
                          <Download size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-line/70 p-4">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-bold">
          <Timer size={16} /> داده‌ی ثانیه‌ای (اختیاری)
        </h3>
        <p className="mb-3 text-xs leading-6 text-faint">
          تایم‌فریم‌های ثانیه‌ای بدون آن از کندل‌های یک‌دقیقه‌ی واقعی ساخته می‌شوند (باز، سقف، کف و بسته‌ی هر دقیقه دقیق است). برای حرکت واقعی داخل دقیقه، تیک‌های یک نماد را برای
          بازه‌ی دلخواه دانلود کنید: هر روز حدود ۰٫۲ تا ۱ مگابایت، حداکثر ۹۲ روز در هر دانلود.
        </p>
        <div className="grid items-end gap-3 sm:grid-cols-4">
          <div>
            <label className="label" htmlFor="sec-symbol">
              نماد
            </label>
            <Select id="sec-symbol" value={secSymbol} onChange={setSecSymbol} options={SYMBOLS.map((s) => ({ value: s.id, label: s.id, hint: SYMBOL_MAP[s.id].name }))} />
          </div>
          <div>
            <label className="label" htmlFor="sec-from">
              از
            </label>
            <DatePicker id="sec-from" value={secFrom} onChange={setSecFrom} min="2015-01-01" max={yesterday} rangeWith={secTo} />
          </div>
          <div>
            <label className="label" htmlFor="sec-to">
              تا
            </label>
            <DatePicker id="sec-to" value={secTo} onChange={setSecTo} min={secFrom || '2015-01-01'} max={yesterday} rangeWith={secFrom} />
          </div>
          <button
            type="button"
            className="btn-soft"
            disabled={busy || running || !secFrom || !secTo}
            onClick={() => void start({ kind: 's1', symbols: [secSymbol], from: secFrom, to: secTo })}
          >
            <Download size={15} /> دانلود
          </button>
        </div>
      </div>

      <details className="text-xs leading-6 text-faint">
        <summary className="cursor-pointer font-semibold text-muted">سرور به منابع داده دسترسی ندارد؟</summary>
        <p className="mt-2">دانلود را روی یک کامپیوتر دیگر (با دسترسی به اینترنت آزاد) اجرا کنید و پوشه را روی سرور کپی کنید:</p>
        <pre className="mt-2 overflow-auto rounded-lg bg-raised/60 p-3 text-left text-[11px]" dir="ltr">
          {`node server.mjs download --data-dir=./backtestlab-data
scp -r ./backtestlab-data/market/store root@SERVER:/var/lib/backtestlab/market/
sudo chown -R backtestlab /var/lib/backtestlab/market && sudo systemctl restart backtestlab`}
        </pre>
      </details>
    </section>
  );
}
