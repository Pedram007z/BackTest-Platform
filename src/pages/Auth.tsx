import clsx from 'clsx';
import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  Keyboard,
  KeyRound,
  LoaderCircle,
  Lock,
  Mail,
  Moon,
  Sun,
  User,
} from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ReplayDemo } from '../components/landing/ReplayDemo';
import { Logo } from '../components/layout/Layout';
import { Modal } from '../components/ui/Modal';
import {
  AuthError,
  DEMO_ACCOUNT,
  emailError,
  hasPersianLetters,
  lockSecondsLeft,
  nameError,
  newPasswordError,
  normalizeEmail,
  passwordStrength,
  requestPasswordReset,
  resetPassword,
} from '../lib/auth';
import { faDigits, toLatinDigits } from '../lib/format';
import { useAuth } from '../store/useAuth';
import { toast, useStore } from '../store/useStore';

type Mode = 'login' | 'signup' | 'forgot';

interface LocationState {
  from?: string;
  email?: string;
  notice?: string;
}

const modeFromPath = (path: string): Mode => (path.startsWith('/signup') ? 'signup' : path.startsWith('/forgot') ? 'forgot' : 'login');

// ---------- building blocks ----------
interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: ReactNode;
  trailing?: ReactNode;
  ltr?: boolean;
  labelExtra?: ReactNode;
  inputRef?: Ref<HTMLInputElement>;
}

