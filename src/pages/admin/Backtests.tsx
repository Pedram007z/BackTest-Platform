import clsx from 'clsx';
import { Activity, ArrowRight, BarChart3, LogOut, Monitor, Search, Smartphone, Trash2, Users } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Badge, Loading, PageHeader, Pager, Stat, act, dateTime, useLoad } from '../../components/admin/kit';
import { BalanceEquityChart } from '../../components/charts/AnalyticsCharts';
import { Link } from '../../components/ui/AppLink';
import { ConfirmDialog } from '../../components/ui/Modal';
import { Select } from '../../components/ui/controls';
import { fmtPhone } from '../../lib/auth';
import { fmtDayLong, fmtMarketTime } from '../../lib/calendar';
import { fmtNum, fmtPct, fmtPrice, fmtR, fmtUsd } from '../../lib/format';
import { SYMBOL_MAP } from '../../lib/market';
import { balanceEquitySeries, summarize } from '../../lib/stats';
import type { Trade } from '../../lib/types';
import { deviceLabel, isMobileUa } from '../../lib/userAgent';
import { backend } from '../../services';
import { realisedPnl } from '../../services/backtests';
import type { BacktestQuery, LoginEvent, SnapshotTrade } from '../../services/types';
import { toast } from '../../store/useStore';

/** Users' backtest sessions, orders and positions, from the copy their apps keep on the server. */

const PAGE = 30;
const SORTS: { value: NonNullable<BacktestQuery['sort']>; label: string }[] = [
  { value: 'recent', label: 'آخرین فعالیت' },
  { value: 'pnl', label: 'بیشترین سود' },
  { value: 'trades', label: 'بیشترین معامله' },
];
const pnlClass = (n: number) => (n > 0 ? 'text-gain' : n < 0 ? 'text-loss' : 'text-muted');
const winRate = (wins: number, losses: number) => (wins + losses ? fmtPct((wins / (wins + losses)) * 100, 0) : '—');

