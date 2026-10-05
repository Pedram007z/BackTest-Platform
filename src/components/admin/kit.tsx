import clsx from 'clsx';
import { ChevronLeft, ChevronRight, LoaderCircle, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { fmtNum } from '../../lib/format';
import { BackendError } from '../../services';
import { toast } from '../../store/useStore';

/** Load data from the backend; `reload` refetches, errors become a toast. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await fnRef.current());
    } catch (e) {
      const msg = e instanceof BackendError ? e.message : 'دریافت اطلاعات انجام نشد.';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, setData, loading, error, reload };
}

/** Run a backend action with a toast on success or failure. */
export async function act<T>(p: Promise<T>, ok?: string): Promise<T | null> {
  try {
    const v = await p;
    if (ok) toast(ok);
    return v;
  } catch (e) {
    toast(e instanceof BackendError ? e.message : 'عملیات انجام نشد.', 'error');
    return null;
  }
}

export function PageHeader({ title, text, actions, onReload, loading }: { title: string; text?: string; actions?: ReactNode; onReload?: () => void; loading?: boolean }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        {text && <p className="mt-1 text-sm text-muted">{text}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onReload && (
          <button type="button" className="icon-btn border border-line" onClick={onReload} aria-label="بارگذاری دوباره" title="بارگذاری دوباره">
            <RefreshCw size={16} className={clsx(loading && 'animate-spin')} />
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}

export function Stat({ label, value, hint, icon, tone }: { label: string; value: string; hint?: string; icon?: ReactNode; tone?: 'gain' | 'loss' | 'amber' }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-xs text-muted">
        {icon && <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/12 text-accent-ink">{icon}</span>}
        {label}
      </div>
      <p className={clsx('num mt-2 font-display text-[22px] font-bold', tone === 'gain' && 'text-gain', tone === 'loss' && 'text-loss', tone === 'amber' && 'text-amber')}>{value}</p>
      {hint && <p className="num mt-0.5 text-xs text-faint">{hint}</p>}
    </div>
  );
}

export function Badge({ tone = 'muted', children }: { tone?: 'gain' | 'loss' | 'amber' | 'accent' | 'muted'; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold',
        tone === 'gain' && 'bg-gain/15 text-gain',
        tone === 'loss' && 'bg-loss/15 text-loss',
        tone === 'amber' && 'bg-amber/15 text-amber',
        tone === 'accent' && 'bg-accent/15 text-accent-ink',
        tone === 'muted' && 'bg-raised text-muted',
      )}
    >
      {children}
    </span>
  );
}

export function Pager({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="mt-3 flex items-center justify-between text-xs text-muted">
      <span className="num">{fmtNum(total)} مورد</span>
      <div className="flex items-center gap-2">
        <button type="button" className="icon-btn h-8 w-8" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="صفحه قبل">
          <ChevronRight size={16} />
        </button>
        <span className="num">
          صفحه {fmtNum(page)} از {fmtNum(pages)}
        </span>
        <button type="button" className="icon-btn h-8 w-8" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="صفحه بعد">
          <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex justify-center py-16 text-faint">
      <LoaderCircle className="animate-spin" />
    </div>
  );
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] leading-5 text-faint">{hint}</p>}
    </div>
  );
}

export const tomanFmt = (n: number) => `${fmtNum(n)} تومان`;
export const tomanShort = (n: number) => (n >= 1e9 ? `${fmtNum(n / 1e9, 1)} میلیارد` : n >= 1e6 ? `${fmtNum(n / 1e6, 1)} میلیون` : fmtNum(n));
export const dateTime = (ms: number) =>
  new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(ms));
