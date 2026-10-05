import clsx from 'clsx';
import { ArrowRight, CircleAlert, LoaderCircle, MessageSquareText, Moon, Pencil, Phone, ShieldCheck, Sun, TrendingUp, User } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ReplayDemo } from '../components/landing/ReplayDemo';
import { Logo } from '../components/layout/Layout';
import { fmtPhone, nameError, phoneError } from '../lib/auth';
import { faDigits, toLatinDigits } from '../lib/format';
import { getCandles, synthetic } from '../lib/market';
import { BackendError, backend, type OtpRequest } from '../services';
import { useAuth } from '../store/useAuth';
import { toast, useStore } from '../store/useStore';

interface LocationState {
  from?: string;
  notice?: string;
}

function Alert({ tone, children }: { tone: 'error' | 'info'; children: ReactNode }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={clsx('flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[13px] leading-6', tone === 'error' ? 'border-loss/40 bg-loss/10 text-loss' : 'border-accent/40 bg-accent/10 text-accent-ink')}
    >
      <CircleAlert size={16} className="mt-1 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

/** One box per digit; accepts typing, backspace, arrow keys and pasting a whole code. */
function CodeInput({ length, value, onChange, disabled, invalid }: { length: number; value: string; onChange: (v: string) => void; disabled?: boolean; invalid?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');
  const setAt = (i: number, d: string) => {
    const next = (value.slice(0, i) + d + value.slice(i + 1)).slice(0, length);
    onChange(next.replace(/\s/g, ''));
  };
  useEffect(() => {
    refs.current[Math.min(value.length, length - 1)]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="flex justify-center gap-2" dir="ltr" role="group" aria-label="کد تأیید">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          id={i === 0 ? 'otp-code' : `otp-code-${i}`}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`رقم ${faDigits(i + 1)}`}
          maxLength={length}
          className={clsx(
            'num h-14 w-12 rounded-2xl border bg-raised/70 text-center text-xl font-bold text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/20 sm:w-14',
            invalid ? 'border-loss' : d ? 'border-accent/60' : 'border-line',
          )}
          onChange={(e) => {
            const raw = toLatinDigits(e.target.value).replace(/\D/g, '');
            if (raw.length > 1) {
              // pasted or auto-filled code
              const code = raw.slice(0, length);
              onChange(code);
              refs.current[Math.min(code.length, length - 1)]?.focus();
              return;
            }
            setAt(i, raw);
            if (raw && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !d && i > 0) {
              e.preventDefault();
              setAt(i - 1, '');
              refs.current[i - 1]?.focus();
            } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
            else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}

const TICKERS = ['EURUSD', 'GBPUSD', 'XAUUSD', 'NAS100', 'BTCUSD', 'USDJPY', 'US30', 'ETHUSD', 'GBPJPY', 'SPX500'];

/** Left half on large screens: a live replay, a ticker strip and two figures. */
function MarketPanel() {
  const quotes = useMemo(() => {
    const at = Date.UTC(2023, 4, 3, 22);
    return TICKERS.map((s) => {
      const c = synthetic(() => getCandles(s, '1D', at, 2));
      const chg = c.length === 2 ? ((c[1].close - c[0].close) / c[0].close) * 100 : 0;
      return { s, chg };
    });
  }, []);
  return (
    <aside className="relative hidden min-h-[100dvh] flex-col overflow-hidden border-r border-line/60 bg-side lg:flex">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 40% 0%, rgb(var(--accent) / 0.24), transparent 70%), radial-gradient(ellipse 45% 40% at 100% 100%, rgb(var(--violet) / 0.14), transparent 70%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'linear-gradient(rgb(var(--line) / 0.6) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--line) / 0.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, #000 30%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, #000 30%, transparent 78%)',
        }}
      />
      {/* ticker strip */}
      <div className="relative overflow-hidden border-b border-line/60 bg-bg/40 py-2.5" dir="ltr" aria-hidden="true">
        <div className="ticker flex w-max gap-8 whitespace-nowrap px-4 text-[12px]">
          {[...quotes, ...quotes].map((q, i) => (
            <span key={i} className="flex items-center gap-2">
              <b className="text-ink">{q.s}</b>
              <span className={clsx('num font-semibold', q.chg >= 0 ? 'text-gain' : 'text-loss')}>
                {q.chg >= 0 ? '▲' : '▼'} {Math.abs(q.chg).toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
      </div>
      <div className="relative flex flex-1 flex-col px-10 py-10 xl:px-14">
        <h2 className="max-w-lg font-display text-[30px] font-bold leading-[1.6] xl:text-[34px]">
          بازار گذشته را <span className="text-accent-ink">کندل به کندل</span> دوباره معامله کن.
        </h2>
        <p className="mt-3 max-w-md text-[15px] leading-8 text-muted">جلسه‌ها، ژورنال و آمار معاملاتت منتظرت هستند؛ با شماره موبایل وارد شو و از همان‌جا ادامه بده.</p>
        <div className="relative my-auto py-8">
          <div className="rounded-3xl border border-line/70 bg-bg/40 p-2 shadow-pop backdrop-blur">
            <ReplayDemo />
          </div>
          <div className="absolute -left-4 top-2 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-pop">
            <p className="text-[11px] text-muted">وین‌ریت این هفته</p>
            <p className="num flex items-center gap-1.5 text-lg font-bold">
              <TrendingUp size={16} className="text-gain" /> ۵۴٫۲٪
            </p>
          </div>
          <div className="absolute -bottom-1 right-6 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-pop">
            <p className="text-[11px] text-muted">زمان بازپخش‌شده</p>
            <p className="num text-lg font-bold">۳ ماه و ۹ روز</p>
          </div>
        </div>
        <ul className="grid grid-cols-3 gap-4 text-xs text-muted">
          {[
            ['+۷۰', 'نماد فارکس، شاخص و کریپتو'],
            ['۶', 'تایم‌فریم از ۵ دقیقه'],
            ['۱۳۹۳', 'شروع داده‌ی تاریخی'],
          ].map(([v, l]) => (
            <li key={l}>
              <span className="num block font-display text-xl font-bold text-ink">{v}</span>
              {l}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default function AuthPage() {
  const location = useLocation();
  const session = useAuth((s) => s.session);
  const requestOtp = useAuth((s) => s.requestOtp);
  const verifyOtp = useAuth((s) => s.verifyOtp);
  const loginDemo = useAuth((s) => s.loginDemo);
  const { theme, setTheme } = useStore();
  const signup = location.pathname.startsWith('/signup');
  const state = (location.state ?? {}) as LocationState;
  const from = state.from && !/^\/(login|signup)/.test(state.from) ? state.from : '/dashboard';

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [remember, setRemember] = useState(true);
  const [otp, setOtp] = useState<OtpRequest | null>(null);
  const [error, setError] = useState<{ text: string; field?: string } | null>(null);
  const [loading, setLoading] = useState<'otp' | 'verify' | 'demo' | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);
  const verifying = useRef(false);

  useEffect(() => {
    if (step !== 'code') return;
    const t = setInterval(() => {
      setResendIn((s) => Math.max(0, s - 1));
      setExpiresIn((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  // Android Chrome can read the code from the SMS (WebOTP) when the message ends with "@host #code".
  useEffect(() => {
    if (step !== 'code' || !('OTPCredential' in window)) return;
    const ac = new AbortController();
    (navigator.credentials as any)
      .get({ otp: { transport: ['sms'] }, signal: ac.signal })
      .then((c: any) => c?.code && setCode(String(c.code)))
      .catch(() => undefined);
    return () => ac.abort();
  }, [step]);

  if (session) return <Navigate to={from} replace />;

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    const err = phoneError(phone);
    if (err) {
      setError({ text: err, field: 'phone' });
      return;
    }
    setLoading('otp');
    setError(null);
    try {
      const r = await requestOtp(phone);
      setOtp(r);
      setCode('');
      setResendIn(r.resendInSec);
      setExpiresIn(r.ttlSec);
      setStep('code');
    } catch (x) {
      setError({ text: x instanceof BackendError ? x.message : 'ارسال کد انجام نشد. دوباره تلاش کنید.', field: x instanceof BackendError ? x.field : undefined });
    } finally {
      setLoading(null);
    }
  };

  const verify = async (value = code) => {
    if (!otp || verifying.current) return;
    if (otp.isNew) {
      const nErr = nameError(name);
      if (nErr) {
        setError({ text: nErr, field: 'name' });
        return;
      }
    }
    if (value.length !== otp.length) {
      setError({ text: `کد ${faDigits(otp.length)} رقمی را کامل وارد کنید.`, field: 'code' });
      return;
    }
    verifying.current = true;
    setLoading('verify');
    setError(null);
    try {
      const res = await verifyOtp(phone, value, otp.isNew ? name.trim() : undefined, remember);
      toast(res.isNew ? `خوش آمدید ${res.user.name}! حساب شما ساخته شد.` : `خوش آمدید ${res.user.name}`);
    } catch (x) {
      setError({ text: x instanceof BackendError ? x.message : 'ورود انجام نشد. دوباره تلاش کنید.', field: x instanceof BackendError ? x.field : 'code' });
      if (x instanceof BackendError && x.field === 'code') setCode('');
    } finally {
      verifying.current = false;
      setLoading(null);
    }
  };

  const demo = async () => {
    setLoading('demo');
    setError(null);
    try {
      await loginDemo();
      toast('وارد حساب نمایشی شدید');
    } catch (x) {
      setError({ text: x instanceof BackendError ? x.message : 'ورود به حساب نمایشی انجام نشد.' });
      setLoading(null);
    }
  };

  const title = step === 'code' ? 'کد تأیید را وارد کنید' : signup ? 'ساخت حساب با شماره موبایل' : 'ورود با شماره موبایل';
  const subtitle =
    step === 'code' ? (
      <>
        کد {faDigits(otp?.length ?? 5)} رقمی به <b className="num text-ink" dir="ltr">{fmtPhone(phone)}</b> پیامک شد.
      </>
    ) : signup ? (
      'بدون رمز عبور؛ با یک کد پیامکی حساب بسازید. ۷ روز امکانات حرفه‌ای هدیه است.'
    ) : (
      'شماره موبایلی را که با آن ثبت‌نام کرده‌اید بنویسید.'
    );

  return (
    <div className="min-h-[100dvh] bg-bg lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)]">
      <main className="flex min-h-[100dvh] flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-[13px] text-muted transition hover:bg-raised hover:text-ink">
            <ArrowRight size={16} /> صفحه‌ی اصلی
          </Link>
          <Logo />
          <button type="button" className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'حالت روشن' : 'حالت تیره'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="mx-auto my-auto w-full max-w-[400px] py-10">
          <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent-ink">{step === 'code' ? <ShieldCheck size={24} /> : <Phone size={22} />}</span>
          <h1 className="font-display text-[26px] font-bold">{title}</h1>
          <p className="mt-2 text-[14px] leading-7 text-muted">{subtitle}</p>

          <div className="mt-7 flex flex-col gap-4">
            {state.notice && !error && <Alert tone="info">{state.notice}</Alert>}
            {error && <Alert tone="error">{error.text}</Alert>}

            {step === 'phone' ? (
              <form onSubmit={sendCode} noValidate className="flex flex-col gap-4">
                <div>
                  <label className="label" htmlFor="auth-phone">
                    شماره موبایل
                  </label>
                  <div className={clsx('field flex items-center gap-2 py-0 focus-within:border-accent/70 focus-within:ring-2 focus-within:ring-accent/20', error?.field === 'phone' && 'border-loss')}>
                    <Phone size={17} className="shrink-0 text-faint" />
                    <input
                      id="auth-phone"
                      autoFocus
                      dir="ltr"
                      inputMode="tel"
                      autoComplete="tel-national"
                      placeholder="0912 123 4567"
                      value={phone}
                      onChange={(e) => {
                        setPhone(toLatinDigits(e.target.value).replace(/[^\d+\s]/g, ''));
                        if (error?.field === 'phone') setError(null);
                      }}
                      className="num h-12 w-full bg-transparent text-left text-[16px] font-semibold tracking-wider outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-faint"
                    />
                    <span className="shrink-0 text-[12px] text-faint">ایران</span>
                  </div>
                  <p className="mt-1.5 text-[12px] text-faint">کد تأیید با پیامک فرستاده می‌شود. شماره را با ۰۹ یا ‎+98 بنویسید.</p>
                </div>
                <label className="flex cursor-pointer select-none items-center gap-2.5 text-[13px] text-muted">
                  <input id="auth-remember" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent))]" />
                  مرا به خاطر بسپار <span className="text-faint">(۳۰ روز)</span>
                </label>
                <button type="submit" className="btn-primary h-12 rounded-2xl text-[15px]" disabled={loading !== null}>
                  {loading === 'otp' ? <LoaderCircle size={18} className="animate-spin" /> : 'دریافت کد تأیید'}
                </button>
                <p className="text-center text-[12px] leading-6 text-faint">
                  ورود یا ثبت‌نام یعنی <span className="text-muted">قوانین استفاده</span> و <span className="text-muted">حریم خصوصی</span> را پذیرفته‌اید.
                </p>
              </form>
            ) : (
              <form
                noValidate
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void verify();
                }}
              >
                {otp?.devCode && (
                  <div className="anim-pop flex items-start gap-3 rounded-2xl border border-line bg-raised/80 p-3 shadow-pop">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gain/15 text-gain">
                      <MessageSquareText size={18} />
                    </span>
                    <div className="min-w-0 flex-1 text-[13px]">
                      <p className="font-semibold">پیامک {backend.mode === 'demo' ? '(حالت نمایشی)' : '(حالت توسعه)'}</p>
                      <p className="text-muted">
                        کد ورود شما: <b className="num tracking-[0.3em] text-ink">{faDigits(otp.devCode)}</b>
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-soft shrink-0 px-2.5 py-1.5 text-[12px]"
                      onClick={() => {
                        setCode(otp.devCode!);
                        if (!otp.isNew || !nameError(name)) void verify(otp.devCode!);
                      }}
                    >
                      وارد کردن
                    </button>
                  </div>
                )}
                {otp?.isNew && (
                  <div>
                    <label className="label" htmlFor="auth-name">
                      نام و نام خانوادگی <span className="font-normal text-faint">(حساب جدید)</span>
                    </label>
                    <div className={clsx('field flex items-center gap-2 py-0 focus-within:border-accent/70', error?.field === 'name' && 'border-loss')}>
                      <User size={17} className="shrink-0 text-faint" />
                      <input
                        id="auth-name"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (error?.field === 'name') setError(null);
                        }}
                        placeholder="مثلاً: سارا محمدی"
                        className="h-11 w-full bg-transparent outline-none placeholder:text-faint"
                      />
                    </div>
                  </div>
                )}
                <CodeInput
                  length={otp?.length ?? 5}
                  value={code}
                  disabled={loading === 'verify'}
                  invalid={error?.field === 'code'}
                  onChange={(v) => {
                    setCode(v);
                    if (error?.field === 'code') setError(null);
                    if (otp && v.length === otp.length && (!otp.isNew || !nameError(name))) void verify(v);
                  }}
                />
                <div className="num flex items-center justify-between text-[12px] text-muted">
                  <span>{expiresIn > 0 ? `اعتبار کد: ${faDigits(Math.floor(expiresIn / 60))}:${faDigits(String(expiresIn % 60).padStart(2, '0'))}` : 'کد منقضی شد'}</span>
                  {resendIn > 0 ? (
                    <span>ارسال دوباره تا {faDigits(resendIn)} ثانیه</span>
                  ) : (
                    <button type="button" className="font-semibold text-accent-ink hover:underline" onClick={() => void sendCode()} disabled={loading !== null}>
                      ارسال دوباره‌ی کد
                    </button>
                  )}
                </div>
                <label className="flex cursor-pointer select-none items-center gap-2.5 text-[13px] text-muted">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent))]" />
                  مرا به خاطر بسپار
                </label>
                <button type="submit" className="btn-primary h-12 rounded-2xl text-[15px]" disabled={loading !== null || code.length !== (otp?.length ?? 5)}>
                  {loading === 'verify' ? <LoaderCircle size={18} className="animate-spin" /> : otp?.isNew ? 'ساخت حساب و ورود' : 'تأیید و ورود'}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setStep('phone');
                    setError(null);
                    setCode('');
                  }}
                >
                  <Pencil size={14} /> ویرایش شماره {fmtPhone(phone)}
                </button>
              </form>
            )}

            {backend.mode === 'demo' && step === 'phone' && (
              <>
                <div className="flex items-center gap-3 text-xs text-faint">
                  <span className="h-px flex-1 bg-line" />
                  یا
                  <span className="h-px flex-1 bg-line" />
                </div>
                <button type="button" onClick={demo} disabled={loading !== null} className="btn-soft h-12 w-full rounded-2xl text-[14px]">
                  {loading === 'demo' ? <LoaderCircle size={18} className="animate-spin" /> : 'ورود با حساب نمایشی'}
                </button>
                <p className="-mt-1 text-center text-[11px] leading-5 text-faint">
                  حساب نمایشی با داده‌ی نمونه پر شده و به پنل مدیریت هم دسترسی دارد. شماره: <span className="num text-muted">{fmtPhone('09121234567')}</span>
                </p>
              </>
            )}
          </div>

          <p className="mt-8 text-center text-[13px] text-muted">
            {signup ? 'قبلاً ثبت‌نام کرده‌اید؟ ' : 'حساب ندارید؟ '}
            <Link to={signup ? '/login' : '/signup'} state={state.from ? { from: state.from } : undefined} className="font-semibold text-accent-ink hover:underline">
              {signup ? 'وارد شوید' : 'رایگان ثبت‌نام کنید'}
            </Link>
          </p>
        </div>
      </main>

      <MarketPanel />
    </div>
  );
}
