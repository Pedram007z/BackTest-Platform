import { CreditCard, LoaderCircle, Lock, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { faDigits, fmtNum } from '../lib/format';
import { completeSandboxPayment, sandboxPaymentInfo } from '../services/localBackend';
import { PAYMENT_METHOD_NAMES } from '../services/types';

/**
 * Stand-in for the bank's payment page in the demo (no server, no real gateway).
 * With the API server, checkout sends the browser to the real gateway instead.
 */
export default function SandboxPay() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const id = params.get('payment') ?? '';
  const payment = sandboxPaymentInfo(id);
  const [busy, setBusy] = useState<'ok' | 'cancel' | null>(null);
  // Bank pages give about ten minutes before the order lapses.
  const [left, setLeft] = useState(600);

  const finish = (ok: boolean) => {
    setBusy(ok ? 'ok' : 'cancel');
    setTimeout(() => {
      completeSandboxPayment(id, ok);
      navigate(`/billing?payment=${encodeURIComponent(id)}`, { replace: true });
    }, 900);
  };

  useEffect(() => {
    if (busy || !payment) return;
    if (left <= 0) {
      finish(false);
      return;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, busy]);

  if (!payment) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-bg p-6 text-center">
        <p className="text-muted">تراکنش پیدا نشد.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#eef1f6] px-4 py-10 text-[#1b2433]" style={{ colorScheme: 'light' }}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_-20px_rgba(20,30,60,0.35)]">
        <div className="flex items-center justify-between bg-[#1f3c88] px-5 py-4 text-white">
          <div>
            <p className="text-[11px] opacity-80">درگاه پرداخت اینترنتی</p>
            <p className="font-bold">{PAYMENT_METHOD_NAMES[payment.gateway]}</p>
          </div>
          <span className="rounded-md bg-amber px-2 py-0.5 text-[11px] font-bold text-black">سندباکس — پرداخت آزمایشی</span>
        </div>
        <div className="flex flex-col gap-4 p-5">
          <dl className="grid grid-cols-[1fr_auto] gap-y-2 rounded-xl bg-[#f5f7fb] p-4 text-[13px]">
            <dt className="text-[#5b6577]">پذیرنده</dt>
            <dd className="font-semibold">بک‌تست‌لب</dd>
            <dt className="text-[#5b6577]">بابت</dt>
            <dd>{payment.planName}</dd>
            <dt className="text-[#5b6577]">شماره سفارش</dt>
            <dd className="num" dir="ltr">
              {payment.authority}
            </dd>
            <dt className="font-bold">مبلغ</dt>
            <dd className="num font-bold">{fmtNum(payment.amountToman * 10)} ریال</dd>
          </dl>
          <div>
            <label className="mb-1 block text-[12px] text-[#5b6577]" htmlFor="sandbox-card">
              شماره کارت
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[#d6dbe6] px-3 py-2.5">
              <CreditCard size={16} className="text-[#8a93a5]" />
              <input id="sandbox-card" className="num w-full bg-transparent text-left tracking-widest outline-none" dir="ltr" defaultValue="6037 9975 0000 1234" readOnly />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[12px]">
            {[
              ['CVV2', '***'],
              ['ماه / سال', '۰۸ / ۰۷'],
              ['رمز دوم', '••••••'],
            ].map(([l, v]) => (
              <div key={l}>
                <p className="mb-1 text-[#5b6577]">{l}</p>
                <div className="num rounded-xl border border-[#d6dbe6] px-3 py-2.5 text-center">{v}</div>
              </div>
            ))}
          </div>
          <p className="flex items-start gap-1.5 rounded-xl bg-[#fff6e0] px-3 py-2 text-[12px] leading-6 text-[#7a5600]">
            <ShieldCheck size={15} className="mt-1 shrink-0" />
            این صفحه فقط برای نسخه‌ی نمایشی است و پولی جابه‌جا نمی‌شود. با راه‌اندازی سرور، کاربر به درگاه واقعی هدایت می‌شود.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={busy !== null} onClick={() => finish(true)} className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#1f9d55] font-bold text-white hover:brightness-110 disabled:opacity-60">
              {busy === 'ok' ? <LoaderCircle size={17} className="animate-spin" /> : <Lock size={15} />} پرداخت
            </button>
            <button type="button" disabled={busy !== null} onClick={() => finish(false)} className="h-11 rounded-xl border border-[#d6dbe6] font-semibold text-[#5b6577] hover:bg-[#f5f7fb] disabled:opacity-60">
              {busy === 'cancel' ? <LoaderCircle size={17} className="mx-auto animate-spin" /> : 'انصراف'}
            </button>
          </div>
          <p className="num text-center text-[11px] text-[#8a93a5]">
            زمان باقی‌مانده: {faDigits(`${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`)}
          </p>
        </div>
      </div>
    </div>
  );
}
