import clsx from 'clsx';
import { ArrowRight, Ban, CircleCheck, Copy, CopyCheck, Hourglass, Info, LoaderCircle, Timer, WalletCards } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from '../components/ui/AppLink';
import { faDigits, fmtNum, toLatinDigits } from '../lib/format';
import { BackendError, backend } from '../services';
import { canReportTransfer, fmtCardNumber } from '../services/cards';
import type { Payment } from '../services/types';
import { useAuth } from '../store/useAuth';
import { toast } from '../store/useStore';
import { toman } from './Billing';

/** 6,900,347 with the last three digits (the payment's code) marked. */
export function RialAmount({ amount, code, className }: { amount: number; code: number; className?: string }) {
  return (
    <span dir="ltr" className={clsx('num inline-block whitespace-nowrap', className)}>
      {fmtNum(Math.floor(amount / 1000))}٬<mark className="rounded-md bg-accent/20 px-0.5 text-accent-ink">{faDigits(String(code).padStart(3, '0'))}</mark>
    </span>
  );
}

const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return faDigits(h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`);
};

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    toast('کپی نشد؛ آن را دستی وارد کنید.', 'error');
    return false;
  }
}

/** Card-to-card payment: the card, the exact amount in rial, and "I have paid". */
export default function CardPay() {
  const [params] = useSearchParams();
  const id = params.get('payment') ?? '';
  const refresh = useAuth((s) => s.refresh);
  const [p, setP] = useState<Payment | null | undefined>(undefined);
  const [now, setNow] = useState(Date.now());
  const [payerCard, setPayerCard] = useState('');
  const [payerRef, setPayerRef] = useState('');
  const [error, setError] = useState<{ text: string; field?: string } | null>(null);
  const [busy, setBusy] = useState<'sent' | 'cancel' | null>(null);
  const [copied, setCopied] = useState<'card' | 'amount' | null>(null);

  const load = () =>
    backend
      .payment(id)
      .then((x) => setP(x.transfer ? x : null))
      .catch(() => setP(null));
  useEffect(() => {
    void load();
  }, [id]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  // a reported transfer turns "paid" when an admin confirms it
  useEffect(() => {
    if (p?.status !== 'review' && p?.status !== 'pending') return;
    const t = setInterval(() => void load(), p.status === 'review' ? 15_000 : 60_000);
    return () => clearInterval(t);
  }, [p?.status]);
  useEffect(() => {
    if (p?.status === 'paid') void refresh();
  }, [p?.status]);

  if (p === undefined) {
    return (
      <div className="flex justify-center py-24 text-muted">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }
  if (!p?.transfer) {
    return (
      <div className="mx-auto max-w-[560px] px-4 py-16 text-center">
        <p className="font-bold">این پرداخت پیدا نشد.</p>
        <Link to="/billing" className="btn-soft mt-4 inline-flex">
          بازگشت به اشتراک و پرداخت
        </Link>
      </div>
    );
  }

  const t = p.transfer;
  const left = t.expiresAt - now;
  const open = p.status === 'pending' && left > 0;
  const late = canReportTransfer(p, now) && !open;
  const canReport = canReportTransfer(p, now);

  const copyCard = async () => {
    if (await copy(t.cardNumber)) setCopied('card');
  };
  const copyAmount = async () => {
    if (await copy(String(t.amountRial))) setCopied('amount');
  };

  const report = async (e: FormEvent) => {
    e.preventDefault();
    setBusy('sent');
    setError(null);
    try {
      setP(await backend.reportTransfer(p.id, { payerCard: toLatinDigits(payerCard).trim(), payerRef: toLatinDigits(payerRef).trim() }));
      toast('واریز شما ثبت شد');
    } catch (x) {
      setError({ text: x instanceof BackendError ? x.message : 'ثبت انجام نشد؛ دوباره تلاش کنید.', field: x instanceof BackendError ? x.field : undefined });
    } finally {
      setBusy(null);
    }
  };
  const cancel = async () => {
    setBusy('cancel');
    try {
      setP(await backend.cancelTransfer(p.id));
    } catch (x) {
      toast(x instanceof BackendError ? x.message : 'انجام نشد.', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-[760px] px-4 pb-16 pt-6 sm:px-6">
      <Link to="/billing" className="mb-4 inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink">
        <ArrowRight size={15} /> اشتراک و پرداخت
      </Link>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">پرداخت کارت به کارت</h1>
          <p className="mt-1 text-sm text-muted">
            {p.planName} · <span className="num">{toman(p.amountToman)}</span>
          </p>
        </div>
        {open && (
          <span
            className={clsx('num flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold', left < 5 * 60_000 ? 'bg-loss/15 text-loss' : 'bg-amber/15 text-amber')}
            role="timer"
          >
            <Timer size={16} /> مهلت واریز: {clock(left)}
          </span>
        )}
      </div>

      {/* where the payment stands */}
      {p.status === 'review' && (
        <Banner tone="accent" icon={<Hourglass size={22} />} title="واریز شما ثبت شد و در انتظار تأیید است">
          پس از تطبیق مبلغ با حساب، اشتراک فعال می‌شود؛ این صفحه خودکار به‌روز می‌شود و می‌توانید آن را ببندید.
        </Banner>
      )}
      {p.status === 'paid' && (
        <Banner tone="gain" icon={<CircleCheck size={22} />} title={`پرداخت تأیید شد — ${p.planName} فعال شد`}>
          {p.refId && <span className="num">کد پیگیری: {faDigits(p.refId)} · </span>}
          <Link to="/dashboard" className="font-semibold text-accent-ink hover:underline">
            رفتن به داشبورد
          </Link>
        </Banner>
      )}
      {late && (
        <Banner tone="amber" icon={<Info size={22} />} title="مهلت پرداخت تمام شد">
          اگر مبلغ را واریز کرده‌اید، همین حالا «واریز کردم» را بزنید (تا ۲۴ ساعت پس از مهلت). اگر واریز نکرده‌اید، از صفحه‌ی اشتراک دوباره پرداخت کنید.
        </Banner>
      )}
      {p.status === 'failed' && t.closed === 'rejected' && (
        <Banner tone="loss" icon={<Ban size={22} />} title="واریز تأیید نشد">
          {t.note} اگر مبلغ از حساب شما کم شده،{' '}
          <Link to="/support" className="font-semibold text-accent-ink hover:underline">
            تیکت پشتیبانی
          </Link>{' '}
          بزنید و رسید واریز را بفرستید.
        </Banner>
      )}
      {p.status === 'failed' && !late && t.closed !== 'rejected' && (
        <Banner tone="muted" icon={<Ban size={22} />} title="این پرداخت بسته شد">
          <Link to="/billing" className="font-semibold text-accent-ink hover:underline">
            پرداخت دوباره از صفحه‌ی اشتراک
          </Link>
        </Banner>
      )}

      {/* step 1: the card and the exact amount */}
      <section className="card p-5">
        <h2 className="mb-4 font-bold">{p.status === 'pending' ? '۱. این مبلغ را به این کارت واریز کنید' : 'کارت و مبلغ این پرداخت'}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2b3a67] via-[#3b2f6b] to-[#16213e] p-5 text-white shadow-pop">
            <div className="flex items-center justify-between text-[13px] opacity-90">
              <span className="font-semibold">{t.bank || 'کارت بانکی'}</span>
              <WalletCards size={20} />
            </div>
            <p dir="ltr" className="mt-7 whitespace-nowrap text-center font-mono text-[1.15rem] font-semibold tracking-[0.06em] sm:text-[1.3rem]">
              {fmtCardNumber(t.cardNumber).replace(/-/g, ' ')}
            </p>
            <div className="mt-6 flex items-end justify-between gap-2">
              <div>
                <p className="text-[11px] opacity-70">به نام</p>
                <p className="font-bold">{t.holder}</p>
              </div>
              <button
                type="button"
                onClick={() => void copyCard()}
                className="flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1.5 text-[12px] font-semibold hover:bg-white/25"
              >
                {copied === 'card' ? <CopyCheck size={14} /> : <Copy size={14} />} {copied === 'card' ? 'کپی شد' : 'کپی شماره کارت'}
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-line p-5">
            <div>
              <p className="text-[13px] text-muted">مبلغ دقیق واریز</p>
              <p className="mt-2 font-display text-[1.9rem] font-bold leading-none">
                <RialAmount amount={t.amountRial} code={t.code} /> <span className="text-base font-semibold text-muted">ریال</span>
              </p>
              <button type="button" onClick={() => void copyAmount()} className="btn-soft mt-3 py-1.5 text-[12px]">
                {copied === 'amount' ? <CopyCheck size={14} /> : <Copy size={14} />} {copied === 'amount' ? 'کپی شد' : 'کپی مبلغ'}
              </button>
            </div>
            <p className="mt-4 rounded-xl bg-accent/10 px-3 py-2 text-[12px] leading-6">
              سه رقم آخر (<b className="num">{faDigits(String(t.code).padStart(3, '0'))}</b>) کد این پرداخت است. مبلغ را <b>دقیقاً</b> همین‌قدر و به <b>ریال</b> وارد کنید، نه گرد
              شده؛ با همین سه رقم پرداخت شما شناخته می‌شود.
            </p>
          </div>
        </div>
        {t.instructions && <p className="mt-4 rounded-xl bg-raised/60 px-3 py-2 text-[13px] leading-6 text-muted">{t.instructions}</p>}
      </section>

      {/* step 2: "I have paid" */}
      {canReport && (
        <section className="card mt-4 p-5">
          <h2 className="font-bold">۲. پس از واریز</h2>
          <p className="mt-1 text-[13px] text-muted">این دو مورد اختیاری‌اند ولی بررسی را سریع‌تر می‌کنند؛ هر دو در رسید بانک یا پیامک واریز هستند.</p>
          <form className="mt-4 flex flex-col gap-3" onSubmit={report} noValidate>
            {error && <p className="rounded-xl bg-loss/10 px-3 py-2 text-[13px] text-loss">{error.text}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="payer-card">
                  ۴ رقم آخر کارت شما
                </label>
                <input
                  id="payer-card"
                  className={clsx('field num', error?.field === 'payerCard' && 'border-loss')}
                  dir="ltr"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="1234"
                  value={payerCard}
                  onChange={(e) => setPayerCard(toLatinDigits(e.target.value).replace(/\D/g, ''))}
                />
              </div>
              <div>
                <label className="label" htmlFor="payer-ref">
                  شماره‌ی پیگیری / مرجع
                </label>
                <input
                  id="payer-ref"
                  className={clsx('field num', error?.field === 'payerRef' && 'border-loss')}
                  dir="ltr"
                  maxLength={30}
                  value={payerRef}
                  onChange={(e) => setPayerRef(toLatinDigits(e.target.value).trim())}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn-primary h-11 rounded-xl px-6" disabled={busy !== null}>
                {busy === 'sent' ? <LoaderCircle size={17} className="animate-spin" /> : 'واریز کردم'}
              </button>
              {p.status === 'pending' && (
                <button type="button" className="btn-ghost" disabled={busy !== null} onClick={() => void cancel()}>
                  انصراف از این پرداخت
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      {p.status === 'review' && (t.payerCard || t.payerRef) && (
        <p className="num mt-4 text-[13px] text-muted">
          آنچه ثبت کردید:{' '}
          {t.payerCard && (
            <>
              کارت <span dir="ltr">****{faDigits(t.payerCard)}</span>
            </>
          )}
          {t.payerCard && t.payerRef && ' · '}
          {t.payerRef && <>شماره‌ی پیگیری {faDigits(t.payerRef)}</>}
        </p>
      )}
    </div>
  );
}

function Banner({ tone, icon, title, children }: { tone: 'gain' | 'loss' | 'amber' | 'accent' | 'muted'; icon: ReactNode; title: string; children?: ReactNode }) {
  const cls = {
    gain: 'border-gain/50 bg-gain/10 text-gain',
    loss: 'border-loss/50 bg-loss/10 text-loss',
    amber: 'border-amber/50 bg-amber/10 text-amber',
    accent: 'border-accent/50 bg-accent/10 text-accent-ink',
    muted: 'border-line bg-raised/50 text-muted',
  }[tone];
  return (
    <div role="status" className={clsx('mb-4 flex items-start gap-3 rounded-2xl border p-4', cls)}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-ink">{title}</p>
        {children && <p className="mt-1 text-[13px] leading-6 text-muted">{children}</p>}
      </div>
    </div>
  );
}
