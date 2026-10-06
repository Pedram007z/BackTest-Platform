import clsx from 'clsx';
import { CalendarSync, Check, LoaderCircle, Megaphone, Search, Send, TestTube2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AdminCredentialsCard } from '../../components/admin/AdminCredentials';
import { MarketStoragePanel } from '../../components/admin/MarketStorage';
import { Badge, Field, Loading, PageHeader, act, dateTime, useLoad } from '../../components/admin/kit';
import { Modal } from '../../components/ui/Modal';
import { Select, Toggle } from '../../components/ui/controls';
import { fmtPhone } from '../../lib/auth';
import { fmtNum, toLatinDigits } from '../../lib/format';
import { GROUP_LABELS, SYMBOLS, groupLabel, type SymbolGroup } from '../../lib/market';
import { TICKET_STATUS, TicketThread } from '../Support';
import { backend } from '../../services';
import { toast } from '../../store/useStore';
import { SMS_PROVIDER_NAMES, type DataSource, type SiteSettings, type SmsProviderId, type SmsSettings, type Ticket } from '../../services/types';

// ---------- SMS ----------
const SMS_HELP: Record<SmsProviderId, string> = {
  kavenegar: 'کلید API از پنل کاوه‌نگار. کد ورود با سرویس Verify Lookup و نام الگو (template) ارسال می‌شود.',
  smsir: 'کلید API (x-api-key) از پنل sms.ir. کد ورود با ارسال سریع (Verify) و شناسه‌ی قالب ارسال می‌شود.',
  melipayamak: 'نام کاربری و رمز وب‌سرویس یا کلید کنسول ملی‌پیامک. برای کد ورود، کد پترن (bodyId) را وارد کنید.',
  ghasedak: 'کلید API قاصدک. کد ورود با الگوی OTP (template) ارسال می‌شود.',
  farazsms: 'کلید API پنل IPPanel / فراز اس‌ام‌اس و کد پترن کد ورود.',
};