function Field({ label, icon, value, onChange, error, hint, trailing, ltr, labelExtra, inputRef, id, ...rest }: FieldProps) {
  const auto = useId();
  const fid = id ?? auto;
  const describedBy = error ? `${fid}-error` : hint ? `${fid}-hint` : undefined;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={fid} className="text-[13px] font-medium">
          {label}
        </label>
        {labelExtra}
      </div>
      <div
        className={clsx(
          'flex items-center gap-2 rounded-xl border bg-raised px-3 transition focus-within:ring-2',
          error ? 'border-loss/70 focus-within:ring-loss/20' : 'border-line focus-within:border-accent/70 focus-within:ring-accent/20',
        )}
        dir={ltr ? 'ltr' : undefined}
      >
        <span className="shrink-0 text-faint">{icon}</span>
        <input
          ref={inputRef}
          id={fid}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className="h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
          {...rest}
        />
        {trailing}
      </div>
      {error ? (
        <p id={`${fid}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs text-loss">
          <CircleAlert size={13} className="shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <div id={`${fid}-hint`} className="mt-1.5 text-xs">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function PasswordField(props: Omit<FieldProps, 'icon' | 'trailing' | 'ltr' | 'type'> & { showStrength?: boolean }) {
  const { showStrength, hint, value, ...rest } = props;
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const strength = passwordStrength(value);
  const persian = hasPersianLetters(value);

  const notes: ReactNode[] = [];
  if (persian) notes.push(<KeyboardNote key="fa" text="صفحه‌کلید روی فارسی است؛ رمز را با حروف انگلیسی بنویسید." />);
  if (caps) notes.push(<KeyboardNote key="caps" text="Caps Lock روشن است." />);

  return (
    <Field
      {...rest}
      value={value}
      ltr
      type={show ? 'text' : 'password'}
      icon={<Lock size={17} />}
      onKeyDown={(e) => setCaps(e.getModifierState?.('CapsLock') ?? false)}
      onKeyUp={(e) => setCaps(e.getModifierState?.('CapsLock') ?? false)}
      onBlur={() => setCaps(false)}
      trailing={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="shrink-0 rounded-md p-1 text-faint transition hover:text-ink"
          aria-label={show ? 'پنهان کردن رمز' : 'نمایش رمز'}
          aria-pressed={show}
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      }
      hint={
        notes.length || (showStrength && value) || hint ? (
          <div className="flex flex-col gap-1.5">
            {showStrength && value && (
              <div className="flex items-center gap-2">
                <div className="flex flex-1 gap-1" aria-hidden="true">
                  {[1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={clsx(
                        'h-1 flex-1 rounded-full transition',
                        i <= strength.score
                          ? strength.score <= 1
                            ? 'bg-loss'
                            : strength.score === 2
                              ? 'bg-amber'
                              : 'bg-gain'
                          : 'bg-raised',
                      )}
                    />
                  ))}
                </div>
                <span className="w-16 shrink-0 text-start text-muted">قدرت: {strength.label}</span>
              </div>
            )}
            {notes}
            {hint}
          </div>
        ) : undefined
      }
    />
  );
}

function KeyboardNote({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-1.5 text-amber">
      <Keyboard size={13} className="shrink-0" />
      {text}
    </p>
  );
}

function Alert({ tone, children }: { tone: 'error' | 'success' | 'info'; children: ReactNode }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={clsx(
        'anim-fade flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] leading-6',
        tone === 'error' && 'border-loss/30 bg-loss/10 text-ink',
        tone === 'success' && 'border-gain/30 bg-gain/10 text-ink',
        tone === 'info' && 'border-accent/30 bg-accent/10 text-ink',
      )}
    >
      {tone === 'success' ? <CircleCheck size={17} className="mt-0.5 shrink-0 text-gain" /> : <CircleAlert size={17} className={clsx('mt-0.5 shrink-0', tone === 'error' ? 'text-loss' : 'text-accent')} />}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Submit({ loading, disabled, children }: { loading: boolean; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="submit" disabled={loading || disabled} className="btn-primary h-12 w-full rounded-xl text-[15px]" aria-busy={loading}>
      {loading ? <LoaderCircle size={19} className="animate-spin" /> : children}
    </button>
  );
}

// ---------- forms ----------
function LoginForm({ initialEmail, notice }: { initialEmail: string; notice?: string }) {
  const login = useAuth((s) => s.login);
  const loginDemo = useAuth((s) => s.loginDemo);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState<'form' | 'demo' | null>(null);
  const [lock, setLock] = useState(() => (initialEmail ? lockSecondsLeft(initialEmail) : 0));
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (initialEmail ? passwordRef : emailRef).current?.focus();
  }, [initialEmail]);

  // count down an active lock
  useEffect(() => {
    if (!lock) return;
    const t = setInterval(() => {
      const left = lockSecondsLeft(email);
      setLock(left);
      if (!left) setFormError('');
    }, 1000);
    return () => clearInterval(t);
  }, [lock, email]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const next = { email: emailError(email) || undefined, password: password ? undefined : 'رمز عبور را بنویسید.' };
    setErrors(next);
    setFormError('');
    if (next.email || next.password) {
      (next.email ? emailRef : passwordRef).current?.focus();
      return;
    }
    setLoading('form');
    try {
      const s = await login(email, password, remember);
      toast(`خوش آمدی، ${s.name}`);
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.field) setErrors({ [err.field]: err.message });
        else setFormError(err.message);
        if (err.code === 'locked') setLock(lockSecondsLeft(email));
        if (err.code === 'invalid') {
          setPassword('');
          passwordRef.current?.focus();
        }
      } else setFormError('ورود انجام نشد. دوباره تلاش کنید.');
      setLoading(null);
    }
  };

  const demo = async () => {
    if (loading) return;
    setLoading('demo');
    setFormError('');
    try {
      await loginDemo();
      toast('وارد حساب نمایشی شدید');
    } catch (err) {
      setFormError(err instanceof AuthError ? err.message : 'ورود به حساب نمایشی انجام نشد.');
      setLoading(null);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {notice && <Alert tone="success">{notice}</Alert>}
      {formError && <Alert tone="error">{formError}</Alert>}

      <Field
        inputRef={emailRef}
        id="login-email"
        label="ایمیل"
        type="email"
        inputMode="email"
        autoComplete="username"
        placeholder="name@example.com"
        icon={<Mail size={17} />}
        ltr
        value={email}
        onChange={(v) => {
          setEmail(v);
          if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
          setLock(lockSecondsLeft(v));
        }}
        error={errors.email}
        hint={hasPersianLetters(email) ? <KeyboardNote text="صفحه‌کلید روی فارسی است؛ ایمیل را با حروف انگلیسی بنویسید." /> : undefined}
      />
      <PasswordField
        id="login-password"
        label="رمز عبور"
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={(v) => {
          setPassword(v);
          if (errors.password) setErrors((x) => ({ ...x, password: undefined }));
        }}
        error={errors.password}
        labelExtra={
          <Link to="/forgot-password" state={{ email: normalizeEmail(email) }} className="text-xs font-semibold text-accent hover:underline">
            رمز را فراموش کرده‌اید؟
          </Link>
        }
        inputRef={passwordRef}
      />

      <label className="flex cursor-pointer select-none items-center gap-2.5 text-[13px] text-muted">
        <input id="login-remember" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent))]" />
        مرا به خاطر بسپار <span className="text-faint">(۳۰ روز)</span>
      </label>

      <Submit loading={loading === 'form'} disabled={lock > 0 || loading === 'demo'}>
        {lock > 0 ? `قفل موقت: ${faDigits(lock)} ثانیه` : 'ورود'}
      </Submit>

      <div className="flex items-center gap-3 text-xs text-faint">
        <span className="h-px flex-1 bg-line" />
        یا
        <span className="h-px flex-1 bg-line" />
      </div>

      <button type="button" onClick={demo} disabled={!!loading} className="btn-soft h-12 w-full rounded-xl text-[14px]">
        {loading === 'demo' ? <LoaderCircle size={18} className="animate-spin" /> : 'ورود با حساب نمایشی'}
      </button>
      <p className="-mt-1 text-center text-[11px] leading-5 text-faint">
        حساب نمایشی با داده‌ی نمونه پر شده است:{' '}
        <span dir="ltr" className="font-semibold text-muted">
          {DEMO_ACCOUNT.email}
        </span>{' '}
        /{' '}
        <span dir="ltr" className="font-semibold text-muted">
          {DEMO_ACCOUNT.password}
        </span>
      </p>
    </form>
  );
}

function SignupForm() {
  const signup = useAuth((s) => s.signup);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.querySelector<HTMLInputElement>('#signup-name')?.focus();
  }, []);

  const clear = (k: string) => errors[k] && setErrors((x) => ({ ...x, [k]: undefined }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const next: Record<string, string | undefined> = {
      name: nameError(name) || undefined,
      email: emailError(email) || undefined,
      password: newPasswordError(password) || undefined,
      confirm: !confirm ? 'رمز عبور را دوباره بنویسید.' : confirm !== password ? 'دو رمز عبور یکسان نیستند.' : undefined,
      terms: terms ? undefined : 'برای ساخت حساب باید با شرایط استفاده موافقت کنید.',
    };
    setErrors(next);
    setFormError('');
    const first = Object.keys(next).find((k) => next[k]);
    if (first) {
      formRef.current?.querySelector<HTMLInputElement>(`#signup-${first}`)?.focus();
      return;
    }
    setLoading(true);
    try {
      const s = await signup({ name, email, password }, true);
      toast(`حساب ساخته شد. خوش آمدی، ${s.name}`);
    } catch (err) {
      if (err instanceof AuthError && err.field) setErrors({ [err.field]: err.message });
      else setFormError(err instanceof AuthError ? err.message : 'ساخت حساب انجام نشد. دوباره تلاش کنید.');
      setLoading(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-4">
      {formError && <Alert tone="error">{formError}</Alert>}
      <Field
        id="signup-name"
        label="نام و نام خانوادگی"
        autoComplete="name"
        placeholder="مثلاً: سارا محمدی"
        icon={<User size={17} />}
        maxLength={40}
        value={name}
        onChange={(v) => {
          setName(v);
          clear('name');
        }}
        error={errors.name}
      />
      <Field
        id="signup-email"
        label="ایمیل"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="name@example.com"
        icon={<Mail size={17} />}
        ltr
        value={email}
        onChange={(v) => {
          setEmail(v);
          clear('email');
        }}
        error={errors.email}
        hint={hasPersianLetters(email) ? <KeyboardNote text="صفحه‌کلید روی فارسی است؛ ایمیل را با حروف انگلیسی بنویسید." /> : undefined}
      />
      <PasswordField
        id="signup-password"
        label="رمز عبور"
        autoComplete="new-password"
        placeholder="حداقل ۸ کاراکتر، حرف و عدد"
        value={password}
        onChange={(v) => {
          setPassword(v);
          clear('password');
        }}
        error={errors.password}
        showStrength
      />
      <PasswordField
        id="signup-confirm"
        label="تکرار رمز عبور"
        autoComplete="new-password"
        placeholder="رمز عبور را دوباره بنویسید"
        value={confirm}
        onChange={(v) => {
          setConfirm(v);
          clear('confirm');
        }}
        error={errors.confirm}
        hint={confirm && confirm === password ? <p className="flex items-center gap-1.5 text-gain"><CircleCheck size={13} /> رمزها یکسان هستند.</p> : undefined}
      />

      <div>
        <label className="flex cursor-pointer select-none items-start gap-2.5 text-[13px] leading-6 text-muted">
          <input
            id="signup-terms"
            type="checkbox"
            checked={terms}
            onChange={(e) => {
              setTerms(e.target.checked);
              clear('terms');
            }}
            aria-invalid={!!errors.terms}
            className="mt-1 h-4 w-4 shrink-0 accent-[rgb(var(--accent))]"
          />
          <span>
            <button type="button" className="font-semibold text-accent hover:underline" onClick={() => setShowTerms(true)}>
              شرایط استفاده
            </button>{' '}
            را خواندم و می‌پذیرم.
          </span>
        </label>
        {errors.terms && <p className="mt-1.5 flex items-center gap-1.5 text-xs text-loss"><CircleAlert size={13} />{errors.terms}</p>}
      </div>

      <Submit loading={loading}>ساخت حساب</Submit>

      <Modal
        open={showTerms}
        onClose={() => setShowTerms(false)}
        title="شرایط استفاده"
        size="sm"
        footer={
          <button
            type="button"
            className="btn-primary"
            data-autofocus
            onClick={() => {
              setTerms(true);
              clear('terms');
              setShowTerms(false);
            }}
          >
            می‌پذیرم
          </button>
        }
      >
        <ul className="flex list-disc flex-col gap-2 pr-5 text-sm leading-7 text-muted">
          <li>بک‌تست‌لب ابزار تمرین و آموزش است و توصیه‌ی سرمایه‌گذاری نمی‌دهد.</li>
          <li>نتیجه‌ی بک‌تست، سود یا زیان آینده را تضمین نمی‌کند. معامله در بازارهای مالی ریسک از دست دادن سرمایه دارد.</li>
          <li>مسئولیت امنیت رمز عبور و فعالیت‌های حساب با شماست.</li>
          <li>در این نسخه، حساب و داده‌های شما فقط در همین مرورگر ذخیره می‌شوند و به سروری فرستاده نمی‌شوند.</li>
        </ul>
      </Modal>
    </form>
  );
}

function ForgotForm({ initialEmail }: { initialEmail: string }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [issued, setIssued] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.querySelector<HTMLInputElement>(step === 'email' ? '#forgot-email' : '#forgot-code')?.focus();
  }, [step]);

  const sendCode = (e?: FormEvent) => {
    e?.preventDefault();
    const err = emailError(email);
    setErrors({ email: err || undefined });
    setFormError('');
    if (err) return;
    try {
      setIssued(requestPasswordReset(email));
      setCode('');
      setStep('reset');
    } catch (x) {
      if (x instanceof AuthError) setErrors({ email: x.message });
    }
  };

  const reset = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const next: Record<string, string | undefined> = {
      code: toLatinDigits(code).replace(/\D/g, '').length === 6 ? undefined : 'کد ۶ رقمی را وارد کنید.',
      password: newPasswordError(password) || undefined,
      confirm: confirm !== password ? 'دو رمز عبور یکسان نیستند.' : undefined,
    };
    setErrors(next);
    setFormError('');
    const first = Object.keys(next).find((k) => next[k]);
    if (first) {
      formRef.current?.querySelector<HTMLInputElement>(`#forgot-${first}`)?.focus();
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, code, password);
      navigate('/login', { replace: true, state: { email: normalizeEmail(email), notice: 'رمز عبور تغییر کرد. با رمز جدید وارد شوید.' } satisfies LocationState });
    } catch (x) {
      if (x instanceof AuthError) {
        if (x.code === 'expired_code') {
          setStep('email');
          setFormError(x.message);
        } else if (x.field) setErrors({ [x.field]: x.message });
        else setFormError(x.message);
      } else setFormError('تغییر رمز انجام نشد. دوباره تلاش کنید.');
      setLoading(false);
    }
  };

  if (step === 'email') {
    return (
      <form ref={formRef} onSubmit={sendCode} noValidate className="flex flex-col gap-4">
        {formError && <Alert tone="error">{formError}</Alert>}
        <Field
          id="forgot-email"
          label="ایمیل حساب"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="name@example.com"
          icon={<Mail size={17} />}
          ltr
          value={email}
          onChange={(v) => {
            setEmail(v);
            setErrors({});
          }}
          error={errors.email}
        />
        <Submit loading={false}>دریافت کد بازیابی</Submit>
      </form>
    );
  }

  return (
    <form ref={formRef} onSubmit={reset} noValidate className="flex flex-col gap-4">
      {formError && <Alert tone="error">{formError}</Alert>}
      <Alert tone="info">
        <p>
          کد بازیابی برای <span dir="ltr" className="font-semibold">{normalizeEmail(email)}</span> ساخته شد و ۱۰ دقیقه اعتبار دارد.
        </p>
        <p className="mt-1 text-muted">
          این نسخه به سرور ایمیل وصل نیست، پس کد همین‌جا نمایش داده می‌شود:{' '}
          <span dir="ltr" className="num rounded bg-surface px-1.5 py-0.5 font-bold tracking-[0.2em] text-ink">
            {issued}
          </span>
        </p>
      </Alert>
      <Field
        id="forgot-code"
        label="کد ۶ رقمی"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="000000"
        maxLength={6}
        icon={<KeyRound size={17} />}
        ltr
        value={code}
        onChange={(v) => {
          setCode(toLatinDigits(v).replace(/\D/g, '').slice(0, 6));
          setErrors((x) => ({ ...x, code: undefined }));
        }}
        error={errors.code}
        className="h-12 min-w-0 flex-1 bg-transparent text-[17px] tracking-[0.35em] outline-none placeholder:text-faint"
      />
      <PasswordField
        id="forgot-password"
        label="رمز عبور جدید"
        autoComplete="new-password"
        placeholder="حداقل ۸ کاراکتر، حرف و عدد"
        value={password}
        onChange={(v) => {
          setPassword(v);
          setErrors((x) => ({ ...x, password: undefined }));
        }}
        error={errors.password}
        showStrength
      />
      <PasswordField
        id="forgot-confirm"
        label="تکرار رمز عبور جدید"
        autoComplete="new-password"
        value={confirm}
        onChange={(v) => {
          setConfirm(v);
          setErrors((x) => ({ ...x, confirm: undefined }));
        }}
        error={errors.confirm}
      />
      <Submit loading={loading}>تغییر رمز عبور</Submit>
      <button type="button" className="btn-ghost w-full" onClick={() => sendCode()}>
        کد جدید بگیر
      </button>
    </form>
  );
}

