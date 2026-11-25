import clsx from 'clsx';
import { BadgePercent, Bot, Check, CircleCheck, CircleX, CreditCard, Crown, Hourglass, LoaderCircle, ShieldCheck, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGo } from '../lib/nav';
import { Link } from '../components/ui/AppLink';
import { Meter } from '../components/ui/controls';
import { diffDays, fmtDayLong, localDayKey } from '../lib/calendar';
import { faDigits, fmtNum } from '../lib/format';
import { planDaysLeft } from '../lib/stats';
import { BackendError, backend } from '../services';
import { AUTOTEST_LABEL, addonOffered, orderOf, paidPlanRunning } from '../services/plan';
import { PAYMENT_METHOD_NAMES, type Payment, type PaymentKind, type PaymentMethod, type Plan } from '../services/types';
import { useAuth } from '../store/useAuth';
import { toast, useStore } from '../store/useStore';

export const toman = (n: number) => `${fmtNum(n)} تومان`;

const STATUS: Record<Payment['status'], { label: string; cls: string }> = {
  paid: { label: 'موفق', cls: 'bg-gain/15 text-gain' },
  pending: { label: 'در انتظار', cls: 'bg-amber/15 text-amber' },
  review: { label: 'در انتظار تأیید', cls: 'bg-accent/15 text-accent-ink' },
  failed: { label: 'ناموفق', cls: 'bg-loss/15 text-loss' },
  refunded: { label: 'مسترد شده', cls: 'bg-raised text-muted' },
};

