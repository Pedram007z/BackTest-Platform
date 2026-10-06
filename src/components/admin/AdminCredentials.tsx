import { KeyRound, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { BackendError, backend } from '../../services';
import { toast } from '../../store/useStore';
import { Field } from './kit';

/** The signed-in admin's username and password for /#/admin-login (sign-in by phone keeps working). */
export function AdminCredentialsCard() {
  const [current, setCurrent] = useState<string | null | undefined>(undefined);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState<{ text: string; field?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    backend.admin
      .credentials()
      .then((c) => {
        setCurrent(c.username);
        setUsername(c.username ?? '');
      })
      .catch(() => setCurrent(null));
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== repeat) {
      setError({ text: 'تکرار رمز با رمز جدید یکی نیست.', field: 'repeat' });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await backend.admin.saveCredentials({ username, password, currentPassword: current ? currentPassword : undefined });
      setCurrent(r.username);
      setUsername(r.username);
      setPassword('');
      setRepeat('');
      setCurrentPassword('');
      toast('نام کاربری و رمز ذخیره شد');
    } catch (x) {
      setError({ text: x instanceof BackendError ? x.message : 'ذخیره انجام نشد.', field: x instanceof BackendError ? x.field : undefined });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await backend.admin.removeCredentials();
      setCurrent(null);
      toast('ورود با نام کاربری برای حساب شما برداشته شد');
    } catch (x) {
      toast(x instanceof BackendError ? x.message : 'انجام نشد.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const bad = (field: string) => (error?.field === field ? 'border-loss' : '');

  return (
    <section className="card flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-ink">
          <KeyRound size={17} />
        </span>
        <div>
          <h2 className="font-bold">ورود مدیر با نام کاربری و رمز</h2>
          <p className="mt-1 text-xs leading-6 text-faint">
            برای حساب خودتان؛ ورود در <span dir="ltr">/#/admin-login</span> یا «مدیر سایت هستید؟» در صفحه‌ی ورود. ورود با موبایل هم کار می‌کند.
            {current === undefined ? (
              ''
            ) : current ? (
              <>
                {' '}
                نام کاربری فعلی:{' '}
                <b dir="ltr" className="text-ink">
                  {current}
                </b>
              </>
            ) : (
              ' هنوز تنظیم نشده.'
            )}
          </p>
        </div>
      </div>
      <form className="flex flex-col gap-3" onSubmit={save} noValidate>
        {error && <p className="rounded-xl bg-loss/10 px-3 py-2 text-[13px] text-loss">{error.text}</p>}
        <Field label="نام کاربری" htmlFor="cred-username" hint="۳ تا ۳۲ حرف انگلیسی، عدد یا _ . -">
          <input id="cred-username" className={`field ${bad('username')}`} dir="ltr" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={current ? 'رمز جدید' : 'رمز عبور'} htmlFor="cred-password" hint="دست‌کم ۸ حرف">
            <input
              id="cred-password"
              type="password"
              className={`field ${bad('password')}`}
              dir="ltr"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label="تکرار رمز" htmlFor="cred-repeat">
            <input
              id="cred-repeat"
              type="password"
              className={`field ${bad('repeat')}`}
              dir="ltr"
              autoComplete="new-password"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
            />
          </Field>
        </div>
        {current && (
          <Field label="رمز فعلی" htmlFor="cred-current">
            <input
              id="cred-current"
              type="password"
              className={`field ${bad('currentPassword')}`}
              dir="ltr"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Field>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary" disabled={busy || !username || !password}>
            ذخیره
          </button>
          {current && (
            <button type="button" className="btn-ghost text-loss" disabled={busy} onClick={() => void remove()}>
              <Trash2 size={14} /> حذف ورود با رمز
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