// ---------- page ----------
function BrandPanel() {
  return (
    <aside className="relative hidden min-h-[100dvh] flex-col overflow-hidden border-l border-line/60 bg-side lg:flex">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 60% 0%, rgb(var(--accent) / 0.22), transparent 70%), radial-gradient(ellipse 45% 40% at 0% 100%, rgb(var(--violet) / 0.14), transparent 70%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'linear-gradient(rgb(var(--line) / 0.5) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--line) / 0.5) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 75%)',
        }}
      />
      <div className="relative flex flex-1 flex-col px-12 py-10 xl:px-16">
        <Link to="/" aria-label="صفحه اصلی" className="w-fit">
          <Logo />
        </Link>
        <div className="my-auto py-10">
          <h2 className="font-display text-[30px] font-extrabold leading-[1.55] xl:text-[34px]">
            هر معامله‌ی تمرینی،
            <br />
            یک داده برای <span className="text-accent">استراتژی بهتر</span>.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-8 text-muted">جلسه‌هایت، استراتژی‌ها، چک‌لیست‌ها و ژورنال معاملاتت همان‌جایی است که رها کرده بودی.</p>
          <div className="mt-8 max-w-[560px]">
            <ReplayDemo />
          </div>
        </div>
        <ul className="grid grid-cols-3 gap-4 text-xs text-muted">
          {[
            ['۱۲', 'نماد در ۴ بازار'],
            ['۵', 'تایم‌فریم'],
            ['۱۳۹۳', 'شروع داده‌ی تاریخی'],
          ].map(([v, l]) => (
            <li key={l}>
              <span className="num block font-display text-xl font-extrabold text-ink">{v}</span>
              {l}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

const COPY: Record<Mode, { title: string; text: string }> = {
  login: { title: 'ورود به حساب', text: 'برای ادامه‌ی بک‌تست‌ها وارد شوید.' },
  signup: { title: 'ساخت حساب', text: 'رایگان شروع کنید؛ ۱۴ روز امکانات حرفه‌ای هم هدیه است.' },
  forgot: { title: 'بازیابی رمز عبور', text: 'ایمیل حساب را بنویسید تا کد بازیابی بسازیم.' },
};

export default function AuthPage() {
  const location = useLocation();
  const session = useAuth((s) => s.session);
  const { theme, setTheme } = useStore();
  const mode = modeFromPath(location.pathname);
  const state = (location.state ?? {}) as LocationState;
  const from = state.from && !state.from.startsWith('/login') && !state.from.startsWith('/signup') ? state.from : '/dashboard';

  if (session) return <Navigate to={from} replace />;

  const copy = COPY[mode];
  // keep the "return to" page when switching between login and signup
  const carry = state.from ? { from: state.from } : undefined;

  return (
    <div className="min-h-[100dvh] bg-bg lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
      <BrandPanel />

      <main className="flex min-h-[100dvh] flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] text-muted transition hover:bg-raised hover:text-ink">
            <ArrowRight size={16} /> صفحه‌ی اصلی
          </Link>
          <div className="lg:hidden">
            <Logo />
          </div>
          <button type="button" className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'حالت روشن' : 'حالت تیره'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="mx-auto my-auto w-full max-w-[400px] py-10">
          <h1 className="font-display text-[26px] font-extrabold">{copy.title}</h1>
          <p className="mb-7 mt-2 text-sm text-muted">{copy.text}</p>

          {mode !== 'forgot' && (
            <div role="tablist" aria-label="ورود یا ثبت‌نام" className="mb-6 grid grid-cols-2 rounded-xl border border-line bg-surface p-1 text-sm font-semibold">
              {(['login', 'signup'] as const).map((m) => (
                <Link
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  to={m === 'login' ? '/login' : '/signup'}
                  replace
                  state={carry}
                  className={clsx('rounded-lg py-2.5 text-center transition', mode === m ? 'bg-accent text-white shadow' : 'text-muted hover:text-ink')}
                >
                  {m === 'login' ? 'ورود' : 'ثبت‌نام'}
                </Link>
              ))}
            </div>
          )}

          {mode === 'login' && (
            <LoginForm
              key={location.key}
              initialEmail={state.email ?? ''}
              notice={state.notice ?? (state.from && state.from !== '/dashboard' ? 'برای دیدن این صفحه اول وارد شوید.' : undefined)}
            />
          )}
          {mode === 'signup' && <SignupForm />}
          {mode === 'forgot' && <ForgotForm initialEmail={state.email ?? ''} />}

          <p className="mt-7 text-center text-[13px] text-muted">
            {mode === 'login' && (
              <>
                حساب ندارید؟{' '}
                <Link to="/signup" replace state={carry} className="font-semibold text-accent hover:underline">
                  ثبت‌نام کنید
                </Link>
              </>
            )}
            {mode === 'signup' && (
              <>
                قبلاً ثبت‌نام کرده‌اید؟{' '}
                <Link to="/login" replace state={carry} className="font-semibold text-accent hover:underline">
                  وارد شوید
                </Link>
              </>
            )}
            {mode === 'forgot' && (
              <Link to="/login" replace className="font-semibold text-accent hover:underline">
                بازگشت به ورود
              </Link>
            )}
          </p>
        </div>

        <p className="text-center text-[11px] text-faint">
          <span className="inline-flex items-center gap-1">
            <Lock size={11} /> رمز عبور به‌صورت هش‌شده ذخیره می‌شود و هرگز به‌صورت متن ساده نگه داشته نمی‌شود.
          </span>
        </p>
      </main>
    </div>
  );
}