export default function Billing() {
  const user = useStore((s) => s.user);
  const refresh = useAuth((s) => s.refresh);
  const go = useGo();
  const [params, setParams] = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [gateways, setGateways] = useState<{ id: PaymentMethod; name: string }[]>([]);
  const [history, setHistory] = useState<Payment[]>([]);
  const [planId, setPlanId] = useState<string>('');
  const [gateway, setGateway] = useState<PaymentMethod | ''>('');
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState<{ code: string; percent: number; finalToman: number } | null>(null);
  const [codeError, setCodeError] = useState('');
  const [busy, setBusy] = useState<'code' | 'pay' | null>(null);
  const [result, setResult] = useState<Payment | null>(null);
  // the auto-test add-on: with the plan, alone (for a running paid plan), or not at all; ?addon=1 comes from the tester
  const [kind, setKind] = useState<PaymentKind>(params.get('addon') ? 'plan_autotest' : 'plan');
  const today = localDayKey();
  const planRunning = paidPlanRunning({ planId: user.plan.id, planEndsAt: user.plan.endsAt }, today);
  const addonActive = !!user.autoTestEndsAt && user.autoTestEndsAt >= today;

  const load = () => {
    void backend.plans().then((p) => {
      const paid = p.filter((x) => x.priceToman > 0);
      setPlans(paid);
      setPlanId((cur) => cur || paid.find((x) => x.badge)?.id || paid[0]?.id || '');
    });
    void backend.gateways().then((g) => {
      setGateways(g);
      setGateway((cur) => cur || g[0]?.id || '');
    });
    void backend.myPayments().then(setHistory).catch(() => setHistory([]));
  };
  useEffect(load, []);

  // back from the gateway: ?payment=<id>
  const paymentId = params.get('payment');
  useEffect(() => {
    if (!paymentId) return;
    void backend
      .payment(paymentId)
      .then((p) => {
        // The banner above reports the outcome, so no toast here.
        setResult(p);
        if (p.status === 'paid') {
          void refresh();
          setCode('');
          setDiscount(null);
        }
        load();
      })
      .catch(() => setResult(null));
  }, [paymentId]);

  const plan = plans.find((p) => p.id === planId);
  const withAddon = !!plan && addonOffered(plan);
  const orderKind: PaymentKind = withAddon ? (kind === 'autotest' && !planRunning ? 'plan_autotest' : kind) : 'plan';
  const order = plan ? orderOf(plan, orderKind) : null;
  const base = order?.toman ?? 0;
  const price = discount ? Math.round((base * (100 - discount.percent)) / 100) : base;
  useEffect(() => {
    // from the tester's lock: the add-on alone when a paid plan is running
    if (params.get('addon') && planRunning) setKind('autotest');
  }, [planRunning]);
  const left = planDaysLeft(user.plan.endsAt);
  const total = Math.max(1, diffDays(user.plan.startedAt, user.plan.endsAt));

  const applyCode = async () => {
    if (!plan || !code.trim()) return;
    setBusy('code');
    setCodeError('');
    try {
      const r = await backend.checkDiscount(code.trim(), plan.id, { autoTest: orderKind === 'plan_autotest', addonOnly: orderKind === 'autotest' });
      setDiscount({ code: code.trim().toUpperCase(), ...r });
      toast(`${faDigits(r.percent)}٪ تخفیف اعمال شد`);
    } catch (e) {
      setDiscount(null);
      setCodeError(e instanceof BackendError ? e.message : 'بررسی کد انجام نشد.');
    } finally {
      setBusy(null);
    }
  };

  const pay = async () => {
    if (!plan || !gateway) return;
    setBusy('pay');
    try {
      const r = await backend.checkout({ planId: plan.id, gateway, discountCode: discount?.code, autoTest: orderKind === 'plan_autotest', addonOnly: orderKind === 'autotest' });
      // an in-app page (card to card, the demo's sandbox bank) or the bank's own page
      if (r.redirectUrl.startsWith('/') || r.redirectUrl.startsWith('#/')) go(r.redirectUrl.replace(/^#/, ''));
      else window.location.href = r.redirectUrl;
    } catch (e) {
      toast(e instanceof BackendError ? e.message : 'اتصال به درگاه انجام نشد. دوباره تلاش کنید.', 'error');
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold">اشتراک و پرداخت</h1>
      <p className="mb-6 mt-1 text-sm text-muted">پلن را انتخاب کنید و پرداخت کنید؛ روزهای باقی‌مانده‌ی اشتراک فعلی به پلن جدید اضافه می‌شود.</p>

      {result && (
        <div
          role="status"
          className={clsx(
            'mb-5 flex flex-wrap items-center gap-3 rounded-2xl border p-4',
            result.status === 'paid' ? 'border-gain/50 bg-gain/10' : result.status === 'review' || result.status === 'pending' ? 'border-accent/50 bg-accent/10' : 'border-loss/50 bg-loss/10',
          )}
        >
          {result.status === 'paid' ? (
            <CircleCheck className="text-gain" size={24} />
          ) : result.status === 'review' || result.status === 'pending' ? (
            <Hourglass className="text-accent-ink" size={24} />
          ) : (
            <CircleX className="text-loss" size={24} />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-bold">
              {result.status === 'paid'
                ? `پرداخت موفق — ${result.planName} فعال شد`
                : result.status === 'review'
                  ? 'پرداخت ثبت شد و در انتظار تأیید است'
                  : result.status === 'pending'
                    ? 'پرداخت هنوز کامل نشده است'
                    : 'پرداخت انجام نشد'}
            </p>
            <p className="num text-xs text-muted">
              {toman(result.amountToman)} · {PAYMENT_METHOD_NAMES[result.gateway]}
              {result.refId && ` · کد پیگیری: ${faDigits(result.refId)}`}
              {result.status === 'failed' && (result.transfer ? ` · ${result.transfer.note ?? 'این پرداخت بسته شد.'}` : ' · اگر مبلغی کسر شده باشد تا ۷۲ ساعت به حسابتان برمی‌گردد.')}
            </p>
          </div>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setResult(null);
              params.delete('payment');
              setParams(params, { replace: true });
            }}
          >
            بستن
          </button>
        </div>
      )}

      <section className="card mb-6 flex flex-wrap items-center gap-5 p-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber/15 text-amber">
          <Crown size={20} />
        </span>
        <div className="min-w-[12rem] flex-1">
          <p className="text-xs text-muted">اشتراک فعلی</p>
          <p className="font-bold">{user.plan.name}</p>
          <p className="num text-xs text-faint">
            {fmtDayLong(user.plan.startedAt)} تا {fmtDayLong(user.plan.endsAt)}
          </p>
        </div>
        <div className="w-full sm:w-64">
          <div className="num mb-1.5 flex justify-between text-xs">
            <span className="text-muted">روزهای باقی‌مانده</span>
            <b>
              {fmtNum(left)} از {fmtNum(total)}
            </b>
          </div>
          <Meter value={left / total} tone={left / total < 0.2 ? 'loss' : 'gain'} className="h-2" />
        </div>
        <div className="flex w-full items-center gap-3 border-t border-line/60 pt-4 text-[13px]">
          <Bot size={18} className={addonActive ? 'text-gain' : 'text-faint'} />
          <span className="text-muted">افزونه‌ی {AUTOTEST_LABEL}:</span>
          <b className={addonActive ? 'text-gain' : 'text-faint'}>{addonActive ? `فعال تا ${fmtDayLong(user.autoTestEndsAt!)}` : 'غیرفعال'}</b>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid h-fit gap-3 sm:grid-cols-3 lg:col-start-1 lg:row-start-1">
          {plans.map((p) => {
            const on = p.id === planId;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setPlanId(p.id);
                  setDiscount(null);
                  setCodeError('');
                }}
                className={clsx('card relative flex flex-col p-5 text-start transition', on ? 'border-accent ring-2 ring-accent/30' : 'hover:border-faint/50')}
              >
                {p.badge && <span className="absolute -top-2.5 left-4 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-white">{p.badge}</span>}
                <p className="font-bold">{p.name}</p>
                <p className="mt-0.5 text-xs text-muted">{p.description}</p>
                <p className="num mt-4 font-display text-2xl font-bold">{fmtNum(p.priceToman / 1000)}</p>
                <p className="text-xs text-muted">هزار تومان · {fmtNum(p.durationDays)} روز</p>
                {addonOffered(p) && (
                  <p className="num mt-2 flex items-center gap-1 text-[11px] text-accent-ink">
                    <Bot size={12} /> تست خودکار: {fmtNum((p.autoTestToman ?? 0) / 1000)} هزار تومان اضافه
                  </p>
                )}
                <ul className="mt-4 flex flex-col gap-1.5 text-[12px]">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <Check size={13} className="mt-1 shrink-0 text-gain" />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {withAddon && plan && (
          <section className="card p-5 lg:col-start-1 lg:row-start-2" aria-labelledby="addon-title">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent-ink">
                <Bot size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="addon-title" className="font-bold">
                  افزونه‌ی {AUTOTEST_LABEL} <span className="text-xs font-normal text-muted">(پرداخت جداگانه)</span>
                </h2>
                <p className="mt-1 text-[12px] leading-6 text-muted">
                  استراتژی‌های Pine Script را روی داده‌ی واقعی بازار خودکار بک‌تست کنید: گزارش عملکرد، فهرست معاملات و منحنی سرمایه، مثل Strategy Tester تریدینگ‌ویو. نوشتن اسکریپت و اجرای اندیکاتورها بدون افزونه هم آزاد است.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="افزونه‌ی تست خودکار">
              {(
                [
                  ['plan', 'بدون افزونه', 'فقط اشتراک'],
                  ['plan_autotest', 'همراه اشتراک', `${fmtNum(plan.autoTestToman ?? 0)} تومان اضافه`],
                  ['autotest', 'فقط افزونه', planRunning ? `${fmtNum(plan.autoTestToman ?? 0)} تومان · ${fmtNum(plan.durationDays)} روز` : 'برای اشتراک فعال'],
                ] as [PaymentKind, string, string][]
              ).map(([k, label, hint]) => {
                const disabled = k === 'autotest' && !planRunning;
                const on = orderKind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={disabled}
                    onClick={() => {
                      setKind(k);
                      setDiscount(null);
                      setCodeError('');
                    }}
                    className={clsx('rounded-xl border px-3 py-2.5 text-start text-[13px] transition disabled:cursor-not-allowed disabled:opacity-50', on ? 'border-accent bg-accent/10' : 'border-line hover:border-faint/60')}
                  >
                    <span className="block font-semibold">{label}</span>
                    <span className="num block text-[11px] text-muted">{hint}</span>
                  </button>
                );
              })}
            </div>
            {orderKind === 'autotest' && (
              <p className="mt-3 text-[11px] leading-5 text-faint">اشتراک فعلی شما تغییری نمی‌کند و افزونه برای {fmtNum(plan.durationDays)} روز ({plan.name}) فعال یا تمدید می‌شود.</p>
            )}
          </section>
        )}

        <aside className="card h-fit p-5 lg:row-span-2 lg:row-start-1 lg:col-start-2">
          <h2 className="mb-4 font-bold">خلاصه‌ی سفارش</h2>
          {plan ? (
            <>
              <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-[13px]">
                {orderKind !== 'autotest' && (
                  <>
                    <dt className="text-muted">{plan.name}</dt>
                    <dd className="num">{toman(plan.priceToman)}</dd>
                  </>
                )}
                {orderKind !== 'plan' && (
                  <>
                    <dt className="text-muted">{AUTOTEST_LABEL}</dt>
                    <dd className="num">{toman(plan.autoTestToman ?? 0)}</dd>
                  </>
                )}
                {discount && (
                  <>
                    <dt className="text-gain">تخفیف {faDigits(discount.percent)}٪</dt>
                    <dd className="num text-gain">−{toman(base - price)}</dd>
                  </>
                )}
                <dt className="border-t border-line/60 pt-2 font-bold">مبلغ قابل پرداخت</dt>
                <dd className="num border-t border-line/60 pt-2 font-bold">{toman(price)}</dd>
              </dl>
              <label className="label mt-5" htmlFor="discount-code">
                کد تخفیف
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <BadgePercent size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint" />
                  <input
                    id="discount-code"
                    className={clsx('field pr-9 uppercase', codeError && 'border-loss')}
                    dir="ltr"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setCodeError('');
                    }}
                    placeholder="PAEEZ1405"
                  />
                </div>
                <button type="button" className="btn-soft" onClick={applyCode} disabled={!code.trim() || busy !== null}>
                  {busy === 'code' ? <LoaderCircle size={15} className="animate-spin" /> : 'اعمال'}
                </button>
              </div>
              {codeError && <p className="mt-1.5 text-xs text-loss">{codeError}</p>}

              <p className="label mt-5">روش پرداخت</p>
              <div className="flex flex-col gap-2" role="radiogroup" aria-label="روش پرداخت">
                {gateways.length === 0 && <p className="text-xs text-muted">روش پرداختی فعال نشده است.</p>}
                {gateways.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    role="radio"
                    aria-checked={gateway === g.id}
                    onClick={() => setGateway(g.id)}
                    className={clsx('flex items-center gap-3 rounded-xl border px-3 py-2.5 text-start text-[13px] transition', gateway === g.id ? 'border-accent bg-accent/10' : 'border-line hover:border-faint/60')}
                  >
                    <span className={clsx('flex h-4 w-4 items-center justify-center rounded-full border-2', gateway === g.id ? 'border-accent' : 'border-faint')}>
                      {gateway === g.id && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                    </span>
                    {g.id === 'card' ? <WalletCards size={16} className="text-muted" /> : <CreditCard size={16} className="text-muted" />}
                    <span className="flex-1">{g.name}</span>
                    {g.id === 'card' && <span className="text-[11px] text-faint">با هر کارت بانکی</span>}
                  </button>
                ))}
              </div>
              <button type="button" className="btn-primary mt-5 h-11 w-full rounded-xl" disabled={!gateway || busy !== null} onClick={pay}>
                {busy === 'pay' ? <LoaderCircle size={17} className="animate-spin" /> : gateway === 'card' ? 'ادامه: کارت به کارت' : `پرداخت ${toman(price)}`}
              </button>
              <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-5 text-faint">
                <ShieldCheck size={13} className="mt-0.5 shrink-0" />
                {gateway === 'card'
                  ? 'شماره‌ی کارت و مبلغ دقیق (به ریال) در صفحه‌ی بعد نمایش داده می‌شود. پس از تأیید واریز، اشتراک فعال می‌شود.'
                  : 'پرداخت در صفحه‌ی امن بانک (شاپرک) انجام می‌شود و اطلاعات کارت شما نزد ما ذخیره نمی‌شود.'}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">در حال بارگذاری پلن‌ها…</p>
          )}
        </aside>
      </div>

      <h2 className="mb-3 mt-10 font-display text-base font-bold">تاریخچه‌ی پرداخت</h2>
      <div className="card overflow-x-auto">
        {history.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">هنوز پرداختی ثبت نشده است.</p>
        ) : (
          <table className="w-full min-w-[640px] text-[13px]">
            <thead className="bg-raised/40">
              <tr>
                {['تاریخ', 'پلن', 'مبلغ', 'روش پرداخت', 'کد پیگیری', 'وضعیت', ''].map((h) => (
                  <th key={h} className="th">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((p) => (
                <tr key={p.id} className="border-t border-line/50">
                  <td className="td num">{fmtDayLong(localDayKey(new Date(p.createdAt)))}</td>
                  <td className="td">{p.planName}</td>
                  <td className="td num">{toman(p.amountToman)}</td>
                  <td className="td">{PAYMENT_METHOD_NAMES[p.gateway]}</td>
                  <td className="td num">{p.refId ? faDigits(p.refId) : '—'}</td>
                  <td className="td">
                    <span className={clsx('rounded-md px-2 py-0.5 text-[11px] font-bold', STATUS[p.status].cls)}>{STATUS[p.status].label}</span>
                  </td>
                  <td className="td text-end">
                    {p.transfer && (
                      <Link to={`/billing/card?payment=${encodeURIComponent(p.id)}`} className="text-[12px] font-semibold text-accent-ink hover:underline">
                        {p.status === 'pending' ? 'ادامه‌ی پرداخت' : 'جزئیات'}
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
