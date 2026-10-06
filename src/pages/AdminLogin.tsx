import clsx from 'clsx';
import { Eye, EyeOff, KeyRound, LoaderCircle, Lock, Moon, Sun, User } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Logo } from '../components/brand/Brand';
import { BackendError } from '../services';
import { useAuth } from '../store/useAuth';
import { toast, useStore } from '../store/useStore';
import { Alert } from './Auth';

/**
 * The admin panel's own sign-in page (/#/admin/login): username and password only. The normal
 * sign-in page does not link here, so visitors never see an admin option.
 */
export default function AdminLogin() {
  const session = useAuth((s) => s.session);
  const adminLogin = useAuth((s) => s.adminLogin);
  const { theme, setTheme } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<{ text: string; field?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (session?.role === 'admin') return <Navigate to="/admin" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError({ text: 'نام کاربری و رمز عبور را بنویسید.', field: username.trim() ? 'password' : 'username' });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await adminLogin(username.trim(), password, remember);
      toast(`خوش آمدید ${res.user.name}`);
    } catch (x) {
      setError({ text: x instanceof BackendError ? x.message : 'ورود انجام نشد. دوباره تلاش کنید.', field: x instanceof BackendError ? x.field : 'password' });
      setPassword('');
      setLoading(false);
    }
  };

  const field = (name: string) =>
    clsx('field flex items-center gap-2 py-0 focus-within:border-accent/70 focus-within:ring-2 focus-within:ring-accent/20', error?.field === name && 'border-loss');

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg px-5 py-6 sm:px-10">
      <div className="flex items-center justify-between">
        <Logo />
        <button type="button" className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'حالت روشن' : 'حالت تیره'}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <main className="mx-auto my-auto w-full max-w-[400px] py-10">
        <div className="card p-6 sm:p-8">
          <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent-ink">
            <KeyRound size={22} />
          </span>
          <h1 className="font-display text-[24px] font-bold">ورود به پنل مدیریت</h1>
          <p className="mt-2 text-[14px] leading-7 text-muted">با نام کاربری و رمز عبور مدیر وارد شوید.</p>

          <form onSubmit={submit} noValidate className="mt-7 flex flex-col gap-4">
            {session && !error && <Alert tone="info">با حساب کاربری عادی وارد شده‌اید؛ این حساب به پنل مدیریت دسترسی ندارد.</Alert>}
            {error && <Alert tone="error">{error.text}</Alert>}
            <div>
              <label className="label" htmlFor="admin-username">
                نام کاربری
              </label>
              <div className={field('username')}>
                <User size={17} className="shrink-0 text-faint" />
                <input
                  id="admin-username"
                  autoFocus
                  dir="ltr"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError(null);
                  }}
                  className="h-12 w-full bg-transparent text-left text-[15px] outline-none"
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="admin-password">
                رمز عبور
              </label>
              <div className={field('password')}>
                <Lock size={17} className="shrink-0 text-faint" />
                <input
                  id="admin-password"
                  dir="ltr"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className="h-12 w-full bg-transparent text-left text-[15px] outline-none"
                />
                <button
                  type="button"
                  className="shrink-0 text-faint hover:text-ink"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'پنهان کردن رمز' : 'نمایش رمز'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <label className="flex cursor-pointer select-none items-center gap-2.5 text-[13px] text-muted">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent))]" />
              مرا به خاطر بسپار <span className="text-faint">(۳۰ روز)</span>
            </label>
            <button type="submit" className="btn-primary h-12 rounded-2xl text-[15px]" disabled={loading}>
              {loading ? <LoaderCircle size={18} className="animate-spin" /> : 'ورود'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