/** A text box that searches after typing stops for a moment. */
function useDebounced(value: string, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function AdminBacktests() {
  const [params] = useSearchParams();
  const [text, setText] = useState(params.get('q') ?? '');
  const q = useDebounced(text);
  const [sort, setSort] = useState<NonNullable<BacktestQuery['sort']>>('recent');
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [q, sort]);
  const list = useLoad(() => backend.admin.backtests({ q, sort, page }), [q, sort, page]);
  const d = list.data;

  return (
    <>
      <PageHeader
        title="بک‌تست کاربران"
        text="جلسه‌ها، معاملات و پوزیشن‌های کاربران؛ اپ هر کاربر یک نسخه از داده‌هایش را برای مدیر می‌فرستد."
        onReload={list.reload}
        loading={list.loading}
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="جلسه‌های بک‌تست" value={d ? fmtNum(d.total) : '—'} icon={<BarChart3 size={15} />} />
        <Stat label="کاربران دارای بک‌تست" value={d ? fmtNum(d.users) : '—'} icon={<Users size={15} />} />
        <Stat label="پوزیشن‌های باز" value={d ? fmtNum(d.open) : '—'} icon={<Activity size={15} />} />
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint" />
          <input className="field pr-9" placeholder="نام، موبایل، IP، نام جلسه یا نماد" value={text} onChange={(e) => setText(e.target.value)} aria-label="جستجو" />
        </div>
        <div className="w-44">
          <Select compact value={sort} options={SORTS} onChange={setSort} />
        </div>
      </div>
      <div className="card overflow-x-auto">
        {!d ? (
          <Loading />
        ) : d.items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">{q ? 'چیزی پیدا نشد.' : 'هنوز هیچ کاربری بک‌تستی نساخته است.'}</p>
        ) : (
          <table className="w-full min-w-[1000px] text-[13px]">
            <thead className="bg-raised/40">
              <tr>
                {['کاربر', 'جلسه', 'پیشرفت', 'معاملات', 'وین‌ریت', 'سود و زیان', 'آخرین فعالیت', 'IP', ''].map((h) => (
                  <th key={h} className="th">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.items.map((r) => (
                <tr key={`${r.userId}:${r.id}`} className="border-t border-line/50 hover:bg-raised/30">
                  <td className="td">
                    <span className="block font-semibold">{r.userName}</span>
                    <span className="num block text-[11px] text-faint" dir="ltr" style={{ textAlign: 'right' }}>
                      {fmtPhone(r.phone)}
                    </span>
                  </td>
                  <td className="td">
                    <span className="block font-semibold">{r.name}</span>
                    <span className="block text-[11px] text-faint" dir="ltr" style={{ textAlign: 'right' }}>
                      {r.symbols.join(' · ')} · {r.timeframe}
                    </span>
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-raised">
                        <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.round(r.progress * 100)}%` }} />
                      </span>
                      <span className="num text-[11px] text-muted">{fmtPct(r.progress * 100, 0)}</span>
                    </div>
                  </td>
                  <td className="td num">
                    {fmtNum(r.closed)}
                    {r.open > 0 && (
                      <span className="mr-1.5">
                        <Badge tone="accent">{fmtNum(r.open)} باز</Badge>
                      </span>
                    )}
                    {r.pending > 0 && (
                      <span className="mr-1">
                        <Badge>{fmtNum(r.pending)} سفارش</Badge>
                      </span>
                    )}
                  </td>
                  <td className="td num">{winRate(r.wins, r.losses)}</td>
                  <td className={clsx('td num font-semibold', pnlClass(r.netPnl))}>{fmtUsd(r.netPnl, 0, true)}</td>
                  <td className="td num text-muted">{dateTime(r.lastOpenedAt ?? r.createdAt)}</td>
                  <td className="td num text-muted" dir="ltr" style={{ textAlign: 'right' }}>
                    {r.ip || '—'}
                  </td>
                  <td className="td">
                    <Link to={`/admin/backtests/${encodeURIComponent(r.userId)}?session=${encodeURIComponent(r.id)}`} className="btn-soft whitespace-nowrap px-3 py-1.5 text-xs">
                      جزئیات
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {d && <Pager page={page} total={d.total} pageSize={PAGE} onPage={setPage} />}
    </>
  );
}

const CLOSE_REASON: Record<string, string> = { tp: 'حد سود', sl: 'حد ضرر', manual: 'دستی', session_end: 'پایان جلسه' };
const ORDER_TYPE: Record<string, string> = { market: 'بازار', limit: 'لیمیت', stop: 'استاپ' };
const price = (t: SnapshotTrade, p: number | undefined) => (p === undefined ? '—' : fmtPrice(p, SYMBOL_MAP[t.symbol]?.digits ?? 2));
const Side = ({ side }: { side: 'buy' | 'sell' }) => <Badge tone={side === 'buy' ? 'gain' : 'loss'}>{side === 'buy' ? 'خرید' : 'فروش'}</Badge>;
const Ltr = ({ children }: { children: ReactNode }) => (
  <span dir="ltr" className="num inline-block">
    {children}
  </span>
);

type Tab = 'open' | 'pending' | 'closed';
const pill = (on: boolean) => clsx('rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition', on ? 'bg-accent/15 text-accent-ink' : 'bg-raised text-muted hover:text-ink');

export function AdminBacktestUser() {
  const { userId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const sessionId = params.get('session') ?? '';
  const detail = useLoad(() => backend.admin.backtestDetail(userId), [userId]);
  const devices = useLoad(() => backend.admin.userDevices(userId), [userId]);
  const logins = useLoad(() => backend.admin.activity({ userId }), [userId]);
  const [tab, setTab] = useState<Tab>('closed');
  const [deleting, setDeleting] = useState(false);
  const [signingOut, setSigningOut] = useState<string | 'all' | null>(null);

  const d = detail.data;
  const sessions = d?.snapshot.sessions ?? [];
  const session = sessions.find((s) => s.id === sessionId);
  const trades = useMemo(() => (d ? d.snapshot.trades.filter((t) => !session || t.sessionId === session.id) : []), [d, session]);
  // the app's analytics work on its own Trade type; the copy has every field they read
  const asTrades = trades as unknown as Trade[];
  const summary = useMemo(() => summarize(asTrades), [asTrades]);
  const start = session ? session.balance : sessions.reduce((sum, s) => sum + s.balance, 0);
  const equity = useMemo(() => balanceEquitySeries(asTrades, start), [asTrades, start]);
  const realised = trades.reduce((sum, t) => sum + realisedPnl(t), 0);
  const byTab = {
    open: trades.filter((t) => t.status === 'open'),
    pending: trades.filter((t) => t.status === 'pending'),
    closed: trades.filter((t) => t.status === 'closed').sort((a, b) => (b.closeTime ?? 0) - (a.closeTime ?? 0)),
  };
  const sessionName = (id: string) => sessions.find((s) => s.id === id)?.name ?? '—';
  const pick = (id: string) => setParams(id ? { session: id } : {}, { replace: true });

  if (!d) return <Loading />;
  return (
    <>
      <Link to="/admin/backtests" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowRight size={15} /> همه‌ی بک‌تست‌ها
      </Link>
      <PageHeader
        title={`بک‌تست‌های ${d.user.name}`}
        text={
          d.syncedAt
            ? `آخرین ارسال داده از اپ کاربر: ${dateTime(d.syncedAt)}${d.ip ? ` · IP ${d.ip}` : ''}${d.userAgent ? ` · ${deviceLabel(d.userAgent)}` : ''}`
            : 'اپ این کاربر هنوز داده‌ای نفرستاده است.'
        }
        onReload={() => {
          void detail.reload();
          void devices.reload();
          void logins.reload();
        }}
        loading={detail.loading}
      />

      <div className="card mb-4 grid gap-3 p-4 text-[13px] sm:grid-cols-4">
        <div>
          <span className="block text-xs text-faint">موبایل</span>
          <span className="num" dir="ltr">
            {fmtPhone(d.user.phone)}
          </span>
        </div>
        <div>
          <span className="block text-xs text-faint">وضعیت</span>
          {d.user.status === 'banned' ? <Badge tone="loss">مسدود</Badge> : <Badge tone="gain">فعال</Badge>}
        </div>
        <div>
          <span className="block text-xs text-faint">آخرین ورود</span>
          <span className="num">{d.user.lastLoginAt ? dateTime(d.user.lastLoginAt) : '—'}</span>
        </div>
        <div>
          <span className="block text-xs text-faint">آخرین IP</span>
          <span className="num" dir="ltr">
            {d.user.lastIp || '—'}
          </span>
        </div>
      </div>

      {/* sessions */}
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="جلسه‌ها">
        <button type="button" role="tab" aria-selected={!session} className={pill(!session)} onClick={() => pick('')}>
          همه‌ی جلسه‌ها ({fmtNum(sessions.length)})
        </button>
        {sessions.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={session?.id === s.id} className={pill(session?.id === s.id)} onClick={() => pick(s.id)}>
            {s.name}
          </button>
        ))}
      </div>
      {d.pendingRemovals.length > 0 && (
        <p className="mb-3 rounded-lg bg-amber/10 px-3 py-2 text-xs text-amber">
          {fmtNum(d.pendingRemovals.length)} جلسه‌ی حذف‌شده هنوز در مرورگر کاربر مانده و دفعه‌ی بعد که سایت را باز کند پاک می‌شود.
        </p>
      )}

      {session && (
        <div className="card mb-4 flex flex-wrap items-center justify-between gap-3 p-4 text-[13px]">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <span>
              <span className="text-faint">نمادها: </span>
              <Ltr>{session.symbols.join(' · ')}</Ltr>
            </span>
            <span>
              <span className="text-faint">تایم‌فریم: </span>
              <Ltr>{session.timeframe}</Ltr>
            </span>
            <span>
              <span className="text-faint">بازه: </span>
              {fmtDayLong(session.startDate)} تا {fmtDayLong(session.endDate)}
            </span>
            <span>
              <span className="text-faint">موجودی اولیه: </span>
              {fmtUsd(session.balance, 0)}
            </span>
            <span>
              <span className="text-faint">جای بازپخش: </span>
              {fmtMarketTime(session.cursor)} UTC
            </span>
            {session.strategyId && (
              <span>
                <span className="text-faint">استراتژی: </span>
                {d.snapshot.strategies.find((x) => x.id === session.strategyId)?.name ?? '—'}
              </span>
            )}
          </div>
          <button type="button" className="btn-soft text-loss" onClick={() => setDeleting(true)}>
            <Trash2 size={15} /> حذف این جلسه
          </button>
        </div>
      )}

      {/* analytics */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="سود و زیان" value={fmtUsd(realised, 0, true)} tone={realised > 0 ? 'gain' : realised < 0 ? 'loss' : undefined} />
        <Stat label="وین‌ریت" value={summary.wins + summary.losses ? fmtPct(summary.winRate, 0) : '—'} hint={`${fmtNum(summary.wins)} برد · ${fmtNum(summary.losses)} باخت`} />
        <Stat label="معاملات بسته" value={fmtNum(summary.total)} hint={`${fmtNum(byTab.open.length)} باز · ${fmtNum(byTab.pending.length)} سفارش`} />
        <Stat label="فاکتور سود" value={Number.isFinite(summary.profitFactor) ? fmtNum(summary.profitFactor, 2) : '∞'} />
        <Stat label="میانگین R" value={fmtR(summary.avgR)} />
        <Stat label="بیشترین افت" value={fmtUsd(-summary.maxDrawdown, 0)} tone={summary.maxDrawdown > 0 ? 'loss' : undefined} />
      </div>
      {equity.length > 1 && (
        <div className="card mb-4 p-4">
          <p className="mb-2 text-sm font-semibold">موجودی و اکوئیتی</p>
          <BalanceEquityChart data={equity} height={240} />
        </div>
      )}

      {/* orders and positions */}
      <div className="card mb-6">
        <div className="border-b border-line/60 p-3">
          <div className="seg flex-wrap" role="tablist" aria-label="معاملات">
            {(
              [
                ['closed', 'معاملات بسته'],
                ['open', 'پوزیشن‌های باز'],
                ['pending', 'سفارش‌های در انتظار'],
              ] as [Tab, string][]
            ).map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} className={clsx('seg-item', tab === k && 'seg-item-on')} onClick={() => setTab(k)}>
                {label} ({fmtNum(byTab[k].length)})
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          {byTab[tab].length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">موردی نیست.</p>
          ) : (
            <table className="w-full min-w-[1100px] text-[12.5px]">
              <thead className="bg-raised/40">
                <tr>
                  {(tab === 'closed'
                    ? ['نماد', 'جهت', 'حجم', 'ورود', 'خروج', 'حد ضرر', 'حد سود', 'R', 'سود و زیان', 'بسته شدن', 'جلسه']
                    : tab === 'open'
                      ? ['نماد', 'جهت', 'حجم باز', 'ورود', 'حد ضرر', 'حد سود', 'ریسک', 'سود محقق‌شده', 'جلسه']
                      : ['نماد', 'جهت', 'نوع', 'قیمت سفارش', 'حد ضرر', 'حد سود', 'حجم', 'ثبت سفارش', 'جلسه']
                  ).map((h) => (
                    <th key={h} className="th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byTab[tab].slice(0, 300).map((t) => (
                  <tr key={t.id} className="border-t border-line/50">
                    <td className="td font-semibold" dir="ltr" style={{ textAlign: 'right' }}>
                      {t.symbol}
                    </td>
                    <td className="td">
                      <Side side={t.side} />
                    </td>
                    {tab === 'closed' && (
                      <>
                        <td className="td num">{fmtNum(t.initialLots, 2)}</td>
                        <td className="td">
                          <Ltr>{price(t, t.entry)}</Ltr>
                          <span className="num block text-[11px] text-faint">{fmtMarketTime(t.openTime)}</span>
                        </td>
                        <td className="td">
                          <Ltr>{price(t, t.exit)}</Ltr>
                          <span className="num block text-[11px] text-faint">{t.closeTime ? fmtMarketTime(t.closeTime) : '—'}</span>
                        </td>
                        <td className="td">
                          <Ltr>{price(t, t.sl)}</Ltr>
                        </td>
                        <td className="td">
                          <Ltr>{price(t, t.tp)}</Ltr>
                        </td>
                        <td className={clsx('td num', pnlClass(t.r ?? 0))}>{t.r === undefined ? '—' : fmtR(t.r)}</td>
                        <td className={clsx('td num font-semibold', pnlClass(t.pnl ?? 0))}>{t.pnl === undefined ? '—' : fmtUsd(t.pnl, 2, true)}</td>
                        <td className="td text-muted">{t.closeReason ? CLOSE_REASON[t.closeReason] : '—'}</td>
                      </>
                    )}
                    {tab === 'open' && (
                      <>
                        <td className="td num">{fmtNum(t.lots, 2)}</td>
                        <td className="td">
                          <Ltr>{price(t, t.entry)}</Ltr>
                          <span className="num block text-[11px] text-faint">{fmtMarketTime(t.openTime)}</span>
                        </td>
                        <td className="td">
                          <Ltr>{price(t, t.sl)}</Ltr>
                        </td>
                        <td className="td">
                          <Ltr>{price(t, t.tp)}</Ltr>
                        </td>
                        <td className="td num">
                          {fmtUsd(t.risk, 0)} <span className="text-faint">({fmtPct(t.riskPct, 1)})</span>
                        </td>
                        <td className={clsx('td num', pnlClass(realisedPnl(t)))}>{fmtUsd(realisedPnl(t), 2, true)}</td>
                      </>
                    )}
                    {tab === 'pending' && (
                      <>
                        <td className="td">{ORDER_TYPE[t.orderType]}</td>
                        <td className="td">
                          <Ltr>{price(t, t.entry)}</Ltr>
                        </td>
                        <td className="td">
                          <Ltr>{price(t, t.sl)}</Ltr>
                        </td>
                        <td className="td">
                          <Ltr>{price(t, t.tp)}</Ltr>
                        </td>
                        <td className="td num">{fmtNum(t.lots, 2)}</td>
                        <td className="td num text-faint">{fmtMarketTime(t.placedTime)}</td>
                      </>
                    )}
                    <td className="td text-muted">{sessionName(t.sessionId)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {byTab[tab].length > 300 && <p className="p-3 text-xs text-faint">۳۰۰ مورد آخر نشان داده شده است.</p>}
        </div>
      </div>

      {/* devices and sign-ins */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold">دستگاه‌های واردشده</p>
            {devices.data && devices.data.length > 0 && (
              <button type="button" className="btn-soft px-3 py-1.5 text-xs text-loss" onClick={() => setSigningOut('all')}>
                <LogOut size={14} /> خروج از همه
              </button>
            )}
          </div>
          {!devices.data ? (
            <Loading />
          ) : devices.data.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">کاربر در هیچ دستگاهی وارد نیست.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {devices.data.map((dev) => (
                <li key={dev.id} className="flex items-center gap-3 rounded-xl border border-line/60 px-3 py-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-raised text-muted">
                    {isMobileUa(dev.userAgent) ? <Smartphone size={17} /> : <Monitor size={17} />}
                  </span>
                  <div className="min-w-0 flex-1 text-[12.5px]">
                    <p className="font-semibold" title={dev.userAgent}>
                      {deviceLabel(dev.userAgent)}
                    </p>
                    <p className="num text-muted">
                      IP <span dir="ltr">{dev.ip || '—'}</span>
                    </p>
                    <p className="num text-[11.5px] text-faint">
                      ورود {dateTime(dev.createdAt)} · آخرین بازدید {dateTime(dev.lastSeenAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="icon-btn h-8 w-8 hover:text-loss"
                    onClick={() => setSigningOut(dev.id)}
                    aria-label="خروج از این دستگاه"
                    title="خروج از این دستگاه"
                  >
                    <LogOut size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold">ورود و خروج‌های اخیر</p>
            <Link to={`/admin/activity?userId=${encodeURIComponent(userId)}`} className="text-xs text-accent-ink hover:underline">
              همه
            </Link>
          </div>
          {!logins.data ? <Loading /> : <LoginList events={logins.data.items.slice(0, 8)} />}
        </div>
      </div>

      <ConfirmDialog
        open={deleting}
        title="حذف جلسه‌ی بک‌تست"
        message={`جلسه‌ی «${session?.name ?? ''}» با همه‌ی معاملات و پوزیشن‌هایش حذف می‌شود؛ از مرورگر کاربر هم دفعه‌ی بعد که سایت را باز کند پاک می‌شود. این کار برگشت ندارد.`}
        confirmLabel="حذف جلسه"
        onClose={() => setDeleting(false)}
        onConfirm={async () => {
          if (!session) return;
          if ((await act(backend.admin.deleteBacktestSession(userId, session.id), 'جلسه حذف شد')) !== null) {
            pick('');
            void detail.reload();
          }
        }}
      />
      <ConfirmDialog
        open={signingOut !== null}
        title="خروج از حساب"
        message={signingOut === 'all' ? 'کاربر از همه‌ی دستگاه‌ها خارج می‌شود و باید دوباره وارد شود.' : 'کاربر از این دستگاه خارج می‌شود و باید دوباره وارد شود.'}
        confirmLabel="خروج"
        onClose={() => setSigningOut(null)}
        onConfirm={async () => {
          const id = signingOut === 'all' ? undefined : (signingOut ?? undefined);
          const r = await act(backend.admin.signOutDevices(userId, id));
          if (r) {
            toast(r.count ? `کاربر از ${fmtNum(r.count)} دستگاه خارج شد` : 'دستگاهی برای خروج نبود');
            void devices.reload();
            void logins.reload();
          }
        }}
      />
    </>
  );
}

const KIND: Record<string, { label: string; tone: 'gain' | 'muted' | 'loss' }> = {
  login: { label: 'ورود', tone: 'gain' },
  logout: { label: 'خروج', tone: 'muted' },
  signed_out_by_admin: { label: 'خروج توسط مدیر', tone: 'loss' },
};
const METHOD: Record<string, string> = { otp: 'کد پیامکی', password: 'رمز مدیر', demo: 'حساب نمایشی' };

export function LoginList({ events }: { events: LoginEvent[] }) {
  if (!events.length) return <p className="py-6 text-center text-sm text-muted">هنوز ورودی ثبت نشده است.</p>;
  return (
    <ul className="flex flex-col divide-y divide-line/50 text-[12.5px]">
      {events.map((e) => (
        <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
          <Badge tone={KIND[e.kind].tone}>{KIND[e.kind].label}</Badge>
          <span className="num text-muted">{dateTime(e.at)}</span>
          <span className="num" dir="ltr">
            {e.ip || '—'}
          </span>
          <span className="text-faint" title={e.userAgent}>
            {deviceLabel(e.userAgent)}
            {e.method ? ` · ${METHOD[e.method]}` : ''}
          </span>
        </li>
      ))}
    </ul>
  );
}

export { KIND as LOGIN_KIND, METHOD as LOGIN_METHOD };