export function AdminSms() {
  const settings = useLoad(() => backend.admin.sms());
  const logs = useLoad(() => backend.admin.smsLogs());
  const plans = useLoad(() => backend.admin.plans());
  const [d, setD] = useState<SmsSettings | null>(null);
  const [testTo, setTestTo] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [audience, setAudience] = useState<'all' | 'active' | 'expired' | `plan:${string}`>('active');
  const [busy, setBusy] = useState<'test' | 'bulk' | null>(null);
  useEffect(() => setD(settings.data), [settings.data]);
  const provider = d?.providers.find((p) => p.id === d.active);
  const setProvider = (patch: Record<string, string>) => d && setD({ ...d, providers: d.providers.map((p) => (p.id === d.active ? { ...p, ...patch } : p)) });

  return (
    <>
      <PageHeader
        title="پیامک"
        text="سامانه‌ی ارسال کد ورود و پیامک‌های اطلاع‌رسانی."
        onReload={() => {
          void settings.reload();
          void logs.reload();
        }}
        loading={settings.loading}
        actions={
          <button type="button" className="btn-primary" onClick={() => setBulkOpen(true)}>
            <Megaphone size={16} /> پیامک گروهی
          </button>
        }
      />
      {!d || !provider ? (
        <Loading />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="card p-5">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="font-bold">سامانه‌ی فعال</h2>
              <label className="ms-auto flex items-center gap-2 text-sm">
                <Toggle checked={d.enabled} onChange={(enabled) => setD({ ...d, enabled })} label="ارسال واقعی پیامک" />
                ارسال واقعی
              </label>
            </div>
            {!d.enabled && (
              <p className="mb-4 rounded-xl bg-amber/10 px-3 py-2 text-xs leading-6 text-amber">
                ارسال واقعی خاموش است: کدها فقط در گزارش ثبت می‌شوند و در صفحه‌ی ورود نمایش داده می‌شوند (حالت توسعه).
              </p>
            )}
            <div className="mb-4 flex flex-wrap gap-1.5" role="radiogroup" aria-label="سامانه‌ی پیامک">
              {(Object.keys(SMS_PROVIDER_NAMES) as SmsProviderId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={d.active === id}
                  onClick={() => setD({ ...d, active: id })}
                  className={clsx(
                    'rounded-xl border px-3 py-1.5 text-[13px] font-semibold transition',
                    d.active === id ? 'border-accent bg-accent/12 text-ink' : 'border-line text-muted hover:text-ink',
                  )}
                >
                  {SMS_PROVIDER_NAMES[id]}
                </button>
              ))}
            </div>
            <p className="mb-4 text-xs leading-6 text-muted">{SMS_HELP[d.active]}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="کلید API" htmlFor="sms-key">
                <input
                  id="sms-key"
                  className="field font-mono text-[13px]"
                  dir="ltr"
                  value={provider.apiKey}
                  onChange={(e) => setProvider({ apiKey: e.target.value.trim() })}
                  placeholder="••••••••"
                />
              </Field>
              <Field label="شماره خط ارسال" htmlFor="sms-sender">
                <input id="sms-sender" className="field num" dir="ltr" value={provider.sender} onChange={(e) => setProvider({ sender: toLatinDigits(e.target.value) })} />
              </Field>
              <Field label="الگو / قالب کد ورود" htmlFor="sms-template" hint="نام الگو، شناسه‌ی قالب یا کد پترن در پنل سامانه.">
                <input id="sms-template" className="field" dir="ltr" value={provider.otpTemplate} onChange={(e) => setProvider({ otpTemplate: e.target.value.trim() })} />
              </Field>
              {d.active === 'melipayamak' && (
                <>
                  <Field label="نام کاربری" htmlFor="sms-user">
                    <input id="sms-user" className="field" dir="ltr" value={provider.username ?? ''} onChange={(e) => setProvider({ username: e.target.value })} />
                  </Field>
                  <Field label="رمز وب‌سرویس" htmlFor="sms-pass">
                    <input id="sms-pass" type="password" className="field" dir="ltr" value={provider.password ?? ''} onChange={(e) => setProvider({ password: e.target.value })} />
                  </Field>
                </>
              )}
            </div>
            <div className="mt-5 flex flex-wrap items-end gap-2 border-t border-line/60 pt-4">
              <div className="min-w-[12rem] flex-1">
                <Field label="ارسال پیامک آزمایشی به" htmlFor="sms-test">
                  <input id="sms-test" className="field num" dir="ltr" placeholder="0912…" value={testTo} onChange={(e) => setTestTo(toLatinDigits(e.target.value))} />
                </Field>
              </div>
              <button
                type="button"
                className="btn-soft"
                disabled={!testTo || busy !== null}
                onClick={async () => {
                  setBusy('test');
                  if (await act(backend.admin.testSms(testTo), 'پیامک آزمایشی ارسال شد')) void logs.reload();
                  setBusy(null);
                }}
              >
                {busy === 'test' ? <LoaderCircle size={15} className="animate-spin" /> : <TestTube2 size={15} />} ارسال آزمایشی
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={async () => {
                  if (await act(backend.admin.saveSms(d), 'تنظیمات پیامک ذخیره شد')) void settings.reload();
                }}
              >
                <Check size={15} /> ذخیره
              </button>
            </div>
          </section>

          <section className="card flex min-h-[420px] flex-col p-5">
            <h2 className="mb-3 font-bold">گزارش ارسال</h2>
            <div className="min-h-0 flex-1 overflow-auto">
              {!logs.data ? (
                <Loading />
              ) : (
                <table className="w-full min-w-[520px] text-[12px]">
                  <thead>
                    <tr>
                      {['زمان', 'گیرنده', 'نوع', 'متن', 'وضعیت'].map((h) => (
                        <th key={h} className="th">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.data.slice(0, 80).map((l) => (
                      <tr key={l.id} className="border-t border-line/50">
                        <td className="td num text-muted">{dateTime(l.createdAt)}</td>
                        <td className="td num" dir="ltr" style={{ textAlign: 'right' }}>
                          {fmtPhone(l.to)}
                        </td>
                        <td className="td">{l.kind === 'otp' ? 'کد ورود' : l.kind === 'bulk' ? 'گروهی' : 'آزمایشی'}</td>
                        <td className="td max-w-[220px] truncate text-muted" title={l.text}>
                          {l.text.split('\n')[0]}
                        </td>
                        <td className="td">
                          {l.status === 'sent' ? <Badge tone="gain">{l.provider === 'dev' ? 'ثبت (توسعه)' : 'ارسال شد'}</Badge> : <Badge tone="loss">خطا</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      )}

      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="پیامک گروهی"
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={() => setBulkOpen(false)}>
              انصراف
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={bulkText.trim().length < 5 || busy !== null}
              onClick={async () => {
                setBusy('bulk');
                const r = await act(backend.admin.bulkSms({ text: bulkText.trim(), audience }));
                setBusy(null);
                if (r) {
                  setBulkOpen(false);
                  setBulkText('');
                  void logs.reload();
                  toast(`${fmtNum(r.sent)} پیامک ارسال شد`);
                }
              }}
            >
              {busy === 'bulk' ? <LoaderCircle size={15} className="animate-spin" /> : <Send size={15} className="-scale-x-100" />} ارسال
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="گیرندگان" htmlFor="bulk-aud">
            <Select
              id="bulk-aud"
              value={audience}
              onChange={setAudience}
              options={[
                { value: 'active', label: 'کاربران با اشتراک فعال' },
                { value: 'expired', label: 'کاربرانی که اشتراکشان تمام شده' },
                { value: 'all', label: 'همه‌ی کاربران' },
                ...(plans.data ?? []).map((p) => ({ value: `plan:${p.id}` as const, label: `پلن ${p.name}` })),
              ]}
            />
          </Field>
          <Field label="متن پیامک" htmlFor="bulk-text" hint={`${fmtNum(bulkText.length)} کاراکتر · هر ۷۰ کاراکتر فارسی یک پیامک حساب می‌شود.`}>
            <textarea
              id="bulk-text"
              className="field min-h-[120px] leading-7"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="مثلاً: تخفیف ۳۰٪ نوروزی با کد NOROOZ1405 تا ۱۵ فروردین"
            />
          </Field>
          <p className="text-xs text-faint">مسدودشده‌ها پیامک دریافت نمی‌کنند. ارسال تبلیغاتی فقط از خط خدماتی مجاز است.</p>
        </div>
      </Modal>
    </>
  );
}

// ---------- tickets ----------
export function AdminTickets() {
  const { data, loading, reload } = useLoad(() => backend.admin.tickets());
  const [filter, setFilter] = useState<'all' | Ticket['status']>('open');
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const list = (data ?? []).filter((t) => filter === 'all' || t.status === filter);
  const open = data?.find((t) => t.id === openId) ?? null;
  return (
    <>
      <PageHeader title="تیکت‌ها" text="پیام‌های پشتیبانی کاربران." onReload={reload} loading={loading} />
      <div className="seg mb-4">
        {(['open', 'answered', 'closed', 'all'] as const).map((s) => (
          <button key={s} type="button" onClick={() => setFilter(s)} className={clsx('seg-item', filter === s && 'seg-item-on')}>
            {s === 'all' ? 'همه' : TICKET_STATUS[s].label}
            <span className="num ms-1 text-faint">({fmtNum((data ?? []).filter((t) => s === 'all' || t.status === s).length)})</span>
          </button>
        ))}
      </div>
      <div className="card overflow-hidden">
        {!data ? (
          <Loading />
        ) : list.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">تیکتی در این دسته نیست.</p>
        ) : (
          <ul>
            {list.map((t) => (
              <li key={t.id} className="border-b border-line/60 last:border-0">
                <button type="button" onClick={() => setOpenId(t.id)} className="flex w-full flex-wrap items-center gap-3 px-5 py-3.5 text-start hover:bg-raised/40">
                  <span className={clsx('h-2 w-2 rounded-full', t.priority === 'high' ? 'bg-loss' : t.priority === 'normal' ? 'bg-amber' : 'bg-faint')} title={t.priority} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{t.subject}</p>
                    <p className="num text-xs text-faint">
                      {t.userName} · {dateTime(t.updatedAt)} · {fmtNum(t.messages.length)} پیام
                    </p>
                  </div>
                  <span className={clsx('rounded-md px-2 py-0.5 text-[11px] font-bold', TICKET_STATUS[t.status].cls)}>{TICKET_STATUS[t.status].label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Modal
        open={!!open}
        onClose={() => setOpenId(null)}
        size="lg"
        title={open?.subject ?? ''}
        headerExtra={
          open && (
            <button
              type="button"
              className="btn-ghost py-1 text-[12px]"
              onClick={async () => {
                if (await act(backend.admin.setTicketStatus(open.id, open.status === 'closed' ? 'open' : 'closed'), open.status === 'closed' ? 'تیکت باز شد' : 'تیکت بسته شد'))
                  void reload();
              }}
            >
              {open.status === 'closed' ? 'باز کردن دوباره' : 'بستن تیکت'}
            </button>
          )
        }
      >
        {open && (
          <>
            <TicketThread ticket={open} viewer="admin" />
            <form
              className="mt-4 flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!reply.trim()) return;
                if (await act(backend.admin.replyTicket(open.id, reply.trim()), 'پاسخ ارسال شد')) {
                  setReply('');
                  void reload();
                }
              }}
            >
              <label className="sr-only" htmlFor="admin-reply">
                پاسخ
              </label>
              <input id="admin-reply" className="field" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="پاسخ پشتیبانی…" />
              <button type="submit" className="btn-primary shrink-0 whitespace-nowrap" disabled={!reply.trim()}>
                ارسال پاسخ
              </button>
            </form>
          </>
        )}
      </Modal>
    </>
  );
}

// ---------- news ----------
export function AdminNews() {
  const { data, loading, reload, setData } = useLoad(() => backend.admin.newsStatus());
  const [syncing, setSyncing] = useState(false);
  return (
    <>
      <PageHeader title="تقویم اقتصادی" text="دریافت رویدادهای اقتصادی از ForexFactory برای نمایش روی چارت و پنل اخبار." onReload={reload} loading={loading} />
      {!data ? (
        <Loading />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="card p-5">
            <dl className="grid grid-cols-[1fr_auto] gap-y-2.5 text-[13px]">
              <dt className="text-muted">منبع داده</dt>
              <dd className="font-semibold">{data.source === 'forexfactory' ? 'ForexFactory' : 'تقویم نمونه (بدون سرور)'}</dd>
              <dt className="text-muted">آخرین همگام‌سازی</dt>
              <dd className="num">{data.lastSyncAt ? dateTime(data.lastSyncAt) : '—'}</dd>
              <dt className="text-muted">رویدادهای ذخیره‌شده</dt>
              <dd className="num">{fmtNum(data.events)}</dd>
              <dt className="text-muted">هفته‌های پوشش‌داده‌شده</dt>
              <dd className="num">{fmtNum(data.weeks)}</dd>
            </dl>
            {data.lastError && <p className="mt-4 rounded-xl bg-amber/10 px-3 py-2 text-xs leading-6 text-amber">{data.lastError}</p>}
            <button
              type="button"
              className="btn-primary mt-5"
              disabled={syncing}
              onClick={async () => {
                setSyncing(true);
                const r = await act(backend.admin.syncNews(), 'همگام‌سازی انجام شد');
                if (r) setData(r);
                setSyncing(false);
              }}
            >
              {syncing ? <LoaderCircle size={15} className="animate-spin" /> : <CalendarSync size={15} />} همگام‌سازی الان
            </button>
          </section>
          <section className="card p-5 text-[13px] leading-7 text-muted">
            <h2 className="mb-2 font-bold text-ink">چطور کار می‌کند</h2>
            <ul className="list-disc ps-5">
              <li>سرور هر ساعت فید هفته‌ی جاری ForexFactory را می‌خواند و رویدادها را ذخیره می‌کند.</li>
              <li>برای هفته‌های گذشته (بک‌تست) صفحه‌ی تقویم همان هفته از ForexFactory خوانده و در پایگاه داده نگه داشته می‌شود؛ هر هفته فقط یک بار.</li>
              <li>عدد واقعی (Actual) هر خبر تا وقتی بازپخش به زمان انتشار نرسیده به کاربر نشان داده نمی‌شود.</li>
              <li>زمان‌ها به UTC ذخیره و برای کاربر به وقت تهران نمایش داده می‌شوند.</li>
            </ul>
          </section>
        </div>
      )}
    </>
  );
}

// ---------- market data / symbols ----------
const SOURCES: { value: DataSource; label: string }[] = [
  { value: 'dukascopy', label: 'Dukascopy (تاریخی)' },
  { value: 'binance', label: 'Binance (کریپتو)' },
];

export function AdminMarket() {
  const { data, loading, reload } = useLoad(() => backend.admin.settings());
  const [d, setD] = useState<SiteSettings | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => setD(data), [data]);
  const groups = useMemo(() => [...new Set(SYMBOLS.map((s) => groupLabel(s)))], []);
  if (!d) return <Loading />;
  const enabled = new Set(d.enabledSymbols.length ? d.enabledSymbols : SYMBOLS.map((s) => s.id));
  const toggle = (id: string) => {
    const next = new Set(enabled);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setD({ ...d, enabledSymbols: next.size === SYMBOLS.length ? [] : [...next] });
  };
  return (
    <>
      <PageHeader
        title="نمادها و داده‌ی بازار"
        text={`${fmtNum(SYMBOLS.length)} نماد فارکس، فلزات، انرژی، شاخص و کریپتو. نمادهای خاموش در ساخت جلسه نمایش داده نمی‌شوند.`}
        onReload={reload}
        loading={loading}
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={async () => {
              if (await act(backend.admin.saveSettings(d), 'تنظیمات بازار ذخیره شد')) void reload();
            }}
          >
            <Check size={15} /> ذخیره
          </button>
        }
      />
      <MarketStoragePanel
        autoDownload={d.marketAutoDownload}
        onAutoDownload={async (marketAutoDownload) => {
          const next = { ...d, marketAutoDownload };
          setD(next);
          await act(backend.admin.saveSettings(next), marketAutoDownload ? 'دانلود خودکار روشن شد' : 'دانلود خودکار خاموش شد');
        }}
      />
      <section className="card mb-4 p-5">
        <h2 className="mb-3 font-bold">منبع داده‌ی هر بازار</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(Object.keys(d.marketData) as SymbolGroup[]).map((g) => (
            <Field key={g} label={GROUP_LABELS[g]} htmlFor={`src-${g}`}>
              <Select
                id={`src-${g}`}
                value={d.marketData[g]}
                onChange={(v) => setD({ ...d, marketData: { ...d.marketData, [g]: v } })}
                options={SOURCES.filter((s) => g === 'crypto' || s.value !== 'binance')}
              />
            </Field>
          ))}
        </div>
        <p className="mt-3 text-xs leading-6 text-faint">
          همه‌ی قیمت‌ها داده‌ی واقعی تاریخی هستند: Dukascopy (قیمت Bid) و Binance. منبع فقط برای دانلودهای بعدی است؛ روزهای ذخیره‌شده تغییر نمی‌کنند. کندل‌های روزانه و ۴ ساعته مثل
          بروکرها با بسته‌شدن ساعت ۱۷ نیویورک تشکیل می‌شوند؛ کریپتو با روز UTC.
        </p>
      </section>
      <section className="card p-5">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="font-bold">نمادهای فعال</h2>
          <span className="num text-xs text-muted">
            {fmtNum(enabled.size)} از {fmtNum(SYMBOLS.length)}
          </span>
          <div className="relative ms-auto w-56">
            <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint" />
            <input id="sym-search" className="field py-2 pr-9" placeholder="جستجوی نماد" value={q} onChange={(e) => setQ(e.target.value.toUpperCase())} />
          </div>
        </div>
        {groups.map((g) => {
          const list = SYMBOLS.filter((s) => groupLabel(s) === g && (!q || s.id.includes(q) || s.name.includes(q)));
          if (!list.length) return null;
          return (
            <div key={g} className="mb-4">
              <p className="mb-2 text-[12px] font-semibold text-faint">{g}</p>
              <div className="flex flex-wrap gap-1.5">
                {list.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={enabled.has(s.id)}
                    onClick={() => toggle(s.id)}
                    title={s.name}
                    className={clsx(
                      'rounded-lg border px-2.5 py-1 text-[12px] font-bold transition',
                      enabled.has(s.id) ? 'border-accent/60 bg-accent/12 text-ink' : 'border-line text-faint line-through',
                    )}
                    dir="ltr"
                  >
                    {s.ticker.replace('CME_MINI:', '')}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}

// ---------- site settings ----------
export function AdminSettings() {
  const { data, loading, reload } = useLoad(() => backend.admin.settings());
  const plans = useLoad(() => backend.admin.plans());
  const [d, setD] = useState<SiteSettings | null>(null);
  useEffect(() => setD(data), [data]);
  if (!d) return <Loading />;
  const n = (s: string) => Number(toLatinDigits(s).replace(/\D/g, '')) || 0;
  return (
    <>
      <PageHeader
        title="تنظیمات سایت"
        onReload={reload}
        loading={loading}
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={async () => {
              if (await act(backend.admin.saveSettings(d), 'تنظیمات ذخیره شد')) void reload();
            }}
          >
            <Check size={15} /> ذخیره
          </button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card flex flex-col gap-4 p-5">
          <h2 className="font-bold">عمومی</h2>
          <Field label="نام سایت" htmlFor="st-name">
            <input id="st-name" className="field" value={d.siteName} onChange={(e) => setD({ ...d, siteName: e.target.value })} />
          </Field>
          <Field label="تلفن پشتیبانی" htmlFor="st-phone">
            <input id="st-phone" className="field num" dir="ltr" value={d.supportPhone} onChange={(e) => setD({ ...d, supportPhone: toLatinDigits(e.target.value) })} />
          </Field>
          <label className="flex items-center justify-between gap-3 text-sm">
            ثبت‌نام کاربر جدید باز باشد
            <Toggle checked={d.registrationOpen} onChange={(registrationOpen) => setD({ ...d, registrationOpen })} label="ثبت‌نام باز" />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            حالت تعمیر و نگهداری (فقط مدیران وارد می‌شوند)
            <Toggle checked={d.maintenance} onChange={(maintenance) => setD({ ...d, maintenance })} label="حالت تعمیر" />
          </label>
        </section>
        <section className="card flex flex-col gap-4 p-5">
          <h2 className="font-bold">ثبت‌نام و ورود</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="روزهای آزمایشی کاربر جدید" htmlFor="st-trial" hint="۰ یعنی شروع با پلن رایگان.">
              <input id="st-trial" className="field num" dir="ltr" value={d.trialDays} onChange={(e) => setD({ ...d, trialDays: n(e.target.value) })} />
            </Field>
            <Field label="پلن دوره‌ی آزمایشی" htmlFor="st-trial-plan">
              <Select
                id="st-trial-plan"
                value={d.trialPlanId}
                onChange={(trialPlanId) => setD({ ...d, trialPlanId })}
                options={(plans.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
              />
            </Field>
            <Field label="طول کد پیامکی" htmlFor="st-otp-len">
              <Select
                id="st-otp-len"
                value={String(d.otpLength)}
                onChange={(v) => setD({ ...d, otpLength: Number(v) })}
                options={[4, 5, 6].map((x) => ({ value: String(x), label: `${fmtNum(x)} رقم` }))}
              />
            </Field>
            <Field label="اعتبار کد (ثانیه)" htmlFor="st-otp-ttl">
              <input id="st-otp-ttl" className="field num" dir="ltr" value={d.otpTtlSec} onChange={(e) => setD({ ...d, otpTtlSec: Math.max(30, n(e.target.value)) })} />
            </Field>
          </div>
          <label className="flex items-center justify-between gap-3 text-sm">
            همگام‌سازی خودکار تقویم اقتصادی
            <Toggle checked={d.newsAutoSync} onChange={(newsAutoSync) => setD({ ...d, newsAutoSync })} label="همگام‌سازی خودکار" />
          </label>
        </section>
        <AdminCredentialsCard />
      </div>
    </>
  );
}

// ---------- audit ----------
export function AdminAudit() {
  const { data, loading, reload } = useLoad(() => backend.admin.audit());
  return (
    <>
      <PageHeader title="گزارش فعالیت" text="کارهای مدیران: تغییر قیمت، مسدودسازی، استرداد، پیامک گروهی و …" onReload={reload} loading={loading} />
      <div className="card overflow-x-auto">
        {!data ? (
          <Loading />
        ) : (
          <table className="w-full min-w-[640px] text-[13px]">
            <thead className="bg-raised/40">
              <tr>
                {['زمان', 'مدیر', 'کار', 'مورد'].map((h) => (
                  <th key={h} className="th">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id} className="border-t border-line/50">
                  <td className="td num text-muted">{dateTime(a.at)}</td>
                  <td className="td font-semibold">{a.actor}</td>
                  <td className="td">{a.action}</td>
                  <td className="td text-muted">{a.target ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
