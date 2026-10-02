import clsx from 'clsx';
import { Crown, Moon, RotateCcw, Sun, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Avatar } from '../components/ui/Avatar';
import { ConfirmDialog } from '../components/ui/Modal';
import { Meter } from '../components/ui/controls';
import { addDays, diffDays, fmtDayLong, localDayKey } from '../lib/calendar';
import { fmtNum } from '../lib/format';
import { planDaysLeft } from '../lib/stats';
import { toast, useStore } from '../store/useStore';

/** Downscale an uploaded picture so it stays small in local storage. */
function readAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const size = 160;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const s = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function Settings() {
  const { user, updateUser, theme, setTheme, clearAll, restoreDemo, hasDemoData } = useStore();
  const [name, setName] = useState(user.name);
  const [confirm, setConfirm] = useState<'clear' | 'restore' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setName(user.name), [user.name]);

  const left = planDaysLeft(user.plan.endsAt);
  const total = Math.max(1, diffDays(user.plan.startedAt, user.plan.endsAt));

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold">تنظیمات حساب</h1>

      <section className="card mb-4 p-5">
        <h2 className="mb-4 text-sm font-bold">پروفایل</h2>
        <div className="flex flex-wrap items-center gap-5">
          <Avatar user={user} size={72} />
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              id="avatar-file"
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  updateUser({ avatar: await readAvatar(f) });
                  toast('تصویر پروفایل به‌روزرسانی شد');
                } catch {
                  toast('این فایل تصویر قابل خواندن نیست. یک فایل JPG یا PNG انتخاب کنید.', 'error');
                }
                e.target.value = '';
              }}
            />
            <button type="button" className="btn-soft" onClick={() => fileRef.current?.click()}>
              <Upload size={15} /> بارگذاری تصویر
            </button>
            {user.avatar && (
              <button type="button" className="btn-ghost" onClick={() => updateUser({ avatar: undefined })}>
                حذف تصویر
              </button>
            )}
          </div>
        </div>
        <form
          className="mt-5 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            updateUser({ name: name.trim() });
            toast('نام ذخیره شد');
          }}
        >
          <div className="min-w-[14rem] flex-1">
            <label className="label" htmlFor="profile-name">
              نام نمایشی
            </label>
            <input id="profile-name" className="field" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary py-2.5" disabled={!name.trim() || name.trim() === user.name}>
            ذخیره
          </button>
        </form>
      </section>

      <section className="card mb-4 p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber/15 text-amber">
            <Crown size={18} />
          </span>
          <div>
            <h2 className="text-sm font-bold">{user.plan.name}</h2>
            <p className="num text-xs text-muted">
              از {fmtDayLong(user.plan.startedAt)} تا {fmtDayLong(user.plan.endsAt)}
            </p>
          </div>
          <button
            type="button"
            className="btn-soft ms-auto"
            onClick={() => {
              const base = user.plan.endsAt > localDayKey() ? user.plan.endsAt : localDayKey();
              updateUser({ plan: { ...user.plan, endsAt: addDays(base, 30) } });
              toast('اشتراک ۳۰ روز تمدید شد');
            }}
          >
            تمدید ۳۰ روزه
          </button>
        </div>
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="text-muted">روزهای باقی‌مانده</span>
          <span className="num font-bold">
            {fmtNum(left)} از {fmtNum(total)} روز
          </span>
        </div>
        <Meter value={left / total} tone={left / total < 0.2 ? 'loss' : 'gain'} className="h-2" />
      </section>

      <section className="card mb-4 p-5">
        <h2 className="mb-4 text-sm font-bold">ظاهر</h2>
        <div className="grid grid-cols-2 gap-2 sm:max-w-xs">
          {(['dark', 'light'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={clsx('btn border py-3', theme === t ? 'border-accent bg-accent/10 text-ink' : 'border-line text-muted hover:text-ink')}
            >
              {t === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              {t === 'dark' ? 'تیره' : 'روشن'}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-sm font-bold">داده‌ها</h2>
        <p className="mb-4 text-xs leading-6 text-muted">
          {hasDemoData
            ? 'جلسات، استراتژی‌ها و معاملات فعلی داده‌ی نمونه هستند تا صفحات خالی نباشند. داده‌ها فقط در همین مرورگر ذخیره می‌شوند.'
            : 'داده‌ها فقط در همین مرورگر ذخیره می‌شوند.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-soft text-loss" onClick={() => setConfirm('clear')}>
            <Trash2 size={15} /> پاک کردن همه‌ی داده‌ها
          </button>
          <button type="button" className="btn-soft" onClick={() => setConfirm('restore')}>
            <RotateCcw size={15} /> بازگردانی داده‌ی نمونه
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={confirm === 'clear'}
        onClose={() => setConfirm(null)}
        title="پاک کردن همه‌ی داده‌ها"
        message="همه‌ی جلسات، معاملات، استراتژی‌ها، چک‌لیست‌ها و آمار زمان حذف می‌شوند. پروفایل و اشتراک باقی می‌مانند."
        confirmLabel="پاک کردن"
        onConfirm={() => {
          clearAll();
          toast('همه‌ی داده‌ها پاک شد', 'info');
        }}
      />
      <ConfirmDialog
        open={confirm === 'restore'}
        onClose={() => setConfirm(null)}
        title="بازگردانی داده‌ی نمونه"
        message="داده‌های فعلی با داده‌ی نمونه جایگزین می‌شوند."
        confirmLabel="جایگزین کن"
        onConfirm={() => {
          restoreDemo();
          toast('داده‌ی نمونه بازگردانی شد');
        }}
      />
    </div>
  );
}
