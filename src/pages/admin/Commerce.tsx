import clsx from 'clsx';
import { ArrowLeft, Pencil, Plus, PlugZap, Search, Trash2, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { Badge, Field, Loading, PageHeader, Pager, act, dateTime, tomanFmt, useLoad } from '../../components/admin/kit';
import { Link } from '../../components/ui/AppLink';
import { DatePicker } from '../../components/ui/DatePicker';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { Select, Toggle } from '../../components/ui/controls';
import { addDays, fmtDayLong, localDayKey } from '../../lib/calendar';
import { fmtPhone } from '../../lib/auth';
import { faDigits, fmtNum, toLatinDigits } from '../../lib/format';
import { backend } from '../../services';
import { PAYMENT_METHOD_NAMES, type DiscountCode, type GatewayConfig, type GatewayId, type Payment, type PaymentMethod, type Plan } from '../../services/types';

const num = (s: string) => Number(toLatinDigits(s).replace(/[^\d]/g, '')) || 0;

// ---------- plans ----------
function PlanEditor({ plan, onClose, onSaved }: { plan: Plan; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState({ ...plan, featuresText: plan.features.join('\n') });
  const set = (p: Partial<typeof d>) => setD((x) => ({ ...x, ...p }));
  const isNew = !plan.name;
  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? 'پلن جدید' : `ویرایش ${plan.name}`}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            انصراف
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!d.name.trim() || d.durationDays <= 0}
            onClick={async () => {
              const { featuresText, ...rest } = d;
              const saved = await act(backend.admin.savePlan({ ...rest, name: rest.name.trim(), features: featuresText.split('\n').map((s) => s.trim()).filter(Boolean) }), 'پلن ذخیره شد');
              if (saved) onSaved();
            }}
          >
            ذخیره
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="نام پلن" htmlFor="pl-name">
          <input id="pl-name" className="field" value={d.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <Field label="شناسه" htmlFor="pl-id" hint="در آدرس‌ها و گزارش‌ها؛ بعد از ساخت ثابت می‌ماند.">
          <input id="pl-id" className="field" dir="ltr" value={d.id} disabled={!isNew} onChange={(e) => set({ id: e.target.value.replace(/[^a-z0-9-]/gi, '').toLowerCase() })} />
        </Field>
        <Field label="قیمت (تومان)" htmlFor="pl-price">
          <input id="pl-price" className="field num" dir="ltr" inputMode="numeric" value={d.priceToman} onChange={(e) => set({ priceToman: num(e.target.value) })} />
        </Field>
        <Field label="مدت (روز)" htmlFor="pl-days">
          <input id="pl-days" className="field num" dir="ltr" inputMode="numeric" value={d.durationDays} onChange={(e) => set({ durationDays: num(e.target.value) })} />
        </Field>
        <Field label="توضیح کوتاه" htmlFor="pl-desc">
          <input id="pl-desc" className="field" value={d.description} onChange={(e) => set({ description: e.target.value })} />
        </Field>
        <Field label="برچسب روی کارت" htmlFor="pl-badge" hint="مثلاً «محبوب»؛ خالی = بدون برچسب.">
          <input id="pl-badge" className="field" value={d.badge ?? ''} onChange={(e) => set({ badge: e.target.value || undefined })} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="امکانات (هر خط یک مورد)" htmlFor="pl-features">
            <textarea id="pl-features" className="field min-h-[110px] leading-7" value={d.featuresText} onChange={(e) => set({ featuresText: e.target.value })} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Toggle checked={d.active} onChange={(active) => set({ active })} label="پلن فعال" /> فعال (قابل خرید)
        </label>
        <Field label="ترتیب نمایش" htmlFor="pl-sort">
          <input id="pl-sort" className="field num w-24" dir="ltr" value={d.sort} onChange={(e) => set({ sort: num(e.target.value) })} />
        </Field>
      </div>
    </Modal>
  );
}

export function AdminPlans() {
  const { data, loading, reload } = useLoad(() => backend.admin.plans());
  const [editing, setEditing] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState<Plan | null>(null);
  return (
    <>
      <PageHeader
        title="پلن‌ها و اشتراک"
        text="قیمت، مدت و امکانات هر پلن. تغییر قیمت روی خریدهای بعدی اعمال می‌شود."
        onReload={reload}
        loading={loading}
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={() => setEditing({ id: `plan-${Date.now().toString(36)}`, name: '', description: '', priceToman: 0, durationDays: 30, features: [], active: true, sort: (data?.length ?? 0) + 1 })}
          >
            <Plus size={16} /> پلن جدید
          </button>
        }
      />
      {!data ? (
        <Loading />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.map((p) => (
            <section key={p.id} className={clsx('card flex flex-col p-5', !p.active && 'opacity-60')}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{p.name}</p>
                  <p className="text-xs text-muted">{p.description}</p>
                </div>
                {p.badge && <Badge tone="accent">{p.badge}</Badge>}
              </div>
              <p className="num mt-3 font-display text-xl font-bold">{p.priceToman ? tomanFmt(p.priceToman) : 'رایگان'}</p>
              <p className="num text-xs text-faint">{fmtNum(p.durationDays)} روز</p>
              <ul className="mt-3 flex-1 list-disc ps-4 text-[12px] leading-6 text-muted">
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <div className="mt-4 flex items-center gap-2">
                {p.active ? <Badge tone="gain">فعال</Badge> : <Badge>غیرفعال</Badge>}
                <button type="button" className="icon-btn ms-auto h-8 w-8" onClick={() => setEditing(p)} aria-label={`ویرایش ${p.name}`}>
                  <Pencil size={15} />
                </button>
                <button type="button" className="icon-btn h-8 w-8 hover:text-loss" onClick={() => setDeleting(p)} aria-label={`حذف ${p.name}`}>
                  <Trash2 size={15} />
                </button>
              </div>
            </section>
          ))}
        </div>
      )}
      {editing && (
        <PlanEditor
          plan={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void reload();
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="حذف پلن"
        message={`پلن «${deleting?.name}» حذف شود؟ اگر کاربری روی این پلن باشد حذف انجام نمی‌شود.`}
        confirmLabel="حذف"
        onConfirm={async () => {
          if (deleting && (await act(backend.admin.deletePlan(deleting.id), 'پلن حذف شد')) !== null) void reload();
        }}
      />
    </>
  );
}

// ---------- payments ----------
const PAY_STATUS: Record<Payment['status'], [string, 'gain' | 'amber' | 'loss' | 'muted' | 'accent']> = {
  paid: ['موفق', 'gain'],
  pending: ['در انتظار', 'amber'],
  review: ['در انتظار تأیید', 'accent'],
  failed: ['ناموفق', 'loss'],
  refunded: ['مسترد', 'muted'],
};

export function AdminPayments() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | Payment['status']>('all');
  const [gateway, setGateway] = useState<'all' | PaymentMethod>('all');
  const [page, setPage] = useState(1);
  const [refund, setRefund] = useState<Payment | null>(null);
  const { data, loading, reload } = useLoad(() => backend.admin.payments({ q, status, gateway, page, pageSize: 15 }), [q, status, gateway, page]);
  return (
    <>
      <PageHeader title="تراکنش‌ها" text="همه‌ی پرداخت‌های اشتراک با وضعیت درگاه و کد پیگیری بانک." onReload={reload} loading={loading} />
      <div className="card mb-4 grid gap-2 p-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            id="pay-search"
            className="field pr-9"
            placeholder="نام، موبایل، کد پیگیری یا شماره سفارش…"
            value={q}
            onChange={(e) => {
              setQ(toLatinDigits(e.target.value));
              setPage(1);
            }}
          />
        </div>
        <div className="sm:w-40">
          <Select
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[{ value: 'all', label: 'همه‌ی وضعیت‌ها' }, ...Object.entries(PAY_STATUS).map(([k, [l]]) => ({ value: k as Payment['status'], label: l }))]}
          />
        </div>
        <div className="sm:w-40">
          <Select
            value={gateway}
            onChange={(v) => {
              setGateway(v);
              setPage(1);
            }}
            options={[{ value: 'all', label: 'همه‌ی روش‌ها' }, ...Object.entries(PAYMENT_METHOD_NAMES).map(([k, l]) => ({ value: k as PaymentMethod, label: l }))]}
          />
        </div>
      </div>
      <div className="card overflow-x-auto">
        {!data ? (
          <Loading />
        ) : (
          <table className="w-full min-w-[980px] text-[13px]">
            <thead className="bg-raised/40">
              <tr>
                {['تاریخ', 'کاربر', 'پلن', 'مبلغ', 'تخفیف', 'درگاه', 'شماره سفارش', 'کد پیگیری', 'وضعیت', ''].map((h) => (
                  <th key={h} className="th">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className="border-t border-line/50 hover:bg-raised/30">
                  <td className="td num text-muted">{dateTime(p.createdAt)}</td>
                  <td className="td">
                    <p className="font-semibold">{p.userName}</p>
                    <p className="num text-[11px] text-faint" dir="ltr" style={{ textAlign: 'right' }}>
                      {fmtPhone(p.phone)}
                    </p>
                  </td>
                  <td className="td">{p.planName}</td>
                  <td className="td num font-semibold">
                    {tomanFmt(p.amountToman)}
                    {p.transfer && <p className="text-[11px] font-normal text-faint">کد {faDigits(String(p.transfer.code).padStart(3, '0'))}</p>}
                  </td>
                  <td className="td" dir="ltr" style={{ textAlign: 'right' }}>
                    {p.discountCode ?? '—'}
                  </td>
                  <td className="td">{PAYMENT_METHOD_NAMES[p.gateway]}</td>
                  <td className="td num text-[11px] text-muted" dir="ltr" style={{ textAlign: 'right' }}>
                    {p.authority ?? '—'}
                  </td>
                  <td className="td num">{p.refId ? faDigits(p.refId) : '—'}</td>
                  <td className="td">
                    <Badge tone={PAY_STATUS[p.status][1]}>{PAY_STATUS[p.status][0]}</Badge>
                  </td>
                  <td className="td text-end">
                    {p.status === 'paid' && (
                      <button type="button" className="btn-ghost px-2 py-1 text-[12px]" onClick={() => setRefund(p)}>
                        <Undo2 size={13} /> استرداد
                      </button>
                    )}
                    {p.transfer && (p.status === 'review' || p.status === 'pending') && (
                      <Link to="/admin/cards" className="btn-soft px-2 py-1 text-[12px]">
                        بررسی <ArrowLeft size={13} />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {data && <Pager page={page} total={data.total} pageSize={15} onPage={setPage} />}
      <ConfirmDialog
        open={!!refund}
        onClose={() => setRefund(null)}
        title="ثبت استرداد وجه"
        message={`تراکنش ${refund ? tomanFmt(refund.amountToman) : ''} ${refund?.userName ?? ''} مسترد علامت بخورد؟ ${refund?.transfer ? 'پول را خودتان به کارت پرداخت‌کننده برگردانید' : 'برگشت پول از پنل درگاه انجام می‌شود'}؛ این‌جا فقط وضعیت ثبت می‌شود.`}
        confirmLabel="ثبت استرداد"
        onConfirm={async () => {
          if (refund && (await act(backend.admin.refundPayment(refund.id), 'استرداد ثبت شد'))) void reload();
        }}
      />
    </>
  );
}

// ---------- discounts ----------
export function AdminDiscounts() {
  const { data, loading, reload } = useLoad(() => backend.admin.discounts());
  const [editing, setEditing] = useState<DiscountCode | null>(null);
  const today = localDayKey();
  return (
    <>
      <PageHeader
        title="کدهای تخفیف"
        text="درصد تخفیف، سقف استفاده و تاریخ انقضا."
        onReload={reload}
        loading={loading}
        actions={
          <button type="button" className="btn-primary" onClick={() => setEditing({ id: `dc_${Date.now().toString(36)}`, code: '', percent: 10, maxUses: 100, used: 0, active: true, expiresAt: addDays(today, 30) })}>
            <Plus size={16} /> کد جدید
          </button>
        }
      />
      <div className="card overflow-x-auto">
        {!data ? (
          <Loading />
        ) : (
          <table className="w-full min-w-[720px] text-[13px]">
            <thead className="bg-raised/40">
              <tr>
                {['کد', 'تخفیف', 'استفاده', 'انقضا', 'وضعیت', ''].map((h) => (
                  <th key={h} className="th">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d) => {
                const expired = !!d.expiresAt && d.expiresAt < today;
                return (
                  <tr key={d.id} className="border-t border-line/50">
                    <td className="td font-bold" dir="ltr" style={{ textAlign: 'right' }}>
                      {d.code}
                    </td>
                    <td className="td num">{faDigits(d.percent)}٪</td>
                    <td className="td num">
                      {fmtNum(d.used)} از {fmtNum(d.maxUses)}
                    </td>
                    <td className={clsx('td num', expired && 'text-loss')}>{d.expiresAt ? fmtDayLong(d.expiresAt) : 'بدون انقضا'}</td>
                    <td className="td">{!d.active ? <Badge>غیرفعال</Badge> : expired ? <Badge tone="loss">منقضی</Badge> : d.used >= d.maxUses ? <Badge tone="amber">تمام شده</Badge> : <Badge tone="gain">فعال</Badge>}</td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        <button type="button" className="icon-btn h-8 w-8" onClick={() => setEditing(d)} aria-label={`ویرایش ${d.code}`}>
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn h-8 w-8 hover:text-loss"
                          aria-label={`حذف ${d.code}`}
                          onClick={async () => {
                            if ((await act(backend.admin.deleteDiscount(d.id), 'کد حذف شد')) !== null) void reload();
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title={editing.code ? `ویرایش ${editing.code}` : 'کد تخفیف جدید'}
          footer={
            <>
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>
                انصراف
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!editing.code.trim() || editing.percent <= 0 || editing.percent > 100}
                onClick={async () => {
                  if (await act(backend.admin.saveDiscount(editing), 'کد تخفیف ذخیره شد')) {
                    setEditing(null);
                    void reload();
                  }
                }}
              >
                ذخیره
              </button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="کد" htmlFor="dc-code" hint="حروف انگلیسی و عدد، مثل NOROOZ1405">
              <input id="dc-code" className="field uppercase" dir="ltr" value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="درصد تخفیف" htmlFor="dc-pct">
              <input id="dc-pct" className="field num" dir="ltr" inputMode="numeric" value={editing.percent} onChange={(e) => setEditing({ ...editing, percent: Math.min(100, num(e.target.value)) })} />
            </Field>
            <Field label="سقف استفاده" htmlFor="dc-max">
              <input id="dc-max" className="field num" dir="ltr" inputMode="numeric" value={editing.maxUses} onChange={(e) => setEditing({ ...editing, maxUses: num(e.target.value) })} />
            </Field>
            <div>
              <span className="label">تاریخ انقضا</span>
              <DatePicker id="dc-exp" value={editing.expiresAt ?? ''} onChange={(expiresAt) => setEditing({ ...editing, expiresAt })} min={today} max={addDays(today, 3650)} />
              {editing.expiresAt && (
                <button type="button" className="mt-1 text-[11px] text-accent-ink hover:underline" onClick={() => setEditing({ ...editing, expiresAt: undefined })}>
                  بدون انقضا
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Toggle checked={editing.active} onChange={(active) => setEditing({ ...editing, active })} label="فعال" /> فعال
            </label>
          </div>
        </Modal>
      )}
    </>
  );
}

// ---------- gateways ----------
const GATEWAY_HELP: Record<GatewayId, string> = {
  zarinpal: 'مرچنت کد ۳۶ کاراکتری از پنل زرین‌پال. در حالت سندباکس از sandbox.zarinpal.com استفاده می‌شود.',
  zibal: 'مرچنت از پنل زیبال. برای تست مقدار zibal را وارد کنید.',
  idpay: 'API Key از پنل آیدی‌پی. حالت سندباکس هدر X-SANDBOX را می‌فرستد.',
  nextpay: 'API Key از پنل نکست‌پی.',
  payir: 'API Key از پنل pay.ir. برای تست مقدار test را وارد کنید.',
};

function GatewayCard({ g, onSaved }: { g: GatewayConfig; onSaved: () => void }) {
  const [d, setD] = useState(g);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const dirty = JSON.stringify(d) !== JSON.stringify(g);
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center gap-3">
        <p className="font-bold">{g.name}</p>
        {d.enabled ? <Badge tone="gain">فعال</Badge> : <Badge>غیرفعال</Badge>}
        {d.sandbox && <Badge tone="amber">سندباکس</Badge>}
        <div className="ms-auto">
          <Toggle checked={d.enabled} onChange={(enabled) => setD({ ...d, enabled })} label={`فعال بودن ${g.name}`} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Field label="مرچنت / کلید API" htmlFor={`gw-${g.id}`} hint={GATEWAY_HELP[g.id]}>
          <input id={`gw-${g.id}`} className="field font-mono text-[13px]" dir="ltr" value={d.merchantId} onChange={(e) => setD({ ...d, merchantId: e.target.value.trim() })} />
        </Field>
        <Field label="اولویت" htmlFor={`gw-pr-${g.id}`}>
          <input id={`gw-pr-${g.id}`} className="field num w-20" dir="ltr" value={d.priority} onChange={(e) => setD({ ...d, priority: num(e.target.value) })} />
        </Field>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <Toggle checked={d.sandbox} onChange={(sandbox) => setD({ ...d, sandbox })} label="حالت سندباکس" /> حالت سندباکس (آزمایشی)
      </label>
      {result && <p className={clsx('mt-3 rounded-xl px-3 py-2 text-xs leading-6', result.ok ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss')}>{result.message}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          className="btn-soft py-1.5"
          disabled={testing}
          onClick={async () => {
            setTesting(true);
            setResult(await act(backend.admin.testGateway(g.id)));
            setTesting(false);
          }}
        >
          <PlugZap size={15} /> تست اتصال
        </button>
        <button
          type="button"
          className="btn-primary py-1.5"
          disabled={!dirty}
          onClick={async () => {
            if (await act(backend.admin.saveGateway(d), 'تنظیمات درگاه ذخیره شد')) onSaved();
          }}
        >
          ذخیره
        </button>
      </div>
    </section>
  );
}

export function AdminGateways() {
  const { data, loading, reload } = useLoad(() => backend.admin.gateways());
  return (
    <>
      <PageHeader title="درگاه‌های پرداخت" text="درگاه‌های فعال به ترتیب اولویت در صفحه‌ی خرید نمایش داده می‌شوند. همه‌ی مبالغ به تومان ثبت و به ریال به درگاه ارسال می‌شوند." onReload={reload} loading={loading} />
      {!data ? <Loading /> : <div className="grid gap-4 lg:grid-cols-2">{data.map((g) => <GatewayCard key={g.id + JSON.stringify(g)} g={g} onSaved={reload} />)}</div>}
    </>
  );
}
